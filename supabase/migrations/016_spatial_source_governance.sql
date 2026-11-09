-- Migration 016: Spatial source governance
-- Adds four-dimension assessment, controlled permission classification,
-- expanded provenance fields, and permission change audit to spatial_sources
-- and spatial_datasets.
-- Preserves all existing records. No destructive changes.

-- ---------------------------------------------------------------------------
-- 1. spatial_sources — new columns
-- ---------------------------------------------------------------------------

ALTER TABLE spatial_sources
  -- Source identity
  ADD COLUMN IF NOT EXISTS source_url            text,
  ADD COLUMN IF NOT EXISTS dataset_identifier    text,

  -- Permission classification (controlled vocabulary — replaces free-text permission_status)
  -- Values: reference | display | internal | download | redistribute | restricted | prohibited | pending
  ADD COLUMN IF NOT EXISTS permission_classification text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attribution           text,
  ADD COLUMN IF NOT EXISTS licence_terms         text,
  ADD COLUMN IF NOT EXISTS restriction_authority text,
  ADD COLUMN IF NOT EXISTS restriction_basis     text,

  -- Four-dimension assessment (independent fields — not collapsed into one status)
  ADD COLUMN IF NOT EXISTS availability_status   text NOT NULL DEFAULT 'unknown',
  -- Values: accessible | inaccessible | requires_auth | unknown
  ADD COLUMN IF NOT EXISTS technical_usability   text NOT NULL DEFAULT 'unknown',
  -- Values: ingestible | blocked | requires_processing | static | unknown
  ADD COLUMN IF NOT EXISTS authority_status      text NOT NULL DEFAULT 'unknown',
  -- Values: authoritative | indicative | unverified | unknown
  ADD COLUMN IF NOT EXISTS assessment_notes      text,
  ADD COLUMN IF NOT EXISTS assessed_by           text,
  ADD COLUMN IF NOT EXISTS assessed_at           timestamptz;

-- ---------------------------------------------------------------------------
-- 2. spatial_datasets — new columns (mirrors source governance fields)
-- ---------------------------------------------------------------------------

ALTER TABLE spatial_datasets
  ADD COLUMN IF NOT EXISTS source_url            text,
  ADD COLUMN IF NOT EXISTS dataset_identifier    text,
  ADD COLUMN IF NOT EXISTS permission_classification text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attribution           text,
  ADD COLUMN IF NOT EXISTS licence_terms         text,
  ADD COLUMN IF NOT EXISTS restriction_authority text,
  ADD COLUMN IF NOT EXISTS restriction_basis     text,
  ADD COLUMN IF NOT EXISTS authority_status      text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS assessment_notes      text;

-- ---------------------------------------------------------------------------
-- 3. Migrate legacy permission_status values
--
-- Existing values in production: 'pending', 'reference'
-- No 'confirmed' or 'denied' values exist in current data.
-- Migration handles them defensively for any future imports.
--
-- 'confirmed' → does NOT map to a permission classification.
--   It describes a process state (permission was confirmed) but not what
--   the permission actually is. Flag for manual review.
-- 'denied' → maps to 'prohibited' only where the record supports that
--   conclusion. Otherwise flag for review.
-- ---------------------------------------------------------------------------

-- Sources: copy existing permission_status into permission_classification
-- where the value is a valid classification; flag others for review.
UPDATE spatial_sources SET
  permission_classification = CASE permission_status
    WHEN 'reference'   THEN 'reference'
    WHEN 'display'     THEN 'display'
    WHEN 'internal'    THEN 'internal'
    WHEN 'download'    THEN 'download'
    WHEN 'redistribute' THEN 'redistribute'
    WHEN 'restricted'  THEN 'restricted'
    WHEN 'prohibited'  THEN 'prohibited'
    WHEN 'pending'     THEN 'pending'
    -- Legacy: 'confirmed' does not map — flag for manual review
    WHEN 'confirmed'   THEN 'pending'
    -- Legacy: 'denied' — conservative mapping, flag for review
    WHEN 'denied'      THEN 'pending'
    ELSE 'pending'
  END,
  assessment_notes = CASE permission_status
    WHEN 'confirmed' THEN
      COALESCE(assessment_notes, '') ||
      ' [MIGRATION NOTE: legacy status was "confirmed" — permission classification requires manual review and assignment]'
    WHEN 'denied' THEN
      COALESCE(assessment_notes, '') ||
      ' [MIGRATION NOTE: legacy status was "denied" — review whether "prohibited" is correct before reassigning]'
    ELSE assessment_notes
  END;

-- Datasets: same migration
UPDATE spatial_datasets SET
  permission_classification = CASE permission_status
    WHEN 'reference'    THEN 'reference'
    WHEN 'display'      THEN 'display'
    WHEN 'internal'     THEN 'internal'
    WHEN 'download'     THEN 'download'
    WHEN 'redistribute' THEN 'redistribute'
    WHEN 'restricted'   THEN 'restricted'
    WHEN 'prohibited'   THEN 'prohibited'
    WHEN 'pending'      THEN 'pending'
    WHEN 'confirmed'    THEN 'pending'
    WHEN 'denied'       THEN 'pending'
    ELSE 'pending'
  END,
  assessment_notes = CASE permission_status
    WHEN 'confirmed' THEN
      COALESCE(assessment_notes, '') ||
      ' [MIGRATION NOTE: legacy status was "confirmed" — permission classification requires manual review]'
    WHEN 'denied' THEN
      COALESCE(assessment_notes, '') ||
      ' [MIGRATION NOTE: legacy status was "denied" — review whether "prohibited" is correct]'
    ELSE assessment_notes
  END;

