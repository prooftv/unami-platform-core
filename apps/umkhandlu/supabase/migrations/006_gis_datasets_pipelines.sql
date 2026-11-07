-- 006_gis_datasets_pipelines.sql
-- GIS-2: datasets, pipeline runs, staged features
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)

-- Individual datasets/layers within a source
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

-- Pipeline execution history
CREATE TABLE IF NOT EXISTS spatial_pipeline_runs (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_type       TEXT NOT NULL CHECK (pipeline_type IN (
                        'health-check',
                        'arcgis-fetch',
                        'wfs-fetch',
                        'download-fetch',
                        'gdal-process',
                        'geometry-validate',
                        'publication',
                        'reconciliation',
                        'freshness-check',
                        'risk-reminder',
                        'compliance-alert'
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

-- Staging area — operator review before publication
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

-- Indexes
CREATE INDEX IF NOT EXISTS spatial_datasets_source_idx    ON spatial_datasets(source_id);
CREATE INDEX IF NOT EXISTS spatial_datasets_status_idx    ON spatial_datasets(status);
CREATE INDEX IF NOT EXISTS spatial_datasets_active_idx    ON spatial_datasets(active);
CREATE INDEX IF NOT EXISTS spatial_pipeline_runs_type_idx ON spatial_pipeline_runs(pipeline_type);
CREATE INDEX IF NOT EXISTS spatial_pipeline_runs_src_idx  ON spatial_pipeline_runs(source_id);
CREATE INDEX IF NOT EXISTS spatial_pipeline_runs_ds_idx   ON spatial_pipeline_runs(dataset_id);
CREATE INDEX IF NOT EXISTS spatial_pipeline_runs_ts_idx   ON spatial_pipeline_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS spatial_staged_ds_idx          ON spatial_staged_features(dataset_id);
CREATE INDEX IF NOT EXISTS spatial_staged_status_idx      ON spatial_staged_features(operator_status);

-- RLS
ALTER TABLE spatial_datasets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_pipeline_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_staged_features  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_spatial_datasets"        ON spatial_datasets        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_spatial_pipeline_runs"   ON spatial_pipeline_runs   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_spatial_staged_features" ON spatial_staged_features FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_spatial_datasets"        ON spatial_datasets        FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_spatial_pipeline_runs"   ON spatial_pipeline_runs   FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_spatial_staged_features" ON spatial_staged_features FOR SELECT TO authenticated USING (true);
