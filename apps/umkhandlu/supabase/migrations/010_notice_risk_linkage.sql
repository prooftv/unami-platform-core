-- 010_notice_risk_linkage.sql
-- Links risk, compliance, findings and evidence records to specific notices.
-- Adds node_notice_ref to notices so a CC notice can be cross-referenced
-- from a Governance Node Sanity document by its _id.
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)

-- Add notice_id FK to risks
ALTER TABLE risks
  ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES notices(id) ON DELETE SET NULL;

-- Add notice_id FK to compliance_obligations
ALTER TABLE compliance_obligations
  ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES notices(id) ON DELETE SET NULL;

-- Add notice_id FK to findings
ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES notices(id) ON DELETE SET NULL;

-- Add notice_id FK to evidence_records
ALTER TABLE evidence_records
  ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES notices(id) ON DELETE SET NULL;

-- Add node_notice_ref to notices — the Sanity _id of the corresponding
-- Governance Node developmentNotice document. Allows the Node to look up
-- its CC notice by stable Sanity document ID.
ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS node_notice_ref TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS notices_node_notice_ref_idx
  ON notices(node_notice_ref)
  WHERE node_notice_ref IS NOT NULL;

-- Indexes for notice-scoped queries
CREATE INDEX IF NOT EXISTS risks_notice_idx               ON risks(notice_id)               WHERE notice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compliance_notice_idx          ON compliance_obligations(notice_id) WHERE notice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS findings_notice_idx            ON findings(notice_id)             WHERE notice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS evidence_notice_idx            ON evidence_records(notice_id)     WHERE notice_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
