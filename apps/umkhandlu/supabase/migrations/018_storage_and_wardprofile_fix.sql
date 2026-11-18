-- Migration 018: Storage architecture and WardProfile coordinate fix
-- Adds storage_objects metadata table, RLS policies for storage buckets,
-- and corrects WardProfile 2021 null-island coordinates.
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)

-- ─── Storage object metadata ─────────────────────────────────────────────────
-- Tracks every file uploaded to Supabase Storage with provenance,
-- access classification, and relationship to source records.
CREATE TABLE IF NOT EXISTS storage_objects (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Storage location
  bucket_id           text NOT NULL CHECK (bucket_id IN (
    'field-evidence', 'governance-evidence', 'public-assets', 'spatial-exports'
  )),
  storage_path        text NOT NULL,                    -- path within bucket
  public_url          text,                             -- set only for public-assets

  -- File metadata
  filename            text NOT NULL,
  mime_type           text NOT NULL,
  size_bytes          bigint,
  file_hash           text,                             -- SHA-256 hex, set on upload

  -- Provenance
  uploaded_by         text NOT NULL,                    -- operator email
  uploaded_at         timestamptz NOT NULL DEFAULT now(),

  -- Record relationships (at most one set)
  submission_id       uuid REFERENCES field_submissions(id) ON DELETE SET NULL,
  notice_id           uuid REFERENCES notices(id) ON DELETE SET NULL,
  evidence_record_id  uuid REFERENCES evidence_records(id) ON DELETE SET NULL,

  -- Access classification
  access_class        text NOT NULL DEFAULT 'private' CHECK (access_class IN (
    'private',          -- operator-only, never public
    'restricted',       -- operator + specific roles
    'approved-public'   -- deliberately published to public-assets
  )),

  -- Lifecycle
  migration_state     text NOT NULL DEFAULT 'native' CHECK (migration_state IN (
    'native',           -- uploaded directly to Supabase Storage
    'migrated',         -- migrated from external source (e.g. gratisgis_url)
    'pending-migration' -- external URL exists, not yet migrated
  )),
  external_url        text,                             -- original URL before migration
  deleted_at          timestamptz,                      -- soft delete

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE storage_objects IS
  'Metadata registry for all files stored in Supabase Storage buckets.
   Every upload must have a corresponding record here.
   Provides provenance, access classification and record relationships.';

CREATE INDEX IF NOT EXISTS storage_objects_bucket_idx ON storage_objects(bucket_id);
CREATE INDEX IF NOT EXISTS storage_objects_submission_idx ON storage_objects(submission_id) WHERE submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS storage_objects_notice_idx ON storage_objects(notice_id) WHERE notice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS storage_objects_uploaded_by_idx ON storage_objects(uploaded_by);
CREATE INDEX IF NOT EXISTS storage_objects_access_class_idx ON storage_objects(access_class);
CREATE UNIQUE INDEX IF NOT EXISTS storage_objects_bucket_path_idx ON storage_objects(bucket_id, storage_path) WHERE deleted_at IS NULL;

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'storage_objects_updated_at') THEN
    CREATE TRIGGER storage_objects_updated_at
      BEFORE UPDATE ON storage_objects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- RLS
ALTER TABLE storage_objects ENABLE ROW LEVEL SECURITY;
GRANT ALL ON storage_objects TO service_role;
REVOKE ALL ON storage_objects FROM anon;
GRANT SELECT ON storage_objects TO authenticated;

-- ─── Storage bucket RLS policies ─────────────────────────────────────────────
-- field-evidence: service_role only (CC server actions upload/download)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('field-evidence', 'field-evidence', false, 52428800)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('governance-evidence', 'governance-evidence', false, 52428800)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('public-assets', 'public-assets', true, 10485760)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('spatial-exports', 'spatial-exports', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Private bucket policies: service_role full access, no anon/authenticated direct access
-- All access goes through CC server-side proxy routes
CREATE POLICY "field_evidence_service_role" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'field-evidence')
  WITH CHECK (bucket_id = 'field-evidence');

CREATE POLICY "governance_evidence_service_role" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'governance-evidence')
  WITH CHECK (bucket_id = 'governance-evidence');

CREATE POLICY "spatial_exports_service_role" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'spatial-exports')
  WITH CHECK (bucket_id = 'spatial-exports');

-- public-assets: service_role write, anon read (public bucket)
CREATE POLICY "public_assets_service_role_write" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'public-assets')
  WITH CHECK (bucket_id = 'public-assets');

CREATE POLICY "public_assets_anon_read" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'public-assets');

-- ─── Fix WardProfile 2021 null-island coordinates ────────────────────────────
-- The MDB WardProfile 2021 dataset was ingested with all features at [0,0].
-- This dataset contains demographic attributes (CAT_B, WardID, WardNo) but
-- no valid geometry. The correct approach is to mark these features as
-- geometry_valid=false and record the issue, rather than leaving them at [0,0]
-- where they silently fail bbox filters.
UPDATE spatial_staged_features
SET
  geometry_valid = false,
  geometry_issues = COALESCE(geometry_issues, '[]'::jsonb) || '["null_island: coordinates are [0,0] — geometry was not ingested correctly"]'::jsonb
WHERE
  dataset_id = (
    SELECT id FROM spatial_datasets WHERE name = 'MDB WardProfile 2021 — Amajuba DC25' LIMIT 1
  )
  AND operator_status = 'approved'
  AND (feature_geojson->>'type') = 'Point'
  AND feature_geojson->'coordinates' = '[0,0]'::jsonb;

-- Mark the dataset as needing re-ingestion
UPDATE spatial_datasets
SET
  status = 'staged',
  active = false
WHERE name = 'MDB WardProfile 2021 — Amajuba DC25';

-- Record the issue in the audit log
INSERT INTO gis_audit_log (table_name, record_id, actor, action, reason, new_state)
SELECT
  'spatial_datasets',
  id,
  'system:migration-018',
  'update',
  'WardProfile 2021 features had null-island coordinates [0,0] — dataset deactivated pending re-ingestion with correct geometry',
  jsonb_build_object('status', 'staged', 'active', false, 'issue', 'null_island_coordinates')
FROM spatial_datasets
WHERE name = 'MDB WardProfile 2021 — Amajuba DC25';
