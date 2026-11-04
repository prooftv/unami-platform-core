-- 005_spatial_sources.sql
-- Spatial data source registry and import tracking for GIS integration
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)

-- Source registry: every institutional spatial data source
CREATE TABLE IF NOT EXISTS spatial_sources (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                      TEXT NOT NULL,
  institution               TEXT NOT NULL,
  source_type               TEXT NOT NULL CHECK (source_type IN (
                              'arcgis-featureserver',
                              'arcgis-mapserver',
                              'wfs',
                              'download',
                              'static-map'
                            )),
  base_url                  TEXT,
  layer_id                  TEXT,
  description               TEXT,
  geographic_coverage       TEXT NOT NULL DEFAULT 'amajuba',
  coordinate_system         TEXT NOT NULL DEFAULT 'EPSG:4326',
  requires_auth             BOOLEAN NOT NULL DEFAULT false,
  permission_status         TEXT NOT NULL DEFAULT 'pending' CHECK (permission_status IN (
                              'pending',
                              'confirmed',
                              'restricted',
                              'denied',
                              'reference'
                            )),
  permission_notes          TEXT,
  custodian_name            TEXT,
  custodian_email           TEXT,
  last_checked_at           TIMESTAMPTZ,
  last_successful_import_at TIMESTAMPTZ,
  dataset_date              TEXT,
  active                    BOOLEAN NOT NULL DEFAULT true,
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import log: every import attempt against a source
CREATE TABLE IF NOT EXISTS spatial_imports (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id         UUID NOT NULL REFERENCES spatial_sources(id) ON DELETE CASCADE,
  status            TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  features_imported INTEGER NOT NULL DEFAULT 0,
  error_message     TEXT,
  import_type       TEXT CHECK (import_type IN (
                      'boundary',
                      'project',
                      'infrastructure',
                      'land-use',
                      'institutional'
                    )),
  target_node_url   TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  notes             TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS spatial_sources_active_idx ON spatial_sources(active);
CREATE INDEX IF NOT EXISTS spatial_sources_permission_idx ON spatial_sources(permission_status);
CREATE INDEX IF NOT EXISTS spatial_imports_source_idx ON spatial_imports(source_id);
CREATE INDEX IF NOT EXISTS spatial_imports_status_idx ON spatial_imports(status);
CREATE INDEX IF NOT EXISTS spatial_imports_started_idx ON spatial_imports(started_at DESC);

-- RLS
ALTER TABLE spatial_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_imports ENABLE ROW LEVEL SECURITY;

-- Service role has full access (Control Centre operators via service key)
CREATE POLICY "service_role_spatial_sources" ON spatial_sources
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_spatial_imports" ON spatial_imports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated operators can read
CREATE POLICY "authenticated_read_spatial_sources" ON spatial_sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_spatial_imports" ON spatial_imports
  FOR SELECT TO authenticated USING (true);

-- Seed the four known institutional sources
INSERT INTO spatial_sources (name, institution, source_type, description, geographic_coverage, permission_status, custodian_name, custodian_email, notes) VALUES
(
  'ILIS Base Map 2025',
  'Integrated Land Information System',
  'arcgis-featureserver',
  'Cadastral and property boundaries, land ownership, land-use schemes and land parcels for Amajuba District.',
  'amajuba',
  'pending',
  NULL,
  NULL,
  'Previously identified reference: ILIS_Base_map_2025. Amajuba land-use schemes also referenced.'
),
(
  'KZN COGTA Spatial Dashboard — Infrastructure 2022',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-mapserver',
  'Municipal and ward boundaries, government and institutional locations, infrastructure and service-delivery information, spatially represented development information.',
  'kzn',
  'pending',
  NULL,
  NULL,
  'Previously identified layer reference: Infrastructure_2022. Do not cache or redistribute without confirmed permission.'
),
(
  'SIFT — Spatial Integration Framework Tool',
  'KwaZulu-Natal Provincial Spatial Development Framework',
  'arcgis-featureserver',
  'Six focus areas, spatial integration indicators, planning assessment scores. PSDF_10_8_2_WebMap is a web map reference only — actual indicator datasets must be identified separately.',
  'kzn',
  'pending',
  NULL,
  NULL,
  'PSDF_10_8_2_WebMap is NOT the six-focus-area assessment scores. Correct indicator datasets still to be identified.'
),
(
  'Amajuba District Municipality GIS',
  'Amajuba District Municipality',
  'download',
  'Municipal boundary data, ward boundaries, infrastructure layers (non-restricted), land-use information, institutional locations.',
  'amajuba',
  'pending',
  'Udiv Budhal',
  NULL,
  'GIS Manager Mr Udiv Budhal responded 3 Nov 2026 — requested Data and Map Request Form completion. Water and sanitation data RESTRICTED — directed to Ms Thubelihle Buthelezi (thubelihleb@amajuba.gov.za), HoD Planning & Development.'
),
(
  'Newcastle PMU Development Projects',
  'Newcastle Local Municipality — Project Management Unit',
  'download',
  'Development project information: name, institution, ward, site coordinates, category, phase, milestones, procurement, timelines, employment, SMME participation.',
  'newcastle',
  'pending',
  NULL,
  NULL,
  'Requires formal data-sharing agreement. Buffalo River Abstraction Works was a demonstration record only — not confirmed PMU data.'
),
(
  'NGI Static Maps — Ladysmith 2829DB',
  'Chief Directorate: National Geo-spatial Information',
  'static-map',
  'Official cartographic reference maps. Geographic reference material, administrative and planning maps.',
  'amajuba',
  'reference',
  NULL,
  NULL,
  'Static maps are reference products, not live queryable services. Catalogued separately from feature services.'
);

