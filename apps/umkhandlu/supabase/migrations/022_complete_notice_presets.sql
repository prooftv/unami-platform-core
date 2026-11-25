-- Migration 022: Complete notice presets for all statutory notice types
-- Adds missing presets: land-use, township, building, telecom, infrastructure
-- Updates existing presets with full layer config, provenance fields and GratisGIS layer refs
-- Source: notice-layer-config.ts, PROXIMITY_RADIUS config, NOTICE_LAYER_CONFIG
-- Analysis distances are practice standards, not statutory cutoffs, per existing config.

-- land-use: SPLUMA s.42 land use applications
insert into notice_presets (
  notice_type, version, label, description,
  proximity_radius_metres, subject_geometry_required,
  geolibre_tools, geolibre_plugins,
  processing_parameters,
  validation_rules,
  required_provenance_fields,
  gn_publication_required
) values (
  'land-use', 1,
  'Land Use Application',
  'SPLUMA s.42 — land use application. Zoning context, road access, affected community identification.',
  null, true,
  array['feature-inspector','pdf-export'],
  array[]::text[],
  '{"layers":["admin-wards","admin-municipalities","cogta-zoning","hot-roads","hot-populated","ngi-cadastre"]}'::jsonb,
  '[
    {"rule":"subject_geometry_verified","description":"Site coordinates must be operator-verified"},
    {"rule":"zoning_context_assessed","description":"Existing zoning context must be documented"}
  ]'::jsonb,
  array['subject_geometry_source','screening_status','dataset_snapshot'],
  true
) on conflict (notice_type, version) do nothing;

-- township: SPLUMA township establishment
insert into notice_presets (
  notice_type, version, label, description,
  proximity_radius_metres, subject_geometry_required,
  geolibre_tools, geolibre_plugins,
  processing_parameters,
  validation_rules,
  required_provenance_fields,
  gn_publication_required
) values (
  'township', 1,
  'Township Establishment',
  'SPLUMA — township establishment application. Full spatial context: boundaries, roads, services, affected communities.',
  null, true,
  array['feature-inspector','pdf-export','proximity-analysis'],
  array[]::text[],
  '{"layers":["admin-wards","admin-municipalities","cogta-zoning","hot-roads","hot-populated","hot-waterways","ngi-cadastre","cogta-ilis"]}'::jsonb,
  '[
    {"rule":"subject_geometry_verified","description":"Site coordinates must be operator-verified"},
    {"rule":"ward_boundary_confirmed","description":"Ward boundary must be confirmed"},
    {"rule":"zoning_context_assessed","description":"Existing zoning context must be documented"}
  ]'::jsonb,
  array['subject_geometry_source','screening_status','dataset_snapshot'],
  true
) on conflict (notice_type, version) do nothing;

-- building: Building plans / development applications
insert into notice_presets (
  notice_type, version, label, description,
  proximity_radius_metres, subject_geometry_required,
  geolibre_tools, geolibre_plugins,
  processing_parameters,
  validation_rules,
  required_provenance_fields,
  gn_publication_required
) values (
  'building', 1,
  'Building Plans / Development Application',
  'National Building Regulations — building plan application. Site location, cadastral context, ward reference.',
  null, true,
  array['feature-inspector','pdf-export'],
  array[]::text[],
  '{"layers":["admin-wards","admin-municipalities","ngi-cadastre","cogta-zoning"]}'::jsonb,
  '[
    {"rule":"subject_geometry_verified","description":"Site coordinates must be operator-verified"},
    {"rule":"ward_boundary_confirmed","description":"Ward boundary must be confirmed"}
  ]'::jsonb,
  array['subject_geometry_source','screening_status'],
  false
) on conflict (notice_type, version) do nothing;

