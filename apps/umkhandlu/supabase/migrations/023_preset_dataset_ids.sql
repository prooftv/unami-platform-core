-- Migration 023: Populate required_dataset_ids on all 9 notice presets
-- UUIDs verified from live Supabase on 2026-11-26.
-- Only published, active, redistribute-class datasets are linked.
-- Restricted datasets (COGTA ILIS, COGTA Zoning, NGI Cadastre, KZNERA) are
-- intentionally excluded — they are not published and have no UUID to link.
-- The workflow engine falls back to NOTICE_LAYER_CONFIG for unavailable datasets.

-- Dataset UUID reference (verified 2026-11-26):
-- 017eeb0a  MDB Wards 2026 — Amajuba DC25
-- 294df9f4  MDB Local Municipalities 2026 — Amajuba DC25
-- 7bd6d9ba  MDB District Municipality 2026 — Amajuba DC25
-- 4c0c05a9  HOT OSM Education Facilities — Amajuba DC25
-- 3f631d89  HOT OSM Cultural Places — Amajuba DC25
-- 438709e5  HOT OSM Health Facilities — Amajuba DC25
-- 8151a71e  HOT OSM Populated Places — Amajuba DC25
-- da5a3786  HOT OSM Waterways — Amajuba DC25
-- 45cec20e  HOT OSM Roads — Amajuba DC25
-- 47561890  HOT OSM Railways — Amajuba DC25

-- liquor: KZN Liquor Licensing Act s.43 — wards, municipalities, district,
--         schools, religious/cultural, health, populated places
update notice_presets set
  required_dataset_ids = array[
    '017eeb0a-89ec-416f-b2b5-d6a58edbf1d4'::uuid,
    '294df9f4-a49c-47a6-bb24-8dc7715eb759'::uuid,
    '7bd6d9ba-3336-42a8-b8be-a66ca636e0c9'::uuid,
    '4c0c05a9-0278-4079-aa45-fac8969f044a'::uuid,
    '3f631d89-a857-4938-b7d9-9efecb4c9922'::uuid,
    '438709e5-e860-4800-ac02-535594967121'::uuid,
    '8151a71e-4aba-4ff4-8ede-aa90fdfa6f90'::uuid
  ],
  updated_at = now()
where notice_type = 'liquor' and version = 1;

-- eia: NEMA EIA Regulations — wards, municipalities, district,
--      waterways (32m setback), populated, health, schools
update notice_presets set
  required_dataset_ids = array[
    '017eeb0a-89ec-416f-b2b5-d6a58edbf1d4'::uuid,
    '294df9f4-a49c-47a6-bb24-8dc7715eb759'::uuid,
    '7bd6d9ba-3336-42a8-b8be-a66ca636e0c9'::uuid,
    'da5a3786-a16f-40c9-a557-8defec4f4b87'::uuid,
    '8151a71e-4aba-4ff4-8ede-aa90fdfa6f90'::uuid,
    '438709e5-e860-4800-ac02-535594967121'::uuid,
    '4c0c05a9-0278-4079-aa45-fac8969f044a'::uuid
  ],
  updated_at = now()
where notice_type = 'eia' and version = 1;

-- mining: MPRDA s.5 — wards, municipalities, district,
--         waterways, populated, health, schools
update notice_presets set
  required_dataset_ids = array[
    '017eeb0a-89ec-416f-b2b5-d6a58edbf1d4'::uuid,
    '294df9f4-a49c-47a6-bb24-8dc7715eb759'::uuid,
    '7bd6d9ba-3336-42a8-b8be-a66ca636e0c9'::uuid,
    'da5a3786-a16f-40c9-a557-8defec4f4b87'::uuid,
    '8151a71e-4aba-4ff4-8ede-aa90fdfa6f90'::uuid,
    '438709e5-e860-4800-ac02-535594967121'::uuid,
    '4c0c05a9-0278-4079-aa45-fac8969f044a'::uuid
  ],
  updated_at = now()
where notice_type = 'mining' and version = 1;

