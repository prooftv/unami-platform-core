-- Migration 019: Coordinate discrepancy detection and operator review
-- Creates spatial_coordinate_discrepancies table and supporting structures.
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)

-- ─── Discrepancy review status ───────────────────────────────────────────────
-- pending-review          : detected, awaiting operator action
-- requires-configuration  : no threshold rule configured for this source/precision pair
-- confirmed-discrepancy   : operator confirmed both sources differ and the gap is material
-- accepted-variation      : operator accepted the distance as explainable variation
-- resolved-verified       : operator verified one source and resolved the discrepancy
-- dismissed               : operator dismissed with a recorded reason

CREATE TABLE IF NOT EXISTS spatial_coordinate_discrepancies (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Subject identity
  subject_id                text NOT NULL,
  subject_type              text NOT NULL CHECK (subject_type IN (
    'listing', 'developmentNotice', 'campaign'
  )),
  subject_label             text,

  -- Source A — Governance Node (Sanity)
  gn_record_id              text NOT NULL,
  gn_source_name            text NOT NULL,
  gn_source_type            text NOT NULL CHECK (gn_source_type IN (
    'operator-entered', 'dataset-import', 'cc-approved', 'external-api'
  )),
  gn_coordinate_role        text NOT NULL CHECK (gn_coordinate_role IN (
    'site', 'area-reference', 'facility'
  )),
  gn_lat                    double precision NOT NULL,
  gn_lng                    double precision NOT NULL,
  gn_location_precision     text,
  gn_verification_status    text NOT NULL CHECK (gn_verification_status IN (
    'operator-verified', 'dataset-sourced', 'unverified'
  )),
  gn_acquisition_date       date,

  -- Source B — Control Centre (spatial_staged_features)
  cc_feature_id             uuid REFERENCES spatial_staged_features(id) ON DELETE SET NULL,
  cc_source_name            text NOT NULL,
  cc_source_type            text NOT NULL CHECK (cc_source_type IN (
    'operator-entered', 'dataset-import', 'cc-approved', 'external-api'
  )),
  cc_coordinate_role        text NOT NULL CHECK (cc_coordinate_role IN (
    'site', 'area-reference', 'facility'
  )),
  cc_lat                    double precision NOT NULL,
  cc_lng                    double precision NOT NULL,
  cc_location_precision     text,
  cc_verification_status    text NOT NULL CHECK (cc_verification_status IN (
    'operator-verified', 'dataset-sourced', 'unverified'
  )),
  cc_acquisition_date       date,

  -- Measurement
  distance_metres           double precision NOT NULL,
  calculation_method        text NOT NULL DEFAULT 'haversine-wgs84',

  -- Threshold rule applied
  rule_id                   text,
  rule_version              text,
  rule_threshold_metres     double precision,

  -- Review
  review_status             text NOT NULL DEFAULT 'pending-review' CHECK (review_status IN (
    'pending-review',
    'requires-configuration',
    'confirmed-discrepancy',
    'accepted-variation',
    'resolved-verified',
    'dismissed'
  )),
  reviewer_id               text,
  reviewed_at               timestamptz,
  review_outcome            text,
  review_notes              text,

  -- Audit
  detected_at               timestamptz NOT NULL DEFAULT now(),
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE spatial_coordinate_discrepancies IS
  'Records coordinate discrepancies detected between Governance Node (Sanity) records
   and Control Centre staged spatial features. Both original source values are preserved.
   No source is overwritten. Operator review is required before any resolution.';

-- Indexes
CREATE INDEX IF NOT EXISTS scd_subject_idx
  ON spatial_coordinate_discrepancies(subject_id, subject_type);
CREATE INDEX IF NOT EXISTS scd_review_status_idx
  ON spatial_coordinate_discrepancies(review_status);
CREATE INDEX IF NOT EXISTS scd_gn_record_idx
  ON spatial_coordinate_discrepancies(gn_record_id);
CREATE INDEX IF NOT EXISTS scd_cc_feature_idx
  ON spatial_coordinate_discrepancies(cc_feature_id) WHERE cc_feature_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS scd_detected_at_idx
  ON spatial_coordinate_discrepancies(detected_at DESC);

-- Idempotency: one active (non-dismissed/resolved) discrepancy per subject+feature pair
CREATE UNIQUE INDEX IF NOT EXISTS scd_active_pair_idx
  ON spatial_coordinate_discrepancies(gn_record_id, cc_feature_id)
  WHERE review_status IN ('pending-review', 'requires-configuration', 'confirmed-discrepancy');

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'scd_updated_at') THEN
    CREATE TRIGGER scd_updated_at
      BEFORE UPDATE ON spatial_coordinate_discrepancies
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- ─── Access control ───────────────────────────────────────────────────────────
-- Only service_role (CC server actions) may create or modify discrepancy records.
-- No anon or authenticated direct access.
ALTER TABLE spatial_coordinate_discrepancies ENABLE ROW LEVEL SECURITY;
GRANT ALL ON spatial_coordinate_discrepancies TO service_role;
REVOKE ALL ON spatial_coordinate_discrepancies FROM anon, authenticated;