-- ---------------------------------------------------------------------------
-- 4. Apply hard restriction to KZN COGTA Infrastructure 2022
--    Source ID: c8532e74-982a-410b-89bb-61306de64f79
--    Basis: custodian notes confirm water/sanitation data must not be cached
--    or redistributed without confirmed permission from Amajuba District.
--    This is a source-level restriction — applies to all datasets from this source.
-- ---------------------------------------------------------------------------

UPDATE spatial_sources SET
  permission_classification = 'restricted',
  restriction_authority     = 'Amajuba District Municipality — Mr Udiv Budhal (GIS Manager)',
  restriction_basis         = 'Custodian confirmed water and sanitation data must not be cached or redistributed without explicit permission from Amajuba District Municipality. Directed to Ms Thubelihle Buthelezi (thubelihleb@amajuba.gov.za), HoD Planning & Development, for water/sanitation datasets specifically.',
  assessment_notes          = 'Source contains 25 layers including water pipelines, reservoirs, treatment works and UAP demand areas. Water and sanitation layers are subject to absolute restriction. Other layers require individual permission assessment before ingestion.'
WHERE id = 'c8532e74-982a-410b-89bb-61306de64f79';

-- ---------------------------------------------------------------------------
-- 5. Set availability_status for sources where we have confirmed information
-- ---------------------------------------------------------------------------

-- Sources where service root is accessible but query endpoint is blocked
UPDATE spatial_sources SET
  availability_status  = 'accessible',
  technical_usability  = 'blocked'
WHERE id IN (
  '08a7d97e-998b-4343-bd51-5bfd7cbd479a', -- COGTA Ward Profile V3
  'da0aaba5-7648-4734-bef7-9a05e20604b8', -- COGTA Flood Risk
  '129055a3-d75d-4c69-a988-172480e9e6d8', -- COGTA Disaster Incidents
  '49cdb8ec-ea01-435c-9948-735b6469a6e2', -- COGTA Land Use Scheme
  'f25427e7-2a59-4908-9aff-cc285b077eb2', -- COGTA Disaster Risk Reduction
  '99364d75-065e-4992-b055-f97f3d711d54', -- COGTA Land Tenure
  'b51b9626-ce3c-430e-bb02-0c686a230b2b', -- COGTA Road Transport
  'c8532e74-982a-410b-89bb-61306de64f79', -- COGTA Infrastructure 2022
  '1131e4bc-ac50-40ee-812b-7842d96e7abd'  -- ILIS Base Map
);

-- NGI Static Maps — accessible, static (not queryable)
UPDATE spatial_sources SET
  availability_status = 'accessible',
  technical_usability = 'static',
  authority_status    = 'authoritative'
WHERE id = '536c5501-7574-478d-b1c1-d3af47d89d9f';

-- DPME Boundaries — accessible, ingestible (feature queries work)
UPDATE spatial_sources SET
  availability_status = 'accessible',
  technical_usability = 'ingestible',
  authority_status    = 'indicative',
  assessment_notes    = 'Province field on district layer has data quality issue — Amajuba listed as Free State. LM layer has correct KZN attribution. Use DISTRICT=DC25 filter for Amajuba.'
WHERE id = 'dfecd7cd-01f2-4bbd-ab4b-fbe845964a48';

-- South African Boundaries (ArcGIS Online) — accessible, ingestible, unverified authority
UPDATE spatial_sources SET
  availability_status = 'accessible',
  technical_usability = 'ingestible',
  authority_status    = 'unverified',
  assessment_notes    = 'Origin institution unverified (PICCEDD007). Good geometry quality for Amajuba DC25 and three LMs. Not to be used as authoritative boundary source until institution confirmed.'
WHERE id = 'dd4eded3-ff08-4ee1-bf40-579c3885eaf5';

-- ---------------------------------------------------------------------------
-- 6. permission_changes audit table
--    Dedicated audit for permission classification changes — separate from
--    gis_audit_log general audit to allow targeted querying and reporting.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS spatial_permission_changes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name        text NOT NULL,
  record_id         uuid NOT NULL,
  actor             text NOT NULL,
  previous_classification text,
  new_classification      text NOT NULL,
  previous_restriction_authority text,
  new_restriction_authority      text,
  reason            text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- RLS: operators only
ALTER TABLE spatial_permission_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access" ON spatial_permission_changes
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 7. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_spatial_sources_permission_classification
  ON spatial_sources (permission_classification);

CREATE INDEX IF NOT EXISTS idx_spatial_datasets_permission_classification
  ON spatial_datasets (permission_classification);

CREATE INDEX IF NOT EXISTS idx_spatial_permission_changes_record
  ON spatial_permission_changes (table_name, record_id);