-- rezoning: SPLUMA s.42 — wards, municipalities, district, populated, roads
update notice_presets set
  required_dataset_ids = array[
    '017eeb0a-89ec-416f-b2b5-d6a58edbf1d4'::uuid,
    '294df9f4-a49c-47a6-bb24-8dc7715eb759'::uuid,
    '7bd6d9ba-3336-42a8-b8be-a66ca636e0c9'::uuid,
    '8151a71e-4aba-4ff4-8ede-aa90fdfa6f90'::uuid,
    '45cec20e-f267-4352-aa41-f2bf7a846ca4'::uuid
  ],
  updated_at = now()
where notice_type = 'rezoning' and version = 1;

-- land-use: SPLUMA — wards, municipalities, district, populated, roads
update notice_presets set
  required_dataset_ids = array[
    '017eeb0a-89ec-416f-b2b5-d6a58edbf1d4'::uuid,
    '294df9f4-a49c-47a6-bb24-8dc7715eb759'::uuid,
    '7bd6d9ba-3336-42a8-b8be-a66ca636e0c9'::uuid,
    '8151a71e-4aba-4ff4-8ede-aa90fdfa6f90'::uuid,
    '45cec20e-f267-4352-aa41-f2bf7a846ca4'::uuid
  ],
  updated_at = now()
where notice_type = 'land-use' and version = 1;

-- township: SPLUMA — wards, municipalities, district, populated, roads, waterways
update notice_presets set
  required_dataset_ids = array[
    '017eeb0a-89ec-416f-b2b5-d6a58edbf1d4'::uuid,
    '294df9f4-a49c-47a6-bb24-8dc7715eb759'::uuid,
    '7bd6d9ba-3336-42a8-b8be-a66ca636e0c9'::uuid,
    '8151a71e-4aba-4ff4-8ede-aa90fdfa6f90'::uuid,
    '45cec20e-f267-4352-aa41-f2bf7a846ca4'::uuid,
    'da5a3786-a16f-40c9-a557-8defec4f4b87'::uuid
  ],
  updated_at = now()
where notice_type = 'township' and version = 1;

-- building: National Building Regulations — wards, municipalities, district
update notice_presets set
  required_dataset_ids = array[
    '017eeb0a-89ec-416f-b2b5-d6a58edbf1d4'::uuid,
    '294df9f4-a49c-47a6-bb24-8dc7715eb759'::uuid,
    '7bd6d9ba-3336-42a8-b8be-a66ca636e0c9'::uuid
  ],
  updated_at = now()
where notice_type = 'building' and version = 1;

-- telecom: ICASA / ECA — wards, municipalities, district, populated, health, schools, roads
update notice_presets set
  required_dataset_ids = array[
    '017eeb0a-89ec-416f-b2b5-d6a58edbf1d4'::uuid,
    '294df9f4-a49c-47a6-bb24-8dc7715eb759'::uuid,
    '7bd6d9ba-3336-42a8-b8be-a66ca636e0c9'::uuid,
    '8151a71e-4aba-4ff4-8ede-aa90fdfa6f90'::uuid,
    '438709e5-e860-4800-ac02-535594967121'::uuid,
    '4c0c05a9-0278-4079-aa45-fac8969f044a'::uuid,
    '45cec20e-f267-4352-aa41-f2bf7a846ca4'::uuid
  ],
  updated_at = now()
where notice_type = 'telecom' and version = 1;

-- infrastructure: General — wards, municipalities, district, roads, railways, waterways, populated
update notice_presets set
  required_dataset_ids = array[
    '017eeb0a-89ec-416f-b2b5-d6a58edbf1d4'::uuid,
    '294df9f4-a49c-47a6-bb24-8dc7715eb759'::uuid,
    '7bd6d9ba-3336-42a8-b8be-a66ca636e0c9'::uuid,
    '45cec20e-f267-4352-aa41-f2bf7a846ca4'::uuid,
    '47561890-1e92-4348-b4bf-04a769b03640'::uuid,
    'da5a3786-a16f-40c9-a557-8defec4f4b87'::uuid,
    '8151a71e-4aba-4ff4-8ede-aa90fdfa6f90'::uuid
  ],
  updated_at = now()
where notice_type = 'infrastructure' and version = 1;
