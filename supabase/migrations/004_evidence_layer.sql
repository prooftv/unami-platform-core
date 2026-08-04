-- Migration 004 — Evidence Layer
-- Phase 17F: Evidence attachments on moments + weather context capture.
-- Apply after 003_participation_engine.sql.

-- ---------------------------------------------------------------------------
-- evidence
-- Formal evidence attachments on moments. Additive only — never deleted.
-- ---------------------------------------------------------------------------

CREATE TABLE evidence (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id    UUID        NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL CHECK (char_length(title) >= 2),
  file_type    TEXT        NOT NULL CHECK (file_type IN ('image','document','pdf')),
  storage_path TEXT        NOT NULL,
  public_url   TEXT        NOT NULL,
  file_size    BIGINT      NOT NULL CHECK (file_size > 0),
  mime_type    TEXT        NOT NULL,
  uploaded_by  TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX evidence_moment_id_idx ON evidence (moment_id);

-- RLS
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

-- anon can read evidence on broadcasted moments (joined via moment_id)
CREATE POLICY "anon_read_evidence" ON evidence
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM moments m
      WHERE m.id = evidence.moment_id
        AND m.status = 'broadcasted'
        AND m.publish_to_pwa = true
    )
  );

CREATE POLICY "authenticated_read_evidence" ON evidence
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "service_role_all_evidence" ON evidence
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- moments — add weather_context
-- ---------------------------------------------------------------------------

ALTER TABLE moments
  ADD COLUMN IF NOT EXISTS weather_context JSONB DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- Supabase Storage bucket for evidence files
-- Create via Supabase dashboard or CLI: supabase storage create evidence
-- Bucket policy: authenticated upload, public read
-- ---------------------------------------------------------------------------
