-- Migration 005: Commercial Layer
-- Additive columns on campaigns table only. No existing columns modified.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS campaign_type       TEXT NOT NULL DEFAULT 'ad'
                                               CHECK (campaign_type IN ('ad', 'activation', 'csr')),
  ADD COLUMN IF NOT EXISTS project_health      TEXT
                                               CHECK (project_health IN ('green', 'amber', 'red')),
  ADD COLUMN IF NOT EXISTS project_phase       TEXT
                                               CHECK (project_phase IN ('planning', 'procurement', 'construction', 'commissioning', 'operational')),
  ADD COLUMN IF NOT EXISTS project_reference   TEXT,
  ADD COLUMN IF NOT EXISTS funding_source      TEXT,
  ADD COLUMN IF NOT EXISTS contractor          TEXT,
  ADD COLUMN IF NOT EXISTS beneficiaries       INTEGER CHECK (beneficiaries >= 0),
  ADD COLUMN IF NOT EXISTS impact_summary      TEXT,
  ADD COLUMN IF NOT EXISTS lessons_learned     TEXT,
  ADD COLUMN IF NOT EXISTS progress_log        JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS deliverables_certified JSONB NOT NULL DEFAULT '[]';

-- CSR-only fields are only meaningful when campaign_type = 'csr'
COMMENT ON COLUMN campaigns.campaign_type IS 'ad | activation | csr';
COMMENT ON COLUMN campaigns.project_health IS 'RAG status — CSR only';
COMMENT ON COLUMN campaigns.progress_log IS 'Append-only array of {date, update, addedBy}';
COMMENT ON COLUMN campaigns.deliverables_certified IS 'Array of certified deliverable objects';
