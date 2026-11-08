-- 005_spatial_sources_grant_fix.sql
-- Fixes missing GRANT statements on spatial_sources and spatial_imports.
-- Supabase PostgREST requires explicit GRANTs in addition to RLS policies.
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)

GRANT ALL ON TABLE public.spatial_sources TO service_role;
GRANT ALL ON TABLE public.spatial_imports TO service_role;
GRANT SELECT ON TABLE public.spatial_sources TO authenticated;
GRANT SELECT ON TABLE public.spatial_imports TO authenticated;

-- Also update the COGTA sources with confirmed base_url and layer catalogue
UPDATE spatial_sources
SET
  base_url = 'https://giswebmaps1.kzncogta.gov.za/server/rest/services/ILIS_Base_map_2025/FeatureServer',
  coordinate_system = 'EPSG:3857',
  notes = 'Service root responds (HTTP 200). Query endpoint times out from external IPs — likely firewall on /query path. Service catalogue and layer metadata accessible. 38 layers including: District/Local/Ward boundaries, Traditional Council Boundaries, Health facilities, Community Halls, Rivers, Dams, Floodlines (20/50/100yr), Roads, Poverty headcount, Housing types, Accessibility Index. Requires COGTA network access or approved IP for feature queries.',
  updated_at = NOW()
WHERE name = 'ILIS Base Map 2025';

UPDATE spatial_sources
SET
  base_url = 'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Infrastructure_2022/FeatureServer',
  coordinate_system = 'EPSG:3857',
  notes = 'Service root responds. Query endpoint blocked from external IPs. 25 layers including water pipelines, reservoirs, treatment works, UAP demand areas. Water/sanitation layers — do not cache or redistribute without confirmed permission from Amajuba District Municipality.',
  updated_at = NOW()
WHERE name = 'KZN COGTA Spatial Dashboard — Infrastructure 2022';

-- Add confirmed COGTA sources discovered in catalogue inspection
INSERT INTO spatial_sources (name, institution, source_type, base_url, description, geographic_coverage, coordinate_system, permission_status, notes)
VALUES
(
  'COGTA Ward Profile V3',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Ward_Profile_V3/FeatureServer',
  'District municipal boundaries (SDE.DistrictMunicipalBoundary2021). 1 layer.',
  'kzn',
  'EPSG:3857',
  'pending',
  'Service root accessible. Query endpoint blocked from external IPs. Layer 3: SDE.DistrictMunicipalBoundary2021 (Polygon).'
),
(
  'COGTA Flood Risk',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Flood_Risk/FeatureServer',
  'SRK Municipal Flood Related Indicators — flood risk classification per municipality.',
  'kzn',
  'EPSG:3857',
  'pending',
  'Service root accessible. Query endpoint blocked from external IPs. Layer 0: SRK_Munic_Flood_Related_Indicators (Polygon).'
),
(
  'COGTA Disaster Incidents',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Disaster_Incidents/FeatureServer',
  'Point locations of disaster incidents across KZN.',
  'kzn',
  'EPSG:3857',
  'pending',
  'Service root accessible. Query endpoint blocked from external IPs. Layer 0: Disaster_Incidents (Point).'
),
(
  'COGTA Land Use Scheme Pillar 2026',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Land_use_scheme_pillar_2026/FeatureServer',
  'Land use scheme polygons for all KZN municipalities. Amajuba layers: [3] Dannhauser 2020, [4] Emadlangeni 2020, [17] Newcastle 2020.',
  'kzn',
  'EPSG:3857',
  'pending',
  'Service root accessible. Query endpoint blocked from external IPs. 34 layers total. Amajuba-relevant: layers 3, 4, 17.'
),
(
  'COGTA Disaster Risk Reduction ILIS',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Disaster_risk_reduction_ilis/FeatureServer',
  'Schools and health infrastructure affected by disasters, flood incidents, focus settlements. 26 layers.',
  'kzn',
  'EPSG:3857',
  'pending',
  'Service root accessible. Query endpoint blocked from external IPs. 26 layers including PDMC Flood Incidents, affected schools and health facilities.'
),
(
  'COGTA Land Tenure Component v2',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Land_tenure_componentv2/FeatureServer',
  'Land tenure classification and ownership data across KZN.',
  'kzn',
  'EPSG:3857',
  'pending',
  'Service root accessible. Query endpoint blocked from external IPs.'
),
(
  'COGTA Road Transport',
  'KwaZulu-Natal Department of Cooperative Governance and Traditional Affairs',
  'arcgis-featureserver',
  'https://giswebmaps1.kzncogta.gov.za/server/rest/services/Road_Transport/FeatureServer',
  'Road transport network across KZN.',
  'kzn',
  'EPSG:3857',
  'pending',
  'Service root returns gzip-encoded response. Query endpoint blocked from external IPs.'
)
ON CONFLICT DO NOTHING;
