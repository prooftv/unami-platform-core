-- 007_risk_compliance.sql
-- GIS-3: risk registers, compliance obligations, controls, evidence, findings, remediation, audit log
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)

-- Risk registers — one per governance domain / node
CREATE TABLE IF NOT EXISTS risk_registers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id     UUID REFERENCES governance_nodes(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  owner       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual risk records
CREATE TABLE IF NOT EXISTS risks (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  register_id         UUID NOT NULL REFERENCES risk_registers(id) ON DELETE CASCADE,
  identifier          TEXT NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  category            TEXT NOT NULL CHECK (category IN (
                        'spatial', 'governance', 'data', 'operational', 'compliance', 'external'
                      )),
  likelihood          INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  impact              INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 5),
  exposure            INTEGER GENERATED ALWAYS AS (likelihood * impact) STORED,
  owner               TEXT NOT NULL,
  treatment           TEXT NOT NULL CHECK (treatment IN ('accept', 'mitigate', 'transfer', 'avoid')),
  treatment_plan      TEXT,
  treatment_deadline  DATE,
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
                        'open', 'under-treatment', 'closed', 'accepted'
                      )),
  methodology         TEXT,
  assessed_by         TEXT,
  assessed_at         DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable revision history — every reassessment preserved
CREATE TABLE IF NOT EXISTS risk_revisions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_id       UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  likelihood    INTEGER NOT NULL,
  impact        INTEGER NOT NULL,
  exposure      INTEGER NOT NULL,
  treatment     TEXT NOT NULL,
  assessed_by   TEXT,
  assessed_at   DATE,
  reason        TEXT,
  evidence_refs TEXT[],
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compliance obligations
CREATE TABLE IF NOT EXISTS compliance_obligations (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id            UUID REFERENCES governance_nodes(id) ON DELETE SET NULL,
  identifier         TEXT NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  source             TEXT NOT NULL,
  responsible_party  TEXT NOT NULL,
  due_date           DATE,
  recurrence         TEXT,
  status             TEXT NOT NULL DEFAULT 'under-review' CHECK (status IN (
                       'compliant', 'non-compliant', 'under-review', 'not-applicable'
                     )),
  assessed_by        TEXT,
  assessed_at        DATE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Controls
CREATE TABLE IF NOT EXISTS controls (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id          UUID REFERENCES governance_nodes(id) ON DELETE SET NULL,
  identifier       TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  control_type     TEXT NOT NULL CHECK (control_type IN ('preventive', 'detective', 'corrective')),
  test_frequency   TEXT,
  last_tested_at   DATE,
  last_test_result TEXT CHECK (last_test_result IN ('pass', 'fail', 'partial', NULL)),
  owner            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'retired')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Control test execution records
CREATE TABLE IF NOT EXISTS control_tests (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  control_id   UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  tested_by    TEXT NOT NULL,
  tested_at    DATE NOT NULL,
  result       TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'partial')),
  evidence_refs TEXT[],
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evidence records
CREATE TABLE IF NOT EXISTS evidence_records (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id              UUID REFERENCES governance_nodes(id) ON DELETE SET NULL,
  title                TEXT NOT NULL,
  description          TEXT,
  document_type        TEXT NOT NULL,
  source_type          TEXT NOT NULL CHECK (source_type IN ('operator-uploaded', 'system-generated', 'external')),
  evidence_date        DATE,
  file_url             TEXT,
  provided_by          TEXT,
  verified_by          TEXT,
  verified_at          DATE,
  linked_risk_id       UUID REFERENCES risks(id) ON DELETE SET NULL,
  linked_obligation_id UUID REFERENCES compliance_obligations(id) ON DELETE SET NULL,
  linked_control_id    UUID REFERENCES controls(id) ON DELETE SET NULL,
  linked_finding_id    UUID,  -- FK added after findings table
  retention_status     TEXT NOT NULL DEFAULT 'active' CHECK (retention_status IN ('active', 'archived', 'disposed')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Findings — gaps, exceptions, incidents
CREATE TABLE IF NOT EXISTS findings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id       UUID REFERENCES governance_nodes(id) ON DELETE SET NULL,
  finding_type  TEXT NOT NULL CHECK (finding_type IN ('gap', 'exception', 'incident')),
  title         TEXT NOT NULL,
  description   TEXT,
  severity      TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  owner         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'accepted')),
  identified_at DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_at     DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from evidence_records to findings now that findings exists
