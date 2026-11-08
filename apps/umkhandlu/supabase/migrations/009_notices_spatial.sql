-- 009_notices_spatial.sql
-- Creates the notices table in the Umkhandlu Control Centre project.
-- The notices table exists in the Moments project (dpydmpydyfrrdhuezvgi) but not here.
-- This version includes spatial columns (latitude, longitude, ward_ref) from the start.
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)

CREATE TABLE IF NOT EXISTS notices (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type              TEXT NOT NULL,
  title             TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  content           TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 5000),
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                      'draft', 'published', 'open', 'closed',
                      'approved', 'rejected', 'withdrawn', 'archived'
                    )),
  is_statutory      BOOLEAN NOT NULL DEFAULT false,
  comment_deadline  TIMESTAMPTZ,
  comments_received INTEGER NOT NULL DEFAULT 0 CHECK (comments_received >= 0),
  -- Spatial context — populated when boundary data is ingested
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  ward_ref          TEXT,
  created_by        TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notices_status_idx      ON notices(status);
CREATE INDEX IF NOT EXISTS notices_statutory_idx   ON notices(is_statutory);
CREATE INDEX IF NOT EXISTS notices_created_idx     ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS notices_coords_idx      ON notices(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notices_updated_at ON notices;
CREATE TRIGGER notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION set_notices_updated_at();

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_notices"   ON notices FOR ALL     TO service_role  USING (true) WITH CHECK (true);
CREATE POLICY "auth_notices" ON notices FOR SELECT  TO authenticated USING (true);
CREATE POLICY "anon_notices" ON notices FOR SELECT  TO anon
  USING (status IN ('published', 'open'));

GRANT SELECT, INSERT, UPDATE ON notices TO authenticated;
GRANT ALL ON notices TO service_role;

NOTIFY pgrst, 'reload schema';
