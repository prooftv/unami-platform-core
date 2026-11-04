# GIS and Spatial Intelligence Integration

Constitutional reference — Unami Platform Core + Umkhandlu Governance Node
Status: Active implementation workstream
Last updated: 2026-11-04

---

## What This Is

Umkhandlu is a place-based governance intelligence platform for Amajuba District.
Geographic information provides context to actual places, institutions, projects,
development notices, records and activities — it does not exist as a standalone map viewer.

A development project must be relatable to its municipality, ward, locality, Traditional
Authority area, premises and other applicable geographic contexts. Multiple geographic
associations are valid and expected. No single-parent geographic relationship is enforced.

---

## Two-System Architecture — Preserved

This integration spans both repositories. Their roles do not change.

**Umkhandlu Governance Node** (`umkhandlu.unamifoundation.org` / `prooftv/Umkhandlu`)
- Owns all geographic content: area listings, boundaries, project-to-geography relationships
- Presents public maps, geographic context, project locations
- Sanity CMS is the editorial layer for all geographic content
- Leaflet (already implemented) renders point coordinates from `listing.geopoint`

**Platform Core Governance Intelligence Centre** (`apps/umkhandlu` / `prooftv/unami-platform-core`)
- Connects to authorised institutional spatial data sources
- Processes, validates and normalises external geographic data
- Delivers prepared spatial data to the governance node via the existing API contract
- Monitors source health, data currency, import errors
- Aggregates geographic intelligence across nodes

No new Sanity, Vercel or Supabase projects are created for this work.
Amajuba is an expansion within the existing Umkhandlu deployment.

---

## QGIS Role in the Architecture

QGIS is the **spatial data preparation layer** between raw institutional source data
and the governance node's content model.

### What QGIS does

1. Receives raw data from institutional sources (Shapefiles, GeoJSON, WFS, ArcGIS exports)
2. Reprojects coordinate reference systems to WGS84 (EPSG:4326) — what Leaflet requires
3. Clips layers to Amajuba District extent
4. Validates and cleans geometry (fixes invalid polygons, removes duplicates)
5. Simplifies boundary polygons for web delivery (reduces file size without losing shape)
6. Exports clean GeoJSON for import into the governance node
7. Produces static map exports (PNG/PDF) for reference and presentation

### What QGIS does not do

- QGIS does not run as a server or automated pipeline
- QGIS is an operator tool — used by Unami to prepare data before import
- QGIS output is the input to the governance node's spatial data store
- QGIS does not replace the ArcGIS REST connectors for live queryable services

### Data flow

```
Institutional source (Shapefile / ArcGIS export / WFS download)
    │
    ▼
QGIS (reproject → clip → validate → simplify → export)
    │
    ▼
Clean GeoJSON (WGS84, Amajuba extent, web-optimised)
    │
    ▼
Import script → Sanity (boundary field on listing documents)
    │
    ▼
Governance node public map (Leaflet renders boundary polygons)
    │
    ▼
Intelligence API spatial endpoint → Control Centre geographic view
```

---

## Four Institutional Sources

These sources have different purposes and must not be treated as interchangeable.

### 1. ILIS — Integrated Land Information System

**Purpose:** Land and property context
**What it provides:**
- Cadastral and property boundaries
- Land ownership and tenure information (where accessible)
- Land-use schemes and land-use context
- Land parcels and spatial relationships

**Previously identified references:** `ILIS_Base_map_2025`, Amajuba land-use schemes
**Access method:** ArcGIS REST FeatureServer / authorised download
**QGIS role:** Reproject, clip to Amajuba, simplify cadastral boundaries for web

### 2. KZN COGTA Spatial Dashboard

**Purpose:** Institutional and development context
**What it provides:**
- Municipal and ward boundaries
- Government and institutional locations
- Infrastructure and service-delivery information
- Spatially represented development information

**Previously identified references:** `Infrastructure_2022` layer
**Access method:** ArcGIS REST MapServer / FeatureServer
**QGIS role:** Extract ward boundaries, reproject, clip, export as GeoJSON per ward
**Permission note:** Publicly accessible service ≠ permission to redistribute. Do not cache
or republish COGTA datasets without confirmed permission.

### 3. SIFT — Spatial Integration Framework Tool

**Purpose:** Spatial planning and development context
**What it provides:**
- Six focus areas and spatial integration indicators
- Spatial planning assessment scores
- Geographic relationships for planning purposes

