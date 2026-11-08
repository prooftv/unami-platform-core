-- ============================================================
-- UMKHANDLU PENDING MIGRATIONS — PASTE INTO SUPABASE SQL EDITOR
-- Project: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)
-- Includes: 005-fix, 006, 007
-- ============================================================

-- ── 005-FIX: Missing GRANTs on spatial_sources / spatial_imports ──────────

GRANT ALL ON TABLE public.spatial_sources TO service_role;
GRANT ALL ON TABLE public.spatial_imports TO service_role;
GRANT SELECT ON TABLE public.spatial_sources TO authenticated;
GRANT SELECT ON TABLE public.spatial_imports TO authenticated;

-- Update ILIS source with confirmed base_url
UPDATE spatial_sources
SET
  base_url = 'https://giswebmaps1.kzncogta.gov.za/server/rest/services/ILIS_Base_map_2025/FeatureServer',
  coordinate_system = 'EPSG:3857',
  notes = 'Service root responds (HTTP 200). Query endpoint times out from external IPs — firewall on /query path. 38 layers: District/Local/Ward boundaries, Traditional Council Boundaries, Health facilities, Community Halls, Rivers, Dams, Floodlines (20/50/100yr), Roads, Poverty headcount, Housing types, Accessibility Index. Requires COGTA network access or approved IP for feature queries.',
  updated_at = NOW()
WHERE name = 'ILIS Base Map 2025';

UPDATE spatial_sources
SET
  base_url = 'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Infrastructure_2022/FeatureServer',
  coordinate_system = 'EPSG:3857',
  notes = 'Service root responds. Query endpoint blocked from external IPs. 25 layers including water pipelines, reservoirs, treatment works, UAP demand areas. Water/sanitation layers restricted by Amajuba District Municipality.',
  updated_at = NOW()
WHERE name = 'KZN COGTA Spatial Dashboard — Infrastructure 2022';

-- Add confirmed COGTA sources from catalogue inspection
INSERT INTO spatial_sources (name, institution, source_type, base_url, description, geographic_coverage, coordinate_system, permission_status, notes)
VALUES
(
  'COGTA Ward Profile V3',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Ward_Profile_V3/FeatureServer',
  'District municipal boundaries (SDE.DistrictMunicipalBoundary2021). 1 layer.',
  'kzn', 'EPSG:3857', 'pending',
  'Layer 3: SDE.DistrictMunicipalBoundary2021 (Polygon). Query endpoint blocked from external IPs.'
),
(
  'COGTA Flood Risk',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Flood_Risk/FeatureServer',
  'SRK Municipal Flood Related Indicators — flood risk classification per municipality.',
  'kzn', 'EPSG:3857', 'pending',
  'Layer 0: SRK_Munic_Flood_Related_Indicators (Polygon). Query endpoint blocked from external IPs.'
),
(
  'COGTA Disaster Incidents',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Disaster_Incidents/FeatureServer',
  'Point locations of disaster incidents across KZN.',
  'kzn', 'EPSG:3857', 'pending',
  'Layer 0: Disaster_Incidents (Point). Query endpoint blocked from external IPs.'
),
(
  'COGTA Land Use Scheme Pillar 2026',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Land_use_scheme_pillar_2026/FeatureServer',
  'Land use scheme polygons for all KZN municipalities. Amajuba: [3] Dannhauser 2020, [4] Emadlangeni 2020, [17] Newcastle 2020.',
  'kzn', 'EPSG:3857', 'pending',
  '34 layers total. Amajuba-relevant: layers 3, 4, 17. Query endpoint blocked from external IPs.'
),
(
  'COGTA Disaster Risk Reduction ILIS',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Disaster_risk_reduction_ilis/FeatureServer',
  'Schools and health infrastructure affected by disasters, flood incidents, focus settlements. 26 layers.',
  'kzn', 'EPSG:3857', 'pending',
  '26 layers including PDMC Flood Incidents, affected schools and health facilities. Query endpoint blocked from external IPs.'
),
(
  'COGTA Land Tenure Component v2',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Land_tenure_componentv2/FeatureServer',
  'Land tenure classification and ownership data across KZN.',
  'kzn', 'EPSG:3857', 'pending',
  'Query endpoint blocked from external IPs.'
),
(
  'COGTA Road Transport',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Road_Transport/FeatureServer',
  'Road transport network across KZN.',
  'kzn', 'EPSG:3857', 'pending',
  'Service root returns gzip-encoded response. Query endpoint blocked from external IPs.'
)
ON CONFLICT DO NOTHING;

-- ── 006: spatial_datasets, spatial_pipeline_runs, spatial_staged_features ──

