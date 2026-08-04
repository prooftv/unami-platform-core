-- Migration 006: Platform Records — Phase 18A
-- Adds platform-owned governance tables: records, notices
-- These tables are reusable across all applications (Umkhandlu, ITPMS, Schools Portal, etc.)
-- No existing tables are modified.

-- ============================================================
-- notices
-- Governance event origins. Community and statutory notices.
-- Must exist before records (records reference notices via origin_notice_id)
-- ============================================================

CREATE TABLE IF NOT EXISTS notices (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT        NOT NULL,
  title             TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  content           TEXT        NOT NULL CHECK (char_length(content) >= 10),
  status            TEXT        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','published','open','closed','approved','rejected','withdrawn','archived')),
  is_statutory      BOOLEAN     NOT NULL DEFAULT false,
  comment_deadline  TIMESTAMPTZ,
  comments_received INTEGER     NOT NULL DEFAULT 0 CHECK (comments_received >= 0),
  weather_context   JSONB,
  created_by        TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-derive is_statutory from type on insert/update
CREATE OR REPLACE FUNCTION set_notice_is_statutory()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_statutory := NEW.type IN (
    'eia','rezoning','land-use','township','building',
    'mining','liquor','telecom','estate','liquidation','pto'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notices_set_statutory
  BEFORE INSERT OR UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION set_notice_is_statutory();

CREATE TRIGGER notices_updated_at
  BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS notices_status_idx ON notices (status);
CREATE INDEX IF NOT EXISTS notices_type_idx   ON notices (type);
CREATE INDEX IF NOT EXISTS notices_created_at_idx ON notices (created_at DESC);

-- RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY notices_anon_read ON notices
  FOR SELECT TO anon
  USING (status IN ('published', 'open'));

CREATE POLICY notices_auth_all ON notices
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE notices IS 'Governance event origins — community and statutory notices';
COMMENT ON COLUMN notices.is_statutory IS 'Derived from type on insert — not user-supplied';
COMMENT ON COLUMN notices.comments_received IS 'Operator-maintained count from webhook data';

-- ============================================================
-- records
-- Institutional memory nodes with lineage chain.
-- ============================================================

CREATE TABLE IF NOT EXISTS records (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT        NOT NULL,
  title            TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  content          TEXT        NOT NULL CHECK (char_length(content) >= 10),
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','adopted','approved','resolved','rejected')),
  authority_id     TEXT,
  approved_by      TEXT,
  parent_record_id UUID        REFERENCES records(id) ON DELETE SET NULL,
  origin_notice_id UUID        REFERENCES notices(id) ON DELETE SET NULL,
  weather_context  JSONB,
  created_by       TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER records_updated_at
  BEFORE UPDATE ON records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS records_status_idx          ON records (status);
CREATE INDEX IF NOT EXISTS records_type_idx            ON records (type);
CREATE INDEX IF NOT EXISTS records_parent_record_idx   ON records (parent_record_id);
CREATE INDEX IF NOT EXISTS records_origin_notice_idx   ON records (origin_notice_id);
CREATE INDEX IF NOT EXISTS records_created_at_idx      ON records (created_at DESC);

-- RLS
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

CREATE POLICY records_auth_read ON records
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY records_auth_write ON records
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

COMMENT ON TABLE records IS 'Institutional memory nodes — governance records with lineage chain';
COMMENT ON COLUMN records.parent_record_id IS 'Lineage chain — references parent record';
COMMENT ON COLUMN records.origin_notice_id IS 'The notice that originated this record';
COMMENT ON COLUMN records.weather_context IS 'WeatherSnapshot — auto-captured, never manually entered';