**Previously identified references:** `PSDF_10_8_2_WebMap` is a web map reference only —
it does not confirm the actual six-focus-area assessment scores have been located.
The correct indicator and scoring datasets must be identified separately.
**Access method:** ArcGIS REST / KZN COGTA portal
**QGIS role:** Extract focus area polygons, validate against Amajuba extent

### 4. Static Maps and Geospatial Information Services

**Purpose:** Cartographic reference
**What it provides:**
- Official map products (e.g. 2829DB Ladysmith — Chief Directorate: National Geo-spatial Information)
- Geographic reference material
- Administrative and planning maps

**Important:** Static maps are reference products, not live queryable services.
They are catalogued separately from feature services.
**QGIS role:** Georeferencing static maps, extracting reference boundaries

---

## Amajuba District Municipality Engagement

**GIS Manager:** Mr Udiv Budhal
**Response date:** 3 November 2026
**Status:** Requested completion of Data and Map Request Form

**Water and sanitation restriction:** Mr Budhal confirmed water and sanitation information
will not be disseminated through his office due to sabotage and theft risk.
Water and sanitation requests must go to:

Ms Thubelihle Buthelezi
Head of Department: Planning & Development
thubelihleb@amajuba.gov.za

**Engineering rule:** Do not seek restricted infrastructure data through another route.
The water and sanitation restriction is absolute.

**What to expect from Amajuba GIS:**
- Municipal boundary data
- Ward boundary data
- Infrastructure layers (non-restricted)
- Land-use information
- Institutional locations

---

## Newcastle PMU — Development Project Integration

The Municipal Project Management Unit (PMU) holds development project information
that gives geographic context to infrastructure activity in Umkhandlu.

**Project information model (when sourced and available):**
- Project name and description
- Responsible institution and implementing entity
- Municipality, ward and locality
- Site coordinates and boundary
- Project category and programme
- Project phase and milestones
- Procurement and implementation status
- Timelines
- Employment and SMME participation (where verified)
- Evidence and supporting documents
- Source attribution, verification and update history

**The Buffalo River Abstraction Works** was used as a demonstration of the intended
information model. It is NOT confirmed PMU data. Do not treat it as officially verified.

**Newcastle PMU data-sharing agreement** is an external requirement for attributed
project information. Build and test the technical workflows using clearly labelled
test data. Do not invent or misattribute actual project data.

---

## Spatial Data Model — Governance Node

### What exists today

`listing` documents (type: `area`) have:
- `geopoint` — Sanity geopoint (lat/lng point coordinate) ✅
- `areaLevel` — district / municipality / ward / traditional-authority / isigodi / settlement ✅
- `wardNumber` — municipal ward number ✅
- `municipality` — newcastle / dannhauser / emadlangeni / amajuba ✅
- `parentArea` — reference to parent listing ✅

`campaign` documents have:
- `relatedAreas` — array of area references ✅
- `geopoint` — not yet on campaign schema ⏳

### What needs to be added

**On `listing` (type: area):**
- `boundary` — GeoJSON polygon (the ward/TA/municipal boundary from QGIS-prepared data)
- `boundarySource` — attribution: which institution, which dataset, which date
- `boundaryVersion` — dataset version or date obtained
- `boundaryPermission` — confirmed permission level: `reference` / `display` / `redistribute`

**On `campaign` (type: csr):**
- `siteGeopoint` — project site coordinate (distinct from area geopoint)
- `siteBoundary` — project site boundary polygon (GeoJSON)
- `geographicAssociations` — array of `{ areaRef, associationType }` where associationType
  is one of: `primary-site` / `service-area` / `ward` / `municipality` / `traditional-authority`

**On `developmentNotice`:**
- `affectedArea` — reference to listing (area)
- `siteBoundary` — affected site boundary polygon (GeoJSON)

---

## Spatial Data Model — Platform Core

### Source registry table (`spatial_sources`)

New table in `ufsmpqxniswdnsywjzje` Supabase project.