CREATE TABLE IF NOT EXISTS spatial_datasets (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id               UUID NOT NULL REFERENCES spatial_sources(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  layer_id                TEXT,
  description             TEXT,
  geographic_coverage     TEXT NOT NULL DEFAULT 'amajuba',
  crs                     TEXT NOT NULL DEFAULT 'EPSG:4326',
  dataset_date            TEXT,
  retrieval_date          TIMESTAMPTZ,
  fingerprint             TEXT,
  feature_count           INTEGER,
  file_size_bytes         BIGINT,
  status                  TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                            'pending', 'processing', 'staged', 'published', 'rejected', 'archived'
                          )),
  permission_status       TEXT NOT NULL DEFAULT 'pending' CHECK (permission_status IN (
                            'pending', 'confirmed', 'restricted', 'denied', 'reference'
                          )),
  permission_notes        TEXT,
  custodian_name          TEXT,
  custodian_email         TEXT,
  provenance              TEXT,
  transformation_history  JSONB NOT NULL DEFAULT '[]',
  last_processed_at       TIMESTAMPTZ,
  published_at            TIMESTAMPTZ,
  active                  BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spatial_pipeline_runs (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_type       TEXT NOT NULL CHECK (pipeline_type IN (
                        'health-check', 'arcgis-fetch', 'wfs-fetch', 'download-fetch',
                        'gdal-process', 'geometry-validate', 'publication', 'reconciliation',
                        'freshness-check', 'risk-reminder', 'compliance-alert'
                      )),
  source_id           UUID REFERENCES spatial_sources(id) ON DELETE SET NULL,
  dataset_id          UUID REFERENCES spatial_datasets(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
                        'running', 'success', 'failed', 'partial', 'cancelled'
                      )),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  features_fetched    INTEGER NOT NULL DEFAULT 0,
  features_processed  INTEGER NOT NULL DEFAULT 0,
  features_published  INTEGER NOT NULL DEFAULT 0,
  error_message       TEXT,
  log                 JSONB NOT NULL DEFAULT '[]',
  triggered_by        TEXT NOT NULL DEFAULT 'system' CHECK (triggered_by IN ('system', 'operator', 'replay')),
  operator_id         UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spatial_staged_features (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id          UUID NOT NULL REFERENCES spatial_datasets(id) ON DELETE CASCADE,
  pipeline_run_id     UUID NOT NULL REFERENCES spatial_pipeline_runs(id) ON DELETE CASCADE,
  feature_geojson     JSONB NOT NULL,
  feature_properties  JSONB NOT NULL DEFAULT '{}',
  geometry_valid      BOOLEAN NOT NULL DEFAULT false,
  geometry_issues     TEXT[],
  operator_status     TEXT NOT NULL DEFAULT 'pending' CHECK (operator_status IN (
                        'pending', 'approved', 'rejected'
                      )),
  reviewed_by         UUID,
  reviewed_at         TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS spatial_datasets_source_idx    ON spatial_datasets(source_id);
CREATE INDEX IF NOT EXISTS spatial_datasets_status_idx    ON spatial_datasets(status);
CREATE INDEX IF NOT EXISTS spatial_datasets_active_idx    ON spatial_datasets(active);
CREATE INDEX IF NOT EXISTS spatial_pipeline_runs_type_idx ON spatial_pipeline_runs(pipeline_type);
CREATE INDEX IF NOT EXISTS spatial_pipeline_runs_src_idx  ON spatial_pipeline_runs(source_id);
CREATE INDEX IF NOT EXISTS spatial_pipeline_runs_ds_idx   ON spatial_pipeline_runs(dataset_id);
CREATE INDEX IF NOT EXISTS spatial_pipeline_runs_ts_idx   ON spatial_pipeline_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS spatial_staged_ds_idx          ON spatial_staged_features(dataset_id);
CREATE INDEX IF NOT EXISTS spatial_staged_status_idx      ON spatial_staged_features(operator_status);

ALTER TABLE spatial_datasets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_pipeline_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_staged_features  ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.spatial_datasets        TO service_role;
GRANT ALL ON TABLE public.spatial_pipeline_runs   TO service_role;
GRANT ALL ON TABLE public.spatial_staged_features TO service_role;
GRANT SELECT ON TABLE public.spatial_datasets        TO authenticated;
GRANT SELECT ON TABLE public.spatial_pipeline_runs   TO authenticated;
GRANT SELECT ON TABLE public.spatial_staged_features TO authenticated;

CREATE POLICY "service_role_spatial_datasets"        ON spatial_datasets        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_spatial_pipeline_runs"   ON spatial_pipeline_runs   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_spatial_staged_features" ON spatial_staged_features FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_read_spatial_datasets"        ON spatial_datasets        FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_spatial_pipeline_runs"   ON spatial_pipeline_runs   FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_spatial_staged_features" ON spatial_staged_features FOR SELECT TO authenticated USING (true);

-- ── 007: risk, compliance, controls, evidence, findings, remediation, audit ─

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

CREATE TABLE IF NOT EXISTS control_tests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  control_id    UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
  tested_by     TEXT NOT NULL,
  tested_at     DATE NOT NULL,
  result        TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'partial')),
  evidence_refs TEXT[],
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  linked_finding_id    UUID,
  retention_status     TEXT NOT NULL DEFAULT 'active' CHECK (retention_status IN ('active', 'archived', 'disposed')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

ALTER TABLE evidence_records
  ADD CONSTRAINT evidence_records_finding_fk
  FOREIGN KEY (linked_finding_id) REFERENCES findings(id) ON DELETE SET NULL;

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

CREATE TABLE IF NOT EXISTS gis_audit_log (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name     TEXT NOT NULL,
  record_id      UUID NOT NULL,
  actor          TEXT NOT NULL,
  action         TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject', 'publish', 'archive')),
  previous_state JSONB,
  new_state      JSONB,
  reason         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS risks_register_idx        ON risks(register_id);
CREATE INDEX IF NOT EXISTS risks_status_idx          ON risks(status);
CREATE INDEX IF NOT EXISTS risks_exposure_idx        ON risks(exposure DESC);
CREATE INDEX IF NOT EXISTS risk_revisions_risk_idx   ON risk_revisions(risk_id);
CREATE INDEX IF NOT EXISTS compliance_node_idx       ON compliance_obligations(node_id);
CREATE INDEX IF NOT EXISTS compliance_status_idx     ON compliance_obligations(status);
CREATE INDEX IF NOT EXISTS controls_node_idx         ON controls(node_id);
CREATE INDEX IF NOT EXISTS control_tests_control_idx ON control_tests(control_id);
CREATE INDEX IF NOT EXISTS evidence_risk_idx         ON evidence_records(linked_risk_id);
CREATE INDEX IF NOT EXISTS evidence_obligation_idx   ON evidence_records(linked_obligation_id);
CREATE INDEX IF NOT EXISTS findings_node_idx         ON findings(node_id);
CREATE INDEX IF NOT EXISTS findings_status_idx       ON findings(status);
CREATE INDEX IF NOT EXISTS findings_severity_idx     ON findings(severity);
CREATE INDEX IF NOT EXISTS remediation_finding_idx   ON remediation_actions(finding_id);
CREATE INDEX IF NOT EXISTS gis_audit_log_table_idx   ON gis_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS gis_audit_log_ts_idx      ON gis_audit_log(created_at DESC);

ALTER TABLE risk_registers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_revisions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls               ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_tests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_actions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_audit_log          ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.risk_registers         TO service_role;
GRANT ALL ON TABLE public.risks                  TO service_role;
GRANT ALL ON TABLE public.risk_revisions         TO service_role;
GRANT ALL ON TABLE public.compliance_obligations TO service_role;
GRANT ALL ON TABLE public.controls               TO service_role;
GRANT ALL ON TABLE public.control_tests          TO service_role;
GRANT ALL ON TABLE public.evidence_records       TO service_role;
GRANT ALL ON TABLE public.findings               TO service_role;
GRANT ALL ON TABLE public.remediation_actions    TO service_role;
GRANT ALL ON TABLE public.gis_audit_log          TO service_role;

GRANT SELECT ON TABLE public.risk_registers         TO authenticated;
GRANT SELECT ON TABLE public.risks                  TO authenticated;
GRANT SELECT ON TABLE public.risk_revisions         TO authenticated;
GRANT SELECT ON TABLE public.compliance_obligations TO authenticated;
GRANT SELECT ON TABLE public.controls               TO authenticated;
GRANT SELECT ON TABLE public.control_tests          TO authenticated;
GRANT SELECT ON TABLE public.evidence_records       TO authenticated;
GRANT SELECT ON TABLE public.findings               TO authenticated;
GRANT SELECT ON TABLE public.remediation_actions    TO authenticated;
GRANT SELECT ON TABLE public.gis_audit_log          TO authenticated;

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

-- ── Seed: initial risk register for Amajuba District ──────────────────────

INSERT INTO risk_registers (title, description, owner, status)
VALUES (
  'Amajuba District — GIS & Spatial Intelligence',
  'Risks related to spatial data quality, source availability, integration reliability and geographic intelligence for Amajuba District.',
  'Unami Foundation',
  'active'
)
ON CONFLICT DO NOTHING;
