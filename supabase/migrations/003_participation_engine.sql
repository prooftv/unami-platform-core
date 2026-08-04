-- Migration 003 — Participation Engine
-- Phase 17E: Public Participation Engine
-- Adds participation_log (anonymised, no PII) and participation_count denormalisation.
-- Apply after 002_governance_adaptation.sql.

-- ---------------------------------------------------------------------------
-- participation_log
-- Anonymised record of participation submissions.
-- Personal data (name, contact) is webhook-delivered only — never stored here.
-- ---------------------------------------------------------------------------

CREATE TABLE participation_log (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id         UUID        NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  response_type     TEXT        NOT NULL CHECK (response_type IN ('comment','support','concern','question')),
  relationship      TEXT        NOT NULL CHECK (relationship IN ('resident','business','community','organisation','other')),
  popia_consent     BOOLEAN     NOT NULL,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT participation_log_popia_required CHECK (popia_consent = true)
);

CREATE INDEX participation_log_moment_id_idx ON participation_log (moment_id);
CREATE INDEX participation_log_submitted_at_idx ON participation_log (submitted_at);

-- RLS: anon has no access. service_role has full access.
ALTER TABLE participation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON participation_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- moment_stats — add participation_count
-- ---------------------------------------------------------------------------

ALTER TABLE moment_stats
  ADD COLUMN IF NOT EXISTS participation_count INTEGER NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Webhook URL system setting (if not already present)
-- The participation Edge Function reads this to deliver webhook payloads.
-- ---------------------------------------------------------------------------

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('participation_webhook_url', '', 'Webhook URL for participation submissions. POST target for n8n, Make, or custom endpoint.')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- DB function: increment_participation_count
-- Called by the participation Edge Function after a successful log insert.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_participation_count(p_moment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE moment_stats
  SET participation_count = participation_count + 1,
      updated_at = NOW()
  WHERE moment_id = p_moment_id;
END;
$$;