```sql
CREATE TABLE spatial_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  institution TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'arcgis-featureserver' | 'arcgis-mapserver' | 'wfs' | 'download' | 'static-map'
  base_url TEXT,
  layer_id TEXT,
  description TEXT,
  geographic_coverage TEXT, -- 'amajuba' | 'newcastle' | 'kzn' | 'national'
  coordinate_system TEXT DEFAULT 'EPSG:4326',
  requires_auth BOOLEAN DEFAULT false,
  permission_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'restricted' | 'denied'
  permission_notes TEXT,
  custodian_name TEXT,
  custodian_email TEXT,
  last_checked_at TIMESTAMPTZ,
  last_successful_import_at TIMESTAMPTZ,
  dataset_date TEXT, -- date of the dataset itself (not import date)
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Spatial imports table (`spatial_imports`)

Tracks every import attempt — success, failure, data currency.

```sql
CREATE TABLE spatial_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES spatial_sources(id),
  status TEXT NOT NULL, -- 'success' | 'failed' | 'partial'
  features_imported INTEGER DEFAULT 0,
  error_message TEXT,
  import_type TEXT, -- 'boundary' | 'project' | 'infrastructure' | 'land-use'
  target_node_url TEXT, -- which governance node received this data
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);
```

---

## ArcGIS REST Connector

The connector must be able to:

1. Query service metadata: `{baseUrl}/rest/services?f=json`
2. Query layer metadata: `{baseUrl}/{layerId}?f=json`
3. Query features: `{baseUrl}/{layerId}/query?where=1=1&outFields=*&f=geojson`
4. Filter by bounding box: `&geometry={bbox}&geometryType=esriGeometryEnvelope&inSR=4326`
5. Handle pagination: `&resultOffset=0&resultRecordCount=1000`
6. Handle coordinate reference system: detect `spatialReference.wkid`, convert to WGS84 if needed

Amajuba District bounding box (WGS84): `27.8,-28.9,30.2,-27.2` (lng_min,lat_min,lng_max,lat_max)

---

## Intelligence API Extension — Spatial Capability

The governance node API contract gains a `spatial` capability (contract version 1.2).

```
GET /api/intelligence/spatial/summary
```

Returns:
```json
{
  "municipalities": [
    {
      "name": "Newcastle",
      "slug": "newcastle",
      "recordCount": 12,
      "noticeCount": 8,
      "activeProjects": 3,
      "activeDevNotices": 2
    }
  ],
  "wards": [
    {
      "wardNumber": 7,
      "municipality": "newcastle",
      "recordCount": 5,
      "activeProjects": 1
    }
  ],
  "generatedAt": "ISO datetime"
}
```

---

## Data Integrity Rules

These rules are non-negotiable:

1. A publicly accessible service is not permission to cache, transform, host or redistribute its data.
2. Every imported dataset preserves: source institution, custodian, date obtained, dataset version, geographic coverage, coordinate reference system, permission status.
3. An unverified project must not appear officially confirmed because it has been placed on a map.
4. Official source information is visually and structurally distinguished from Unami-generated records.
5. Water and sanitation infrastructure data from Amajuba District is restricted — do not seek it through another route.
6. QGIS-prepared boundary data is labelled with its source, date and permission level before import.
7. The governance node presents geographic context — it does not become COGTA, a municipality, PMU, regulator or statutory approval authority.

---

## Implementation Sequence

| Step | What | Where | Prerequisite |
|---|---|---|---|
| 1 | `spatial_sources` + `spatial_imports` migration | Platform Core Supabase | None |
| 2 | Source registry UI in Control Centre | `apps/umkhandlu` | Step 1 |
| 3 | ArcGIS REST connector (server-side utility) | Platform Core | Step 1 |
| 4 | `boundary` + `boundarySource` fields on `listing` schema | Governance Node Sanity | None |
| 5 | `siteGeopoint` + `geographicAssociations` on `campaign` schema | Governance Node Sanity | None |
| 6 | Boundary rendering in Leaflet map | Governance Node | Step 4 |
| 7 | QGIS-prepared ward boundaries imported for Amajuba | Governance Node | Steps 4 + QGIS work |
| 8 | Spatial intelligence API endpoint | Governance Node | Steps 4 + 5 |
| 9 | Geographic view in Control Centre | `apps/umkhandlu` | Steps 1 + 8 |
| 10 | Source health monitoring | Platform Core | Steps 1 + 2 |

Steps 1–3 (Platform Core) and Steps 4–6 (Governance Node) are independent and proceed in parallel.

---

## What Is Not Built Here

- A standalone GIS viewer
- A second database for spatial data
- A new Sanity, Vercel or Supabase project
- PostGIS (not required — GeoJSON stored in Sanity JSONB is sufficient for Amajuba scale)
- Real-time spatial subscriptions
- Automated QGIS pipelines (QGIS is an operator tool, not a server process)