-- ─── Threshold configuration ──────────────────────────────────────────────────
-- Configurable rules per (source_type, coordinate_role, location_precision) tuple.
-- No universal threshold is hardcoded. Operator must confirm each rule.
-- When no rule matches, detection records requires-configuration status.

CREATE TABLE IF NOT EXISTS spatial_discrepancy_rules (
  id                  text PRIMARY KEY,
  version             text NOT NULL DEFAULT '1',
  description         text NOT NULL,
  source_type_a       text CHECK (source_type_a IN (
    'operator-entered', 'dataset-import', 'cc-approved', 'external-api', '*'
  )),
  source_type_b       text CHECK (source_type_b IN (
    'operator-entered', 'dataset-import', 'cc-approved', 'external-api', '*'
  )),
  coordinate_role     text CHECK (coordinate_role IN ('site', 'facility', '*')),
  precision_tier      text CHECK (precision_tier IN (
    'verified', 'operator-provided', 'approximate', 'locality-only', '*'
  )),
  threshold_metres    double precision NOT NULL,
  active              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE spatial_discrepancy_rules IS
  'Configurable threshold rules for coordinate discrepancy detection.
   Rules are matched by source_type, coordinate_role and precision_tier.
   Wildcard (*) matches any value. No rule is active by default — operator must confirm.
   These starting values are proposals only and must be reviewed before activation.';

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sdr_updated_at') THEN
    CREATE TRIGGER sdr_updated_at
      BEFORE UPDATE ON spatial_discrepancy_rules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

ALTER TABLE spatial_discrepancy_rules ENABLE ROW LEVEL SECURITY;
GRANT ALL ON spatial_discrepancy_rules TO service_role;
REVOKE ALL ON spatial_discrepancy_rules FROM anon, authenticated;

-- Seed proposed rules — all inactive until operator confirms
-- These are starting values from Section 12.5 of the implementation plan.
-- Operator must set active=true for each rule they approve.
INSERT INTO spatial_discrepancy_rules
  (id, version, description, source_type_a, source_type_b, coordinate_role, precision_tier, threshold_metres, active)
VALUES
  ('rule-verified-vs-verified',       '1', 'Verified vs verified — flag >100m',          '*',                '*',               'site',     'verified',         100,   false),
  ('rule-operator-vs-dataset',        '1', 'Operator-entered vs dataset-import — flag >500m', 'operator-entered', 'dataset-import', 'site',     'operator-provided', 500,  false),
  ('rule-approximate-any',            '1', 'Approximate precision vs any — flag >2000m', '*',                '*',               'site',     'approximate',      2000,  false),
  ('rule-facility-operator-dataset',  '1', 'Facility: operator vs dataset — flag >500m', 'operator-entered', 'dataset-import', 'facility', '*',                500,   false)
ON CONFLICT (id) DO NOTHING;
