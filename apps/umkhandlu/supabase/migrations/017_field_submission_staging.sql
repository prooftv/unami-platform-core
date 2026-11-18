-- Migration 017: Field submission staging
-- Adds tables for GratisGIS Data Collection submissions, collector identity,
-- submission lifecycle (pending → under_review → approved/rejected/correction_requested),
-- immutable audit trail, and attachment references.
-- Additive and safe for existing records.

-- ─── Collector identity ───────────────────────────────────────────────────────
-- Maps GratisGIS/Keycloak user IDs to display names and access status.
-- Operators create collector accounts; this table mirrors them for CC workflows.
CREATE TABLE IF NOT EXISTS field_collectors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gratisgis_user_id   text NOT NULL UNIQUE,   -- Keycloak sub claim
  display_name        text NOT NULL,
  email               text,
  active              boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE field_collectors IS
  'GratisGIS/Keycloak collector accounts mirrored for CC operator workflows.';

-- ─── Field submissions ────────────────────────────────────────────────────────
-- One row per GratisGIS Data Collection submission received by CC.
-- Lifecycle: pending → under_review → approved | rejected | correction_requested
CREATE TABLE IF NOT EXISTS field_submissions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- GratisGIS provenance
  gratisgis_submission_id text NOT NULL UNIQUE,  -- stable idempotency key from GratisGIS
  gratisgis_collection_id text NOT NULL,          -- data_collection item ID in GratisGIS
  gratisgis_layer_id      text,                   -- data_layer item ID in GratisGIS

  -- Collector
  collector_id            uuid REFERENCES field_collectors(id),
  collector_display_name  text NOT NULL,          -- denormalised for audit stability

  -- Collection activity classification
  activity_type           text NOT NULL CHECK (activity_type IN (
    'locality_mapping',
    'infrastructure_inventory',
    'community_facilities',
    'development_monitoring',
    'notice_site_verification'
  )),

  -- Spatial data (GeoJSON geometry from submission)
  geometry_geojson        jsonb,                  -- null for non-spatial submissions
  geometry_type           text,                   -- Point, Polygon, etc.
  gps_accuracy_metres     numeric(8,2),

  -- Submission attributes (all form field values)
  attributes              jsonb NOT NULL DEFAULT '{}',

  -- Lifecycle
  status                  text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'under_review',
    'approved',
    'rejected',
    'correction_requested'
  )),

  -- Operator review
  reviewed_by             uuid REFERENCES user_profiles(id),
  reviewed_at             timestamptz,
  review_notes            text,

  -- Cross-system references (set after approval)
  approved_feature_id     uuid REFERENCES spatial_staged_features(id),
  sanity_document_id      text,                   -- Sanity _id if synced
  notice_id               uuid REFERENCES notices(id),

  -- Sync state
  sanity_sync_status      text NOT NULL DEFAULT 'not_required' CHECK (sanity_sync_status IN (
    'not_required', 'pending', 'synced', 'failed'
  )),
  sanity_sync_attempted_at timestamptz,
  sanity_sync_error       text,

  -- Idempotency
  idempotency_key         text UNIQUE,            -- for retry safety

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE field_submissions IS
  'Staging table for GratisGIS Data Collection submissions awaiting operator review.';
COMMENT ON COLUMN field_submissions.gratisgis_submission_id IS
  'Stable identifier from GratisGIS — used as idempotency key on ingest.';
COMMENT ON COLUMN field_submissions.status IS
  'pending: received, not yet reviewed. under_review: operator has opened it.
   approved: promoted to spatial_staged_features. rejected: not accepted.
   correction_requested: returned to collector.';

-- ─── Submission audit trail ───────────────────────────────────────────────────
-- Immutable log of every state transition. Never updated, only appended.
CREATE TABLE IF NOT EXISTS field_submission_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES field_submissions(id) ON DELETE CASCADE,
  event_type      text NOT NULL CHECK (event_type IN (
    'received',
    'review_opened',
    'approved',
    'rejected',
    'correction_requested',
    'resubmitted',
    'sanity_synced',
    'sanity_sync_failed',
    'feature_promoted'
  )),
  actor_id        uuid REFERENCES user_profiles(id),  -- null for system events
  actor_type      text NOT NULL DEFAULT 'system' CHECK (actor_type IN ('operator', 'system', 'collector')),
  notes           text,
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE field_submission_events IS
  'Immutable audit trail for field submission state transitions.';

-- ─── Submission attachments ───────────────────────────────────────────────────
-- Photo and file references per submission (stored in GratisGIS object storage).
CREATE TABLE IF NOT EXISTS field_submission_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES field_submissions(id) ON DELETE CASCADE,
  gratisgis_attachment_id text NOT NULL,
  filename        text NOT NULL,
  mime_type       text,
  size_bytes      bigint,
  gratisgis_url   text NOT NULL,   -- URL on GratisGIS storage (not public)
  public_url      text,            -- set after operator approves and publishes
  caption         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE field_submission_attachments IS
  'Photo and file attachments for field submissions, referenced from GratisGIS storage.';

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS field_submissions_status_idx
  ON field_submissions(status);
CREATE INDEX IF NOT EXISTS field_submissions_activity_type_idx
  ON field_submissions(activity_type);
CREATE INDEX IF NOT EXISTS field_submissions_collector_id_idx
  ON field_submissions(collector_id);
CREATE INDEX IF NOT EXISTS field_submissions_created_at_idx
  ON field_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS field_submission_events_submission_id_idx
  ON field_submission_events(submission_id);
CREATE INDEX IF NOT EXISTS field_submission_events_created_at_idx
  ON field_submission_events(created_at DESC);
CREATE INDEX IF NOT EXISTS field_submission_attachments_submission_id_idx
  ON field_submission_attachments(submission_id);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'field_collectors_updated_at'
  ) THEN
    CREATE TRIGGER field_collectors_updated_at
      BEFORE UPDATE ON field_collectors
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'field_submissions_updated_at'
  ) THEN
    CREATE TRIGGER field_submissions_updated_at
      BEFORE UPDATE ON field_submissions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- Operators only — no anon or public access to field submissions.
ALTER TABLE field_collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_submission_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_submission_attachments ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by CC server-side actions).
-- Anon and authenticated roles have no access by default (no policies = deny all).
-- Add operator-role policies here when auth is wired.

-- ─── Grants ───────────────────────────────────────────────────────────────────
-- Service role already has full access via RLS bypass.
-- Anon role: no access (intentional — field submissions are not public).
REVOKE ALL ON field_collectors FROM anon, authenticated;
REVOKE ALL ON field_submissions FROM anon, authenticated;
REVOKE ALL ON field_submission_events FROM anon, authenticated;
REVOKE ALL ON field_submission_attachments FROM anon, authenticated;