-- telecom: Telecommunications infrastructure applications
-- No statutory proximity radius. Receptor sensitivity assessed case-by-case.
insert into notice_presets (
  notice_type, version, label, description,
  proximity_radius_metres, subject_geometry_required,
  geolibre_tools, geolibre_plugins,
  processing_parameters,
  validation_rules,
  required_provenance_fields,
  gn_publication_required
) values (
  'telecom', 1,
  'Telecommunications Infrastructure',
  'ICASA / Electronic Communications Act — telecommunications infrastructure application. Site location, road access, affected communities.',
  null, true,
  array['feature-inspector','pdf-export','proximity-analysis'],
  array[]::text[],
  '{"layers":["admin-wards","admin-municipalities","hot-roads","hot-populated","hot-health","hot-education","cogta-ilis"]}'::jsonb,
  '[
    {"rule":"subject_geometry_verified","description":"Site coordinates must be operator-verified"},
    {"rule":"affected_communities_identified","description":"Affected communities must be identified for public participation"}
  ]'::jsonb,
  array['subject_geometry_source','screening_status','dataset_snapshot'],
  true
) on conflict (notice_type, version) do nothing;

-- infrastructure: General infrastructure and development notices
insert into notice_presets (
  notice_type, version, label, description,
  proximity_radius_metres, subject_geometry_required,
  geolibre_tools, geolibre_plugins,
  processing_parameters,
  validation_rules,
  required_provenance_fields,
  gn_publication_required
) values (
  'infrastructure', 1,
  'Infrastructure / Development Notice',
  'General infrastructure and development notices — roads, utilities, public works. Ward context, road network, waterways.',
  null, false,
  array['feature-inspector','pdf-export'],
  array[]::text[],
  '{"layers":["admin-wards","admin-municipalities","hot-roads","hot-railways","hot-waterways","hot-populated"]}'::jsonb,
  '[
    {"rule":"ward_boundary_confirmed","description":"Ward boundary must be confirmed"}
  ]'::jsonb,
  array['screening_status'],
  false
) on conflict (notice_type, version) do nothing;

-- Update existing presets with full processing_parameters and provenance fields
-- (on conflict do nothing already prevents duplicate inserts; update the existing rows)

update notice_presets set
  processing_parameters = '{"layers":["admin-wards","admin-municipalities","admin-district","cogta-ilis","hot-education","hot-cultural","hot-health","hot-populated","kznera-licensed","cogta-zoning","ngi-cadastre"],"proximityRadiusMetres":500,"proximityBasis":"KZN Liquor Licensing Act s.43(2)(b) — KZNERA reference distance. Not a hard statutory exclusion zone."}'::jsonb,
  required_provenance_fields = array['subject_geometry_source','screening_status','dataset_snapshot','geolibre_project_id'],
  updated_at = now()
where notice_type = 'liquor' and version = 1;

update notice_presets set
  processing_parameters = '{"layers":["admin-wards","admin-municipalities","admin-district","hot-waterways","hot-populated","hot-health","hot-education","cogta-ilis","cogta-zoning","ngi-cadastre"],"watercourseSetbackMetres":32,"setbackBasis":"NEMA EIA Regulations GN R982 — 32m watercourse setback. No general proximity radius."}'::jsonb,
  required_provenance_fields = array['subject_geometry_source','screening_status','dataset_snapshot','geolibre_project_id'],
  updated_at = now()
where notice_type = 'eia' and version = 1;

update notice_presets set
  processing_parameters = '{"layers":["admin-wards","admin-municipalities","admin-district","hot-waterways","hot-populated","hot-health","hot-education","cogta-ilis"],"proximityRadiusMetres":500,"proximityBasis":"MPRDA s.5(4)(c) — DMRE practice standard for community notification. Actual consultation area determined by EAP."}'::jsonb,
  required_provenance_fields = array['subject_geometry_source','screening_status','dataset_snapshot','geolibre_project_id'],
  updated_at = now()
where notice_type = 'mining' and version = 1;

update notice_presets set
  processing_parameters = '{"layers":["admin-wards","admin-municipalities","admin-district","hot-populated","hot-roads","cogta-zoning","ngi-cadastre"]}'::jsonb,
  required_provenance_fields = array['subject_geometry_source','screening_status','dataset_snapshot'],
  updated_at = now()
where notice_type = 'rezoning' and version = 1;