ALTER TABLE evidence_records
  ADD CONSTRAINT evidence_records_finding_fk
  FOREIGN KEY (linked_finding_id) REFERENCES findings(id) ON DELETE SET NULL;

-- Remediation actions
CREATE TABLE IF NOT EXISTS remediation_actions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  finding_id    UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  owner         TEXT NOT NULL,
  due_date      DATE,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed', 'cancelled')),
  completed_at  DATE,
  evidence_refs TEXT[],
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable audit log — no deletion ever
CREATE TABLE IF NOT EXISTS gis_audit_log (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name          TEXT NOT NULL,
  record_id           UUID NOT NULL,
  actor               TEXT NOT NULL,
  action              TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject', 'publish', 'archive')),
  previous_state      JSONB,
  new_state           JSONB,
  reason              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS risks_register_idx          ON risks(register_id);
CREATE INDEX IF NOT EXISTS risks_status_idx            ON risks(status);
CREATE INDEX IF NOT EXISTS risks_exposure_idx          ON risks(exposure DESC);
CREATE INDEX IF NOT EXISTS risk_revisions_risk_idx     ON risk_revisions(risk_id);
CREATE INDEX IF NOT EXISTS compliance_node_idx         ON compliance_obligations(node_id);
CREATE INDEX IF NOT EXISTS compliance_status_idx       ON compliance_obligations(status);
CREATE INDEX IF NOT EXISTS controls_node_idx           ON controls(node_id);
CREATE INDEX IF NOT EXISTS control_tests_control_idx   ON control_tests(control_id);
CREATE INDEX IF NOT EXISTS evidence_risk_idx           ON evidence_records(linked_risk_id);
CREATE INDEX IF NOT EXISTS evidence_obligation_idx     ON evidence_records(linked_obligation_id);
CREATE INDEX IF NOT EXISTS findings_node_idx           ON findings(node_id);
CREATE INDEX IF NOT EXISTS findings_status_idx         ON findings(status);
CREATE INDEX IF NOT EXISTS findings_severity_idx       ON findings(severity);
CREATE INDEX IF NOT EXISTS remediation_finding_idx     ON remediation_actions(finding_id);
CREATE INDEX IF NOT EXISTS gis_audit_log_table_idx     ON gis_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS gis_audit_log_ts_idx        ON gis_audit_log(created_at DESC);

-- RLS
ALTER TABLE risk_registers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_revisions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_obligations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls                ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_tests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_actions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_audit_log           ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "sr_risk_registers"         ON risk_registers         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_risks"                  ON risks                  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_risk_revisions"         ON risk_revisions         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_compliance_obligations" ON compliance_obligations  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_controls"               ON controls               FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_control_tests"          ON control_tests          FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_evidence_records"       ON evidence_records       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_findings"               ON findings               FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_remediation_actions"    ON remediation_actions    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sr_gis_audit_log"          ON gis_audit_log          FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated operators read
CREATE POLICY "auth_read_risk_registers"         ON risk_registers         FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_risks"                  ON risks                  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_risk_revisions"         ON risk_revisions         FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_compliance_obligations" ON compliance_obligations  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_controls"               ON controls               FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_control_tests"          ON control_tests          FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_evidence_records"       ON evidence_records       FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_findings"               ON findings               FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_remediation_actions"    ON remediation_actions    FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read_gis_audit_log"          ON gis_audit_log          FOR SELECT TO authenticated USING (true);
