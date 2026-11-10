-- 017_node_participation_log.sql
-- Anonymised log of public participation submissions from governance nodes.
-- Personal data (name, contact, comment) is webhook-delivered only — never stored here.
-- Apply to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre Supabase project)

CREATE TABLE IF NOT EXISTS node_participation_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id         TEXT        NOT NULL,
  sanity_id       TEXT        NOT NULL,
  sanity_type     TEXT        NOT NULL DEFAULT 'notice',
  response_type   TEXT        NOT NULL CHECK (response_type IN ('comment','objection','support','question')),
  relationship    TEXT        NOT NULL CHECK (relationship IN ('resident','landowner','business','community','organisation','other','')),
  popia_consent   BOOLEAN     NOT NULL,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT node_participation_popia_required CHECK (popia_consent = true)
);

CREATE INDEX node_participation_node_id_idx    ON node_participation_log (node_id);
CREATE INDEX node_participation_sanity_id_idx  ON node_participation_log (sanity_id);
CREATE INDEX node_participation_submitted_idx  ON node_participation_log (submitted_at);

-- RLS: anon has no access. service_role has full access.
ALTER TABLE node_participation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON node_participation_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
