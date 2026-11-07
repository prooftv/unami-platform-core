# GIS, Spatial Intelligence, Risk and Compliance Integration

Constitutional reference — Unami Platform Core + Umkhandlu Governance Node
Status: Active implementation workstream
Last updated: 2026-11-07
Mandate: Full lifecycle management, end-to-end automation, risk and compliance capability

---

## What This Is

Umkhandlu is a place-based governance intelligence platform for Amajuba District.
This workstream builds a world-class governance intelligence, spatial intelligence,
risk and compliance capability — not a map viewer, not a collection of CRUD screens,
not a manually operated GIS workflow.

The required outcome is a functioning, automated, auditable and maintainable system
that serves the 2027 launch.

---

## Two-System Architecture — Preserved

**Umkhandlu Governance Node** (`umkhandlu.unamifoundation.org` / `prooftv/Umkhandlu`)
- Owns all geographic content: area listings, boundaries, project-to-geography relationships
- Presents public maps, geographic context, project locations
- Sanity CMS is the editorial layer for all geographic content
- Leaflet renders point coordinates and boundary polygons

**Platform Core Governance Intelligence Centre** (`apps/umkhandlu` / `prooftv/unami-platform-core`)
- Connects to authorised institutional spatial data sources
- Runs automated ingestion, validation, transformation and publication pipelines
- Manages risk registers, compliance obligations, controls and evidence
- Monitors source health, data currency, pipeline execution, alerts
- Aggregates geographic and governance intelligence across nodes

No new Sanity, Vercel or Supabase projects are created for this work.

---

## QGIS Role — Revised

The earlier specification treated QGIS as an operator-only tool and excluded automated
spatial processing. This decision is revised.

### QGIS and GDAL/OGR — Automated Processing

The following processing is automated using GDAL/OGR (available server-side without a GUI):

- Coordinate reference system reprojection to WGS84 (EPSG:4326)
- Clipping to Amajuba District extent (bbox: `27.8,-28.9,30.2,-27.2`)
- Geometry validation and repair (`ogr2ogr` with `-makevalid`)
- Geometry simplification (Douglas-Peucker via `ogr2ogr -simplify`)
- Duplicate detection by geometry hash
- Spatial matching and area association
- GeoJSON and GeoPackage export

QGIS Desktop is retained for:
- Initial inspection of unfamiliar institutional datasets
- Manual review of automated processing results before publication
- Georeferencing static map products
- Complex geometry repair that GDAL cannot handle automatically

Automated processing does not replace human review before publication.
Every automated import is staged and requires operator approval before going live.

### Automated Data Flow

```
Institutional source (ArcGIS REST / WFS / Shapefile download)
    │
    ▼
Ingestion pipeline (scheduled or triggered)
    │  — fetch, fingerprint, detect changes
    ▼
Staging area (raw data, unprocessed)
    │
    ▼
GDAL/OGR processing (reproject → clip → validate → simplify)
    │  — geometry validation report generated
    ▼
Staged GeoJSON (WGS84, Amajuba extent, web-optimised)
    │
    ▼
Operator review (approve / reject / flag)
    │
    ▼
Publication pipeline (approved data → Sanity boundary fields via API)
    │
    ▼
Governance node public map (Leaflet renders boundary polygons)
    │
    ▼
Intelligence API spatial endpoint → Control Centre geographic view
```

---

## Four Institutional Sources

### 1. ILIS — Integrated Land Information System

**Purpose:** Land and property context — cadastral, tenure, land-use
**Access:** ArcGIS REST FeatureServer / authorised download
**Permission status:** Pending confirmation
**Automation:** Scheduled weekly check; import on change detection

### 2. KZN COGTA Spatial Dashboard

**Purpose:** Municipal and ward boundaries, institutional locations, infrastructure
**Access:** ArcGIS REST MapServer / FeatureServer
**Permission status:** Pending confirmation — public access ≠ redistribution permission
**Automation:** Scheduled weekly check; ward boundaries are the primary target

### 3. SIFT — Spatial Integration Framework Tool

**Purpose:** Spatial planning indicators and focus area assessments
**Access:** ArcGIS REST / KZN COGTA portal
**Note:** `PSDF_10_8_2_WebMap` is a web map reference only — correct indicator datasets
not yet identified. Do not treat this source as resolved.
**Automation:** Manual import until correct datasets are confirmed

### 4. Amajuba District Municipality GIS

**Contact:** Mr Udiv Budhal (GIS Manager)
**Response:** 3 November 2026 — Data and Map Request Form required
**Form submission:** Prepared (see Amajuba GIS Request section below)
**Water/sanitation restriction:** Absolute — do not seek through any other route
**Escalation for water/sanitation:** Ms Thubelihle Buthelezi — thubelihleb@amajuba.gov.za
**Expected data:** Municipal boundary, ward boundaries, infrastructure (non-restricted),
land-use, institutional locations, roads, public facilities, development projects
**Automation:** Import pipeline ready; awaiting data delivery

### 5. Newcastle PMU

**Purpose:** Development project information with geographic context
**Note:** Buffalo River Abstraction Works is a demonstration record — NOT confirmed PMU data
**Data-sharing agreement:** Required before attributed project data is used
**Automation:** Import pipeline ready; awaiting agreement and data

### 6. NGI Static Maps

**Purpose:** Cartographic reference (e.g. 2829DB Ladysmith)
**Automation:** Manual georeferencing in QGIS; not automated

---

## Amajuba GIS Data Request — Form Submission

**Status:** Form prepared, not yet submitted (alignment issue in PDF — do not submit the misaligned version)

**Form details:**

| Field | Value |
|---|---|
| Date requested | 04/11/2026 |
| Organisation | Unami Foundation NPC |
| Client name | Bhekithemba Simelane |
| Tel / Cell | 072 700 2502 |
| Email | info@unamifoundation.org |
| Postal address | House 1033, Section 1, Madadeni, 2951 |
| Date product required | As soon as practicable |
| Urgent | No |

**Description of request:**
District-wide Amajuba GIS data for Unami Foundation's Umkhandlu Governance Intelligence platform.
Requested information includes district and municipal boundaries; wards; Traditional Authority areas,
isigodi and settlements/localities where available; land-use, cadastral and spatial-planning layers
where releasable; roads, public facilities, community infrastructure (excluding water and sanitation
assets), development projects and environmental layers. Please include available metadata, data dates,
source/custodian details and permitted-use conditions.

**Map and digital data details:**

| Field | Value |
|---|---|
| Title | Amajuba District – Administrative and Development Planning GIS Layers |
| Subtitle | Umkhandlu district-wide spatial reference and governance intelligence |
| Projection | WGS84 (EPSG:4326); please identify source CRS |
| Scale | N/A – digital data |
| Format | Shapefile (primary); GeoPackage also welcome |
| Attribute data | DBF and Excel |
| Delivery | Email |
| Other | Provide metadata, layer descriptions, data dates and permitted-use conditions |

**Boundary on request:** Water and sanitation datasets are deliberately excluded.
Mr Budhal confirmed these will not be disseminated through his office.
Water/sanitation will be requested separately from Ms Thubelihle Buthelezi.

**Action required:** Founder to submit correctly aligned PDF form to Mr Udiv Budhal.

---

## Full Lifecycle Management

Every resource in this system implements complete CRUD with:
- Server-side validation
- Access controls (operator role required for all write operations)
- Audit events (who, what, when, previous value)
- Soft deletion / controlled retirement where records have downstream dependencies
- Versioning where records are published or referenced
- Search, filtering, sorting, pagination
- Bulk operations where appropriate
- Activity history at record level
- Loading, empty and error states in UI

Resources requiring full lifecycle management:

| Resource | CRUD | Versioning | Soft delete | Audit |
|---|---|---|---|---|
| Spatial sources | ✅ | — | ✅ | ✅ |
| Spatial imports / jobs | ✅ | — | — | ✅ |
| Datasets and layers | ✅ | ✅ | ✅ | ✅ |
| Geographic areas | ✅ | ✅ | ✅ | ✅ |
| Risk registers | ✅ | ✅ | ✅ | ✅ |
| Risk assessments | ✅ | ✅ | — | ✅ |
| Compliance obligations | ✅ | ✅ | ✅ | ✅ |
| Controls | ✅ | ✅ | ✅ | ✅ |
| Control tests | ✅ | — | — | ✅ |
| Evidence | ✅ | — | ✅ | ✅ |
| Exceptions / findings | ✅ | ✅ | — | ✅ |
| Remediation actions | ✅ | — | — | ✅ |
| Pipeline configurations | ✅ | ✅ | ✅ | ✅ |
| Pipeline execution history | read + replay | — | — | ✅ |
| Alerts and notifications | ✅ | — | ✅ | ✅ |

---

## Risk and Compliance Layer

### Risk Management

Every risk record contains:
- Risk identifier, title, description
- Category (spatial / governance / data / operational / compliance / external)
- Likelihood (1–5), impact (1–5), exposure score (likelihood × impact)
- Risk owner (operator)
- Treatment: accept / mitigate / transfer / avoid
- Treatment plan and deadline
- Linked controls
- Linked evidence
- Assessment methodology, author, date
- Revision history (every reassessment preserved)
- Status: open / under-treatment / closed / accepted

Risk scores are transparent and explainable. No automated risk scoring without
displaying the methodology and inputs. No unsupported claims of statutory compliance.

### Compliance Management

Every compliance obligation contains:
- Obligation identifier, title, description
- Source (legislation, regulation, contract, policy, institutional requirement)
- Responsible party
- Due date and recurrence
- Linked controls
- Evidence requirements
- Status: compliant / non-compliant / under-review / not-applicable
- Assessment history

### Controls

Every control contains:
- Control identifier, title, description
- Control type: preventive / detective / corrective
- Linked risks and obligations
- Test frequency
- Last test date and result
- Evidence of last test
- Owner

### Evidence

Every evidence record contains:
- Title, description, document type
- Source (operator-uploaded / system-generated / external)
- Date of evidence
- Linked risk / obligation / control / finding
- File reference or URL
- Provenance: who provided it, when, how verified
- Retention status

### Findings, Exceptions and Incidents

- Finding: identified gap or non-conformance
- Exception: approved deviation from a control or obligation
- Incident: event that triggered a risk or compliance failure
- All three link to remediation actions with owners and deadlines

### Audit Trail

Every state change on every risk, compliance, control, evidence, finding and
remediation record is logged with: actor, timestamp, previous state, new state, reason.
Audit logs are immutable. No deletion of audit events.

---

## Automation Architecture

### Pipeline Types

| Pipeline | Trigger | Frequency |
|---|---|---|
| Source health check | Scheduled | Daily |
| ArcGIS feature fetch | Scheduled | Weekly per source |
| WFS / download fetch | Scheduled | Weekly per source |
| GDAL processing | Event (after fetch) | On new data |
| Geometry validation | Event (after processing) | On processed data |
| Staging review notification | Event | On staged data |
| Publication | Manual (operator approval) | On approval |
| Reconciliation | Scheduled | Weekly |
| Data freshness alert | Scheduled | Daily |
| Risk assessment reminder | Scheduled | Per obligation due date |
| Compliance deadline alert | Scheduled | Per deadline |

### Pipeline Requirements

Every pipeline implements:
- Idempotent processing (safe to replay)
- Job locking (no duplicate concurrent runs)
- Retry with exponential backoff (max 3 attempts)
- Failure recovery and structured error logging
- Execution history with start time, end time, status, record counts, errors
- Manual execution trigger (operator can force a run)
- Controlled replay of failed jobs
- Notifications on failure and on data quality issues

### Execution Infrastructure

Supabase Edge Functions handle:
- Scheduled pipeline execution (via pg_cron or Supabase scheduled functions)
- ArcGIS REST connector calls
- GDAL/OGR processing (via subprocess or WASM where available)
- Staging area management
- Publication to Sanity via Content Lake API
- Alert generation

---

## Database Schema — Platform Core (`ufsmpqxniswdnsywjzje`)

### Existing (migration 005)
- `spatial_sources` — source registry
- `spatial_imports` — import history

### Required additions (migration 006+)

**`spatial_datasets`** — individual datasets/layers within a source
- id, source_id, name, layer_id, description, geographic_coverage, crs, dataset_date,
  retrieval_date, fingerprint, feature_count, file_size_bytes, status, permission_status,
  permission_notes, custodian_name, custodian_email, provenance, transformation_history,
  last_processed_at, published_at, active, created_at, updated_at

**`spatial_pipeline_runs`** — execution history
- id, pipeline_type, source_id, dataset_id, status, started_at, completed_at,
  features_fetched, features_processed, features_published, error_message,
  log_jsonb, triggered_by, created_at

**`spatial_staged_features`** — staging area for operator review
- id, dataset_id, pipeline_run_id, feature_geojson, feature_properties,
  geometry_valid, geometry_issues, operator_status (pending/approved/rejected),
  reviewed_by, reviewed_at, notes, created_at

**`risk_registers`** — risk register per node/domain
- id, node_id, title, description, owner, status, created_at, updated_at

**`risks`** — individual risk records
- id, register_id, identifier, title, description, category, likelihood, impact,
  exposure, owner, treatment, treatment_plan, treatment_deadline, status,
  methodology, assessed_by, assessed_at, created_at, updated_at

**`risk_revisions`** — immutable revision history
- id, risk_id, likelihood, impact, exposure, treatment, assessed_by, assessed_at,
  reason, evidence_refs, created_at

**`compliance_obligations`** — compliance register
- id, node_id, identifier, title, description, source, responsible_party,
  due_date, recurrence, status, assessed_by, assessed_at, created_at, updated_at

**`controls`** — control definitions
- id, node_id, identifier, title, description, control_type, test_frequency,
  last_tested_at, last_test_result, owner, status, created_at, updated_at

**`control_tests`** — test execution records
- id, control_id, tested_by, tested_at, result, evidence_refs, notes, created_at

**`evidence_records`** — evidence store
- id, node_id, title, description, document_type, source_type, evidence_date,
  file_url, provided_by, verified_by, verified_at, linked_risk_id,
  linked_obligation_id, linked_control_id, linked_finding_id,
  retention_status, created_at, updated_at

**`findings`** — gaps, exceptions, incidents
- id, node_id, finding_type (gap/exception/incident), title, description,
  severity, owner, status, identified_at, closed_at, created_at, updated_at

**`remediation_actions`** — corrective and preventive actions
- id, finding_id, title, description, owner, due_date, status,
  completed_at, evidence_refs, created_at, updated_at

**`audit_log`** — immutable audit trail
- id, table_name, record_id, actor, action, previous_state_jsonb,
  new_state_jsonb, reason, created_at

---

## Spatial Data Model — Governance Node

### Existing (implemented)
- `listing.geopoint` — point coordinate ✅
- `listing.areaLevel` — geographic level ✅
- `listing.wardNumber`, `municipality`, `parentArea` ✅
- `campaign.relatedAreas` ✅

### Implemented (last session)
- `listing.boundary` — GeoJSON polygon ✅
- `listing.boundarySource`, `boundaryDate`, `boundaryPermission` ✅
- `campaign.siteGeopoint`, `geographicAssociations` ✅

### Still required
- `developmentNotice.affectedArea` — reference to listing (area)
- `developmentNotice.siteBoundary` — affected site boundary polygon
- Leaflet boundary polygon rendering (CommunityMapLeaflet.tsx)
- `/api/intelligence/spatial/summary` endpoint
- Spatial summary in Control Centre geographic view

---

## Intelligence API — Spatial Capability (contract v1.2)

```
GET /api/intelligence/spatial/summary
Authorization: Bearer <api-key>
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
      "activeDevNotices": 2,
      "boundaryAvailable": true
    }
  ],
  "wards": [
    {
      "wardNumber": 7,
      "municipality": "newcastle",
      "recordCount": 5,
      "activeProjects": 1,
      "boundaryAvailable": false
    }
  ],
  "generatedAt": "ISO datetime"
}
```

---

## Implementation Plan

### Phase GIS-1 — Foundation (partially complete)

| Step | What | Status |
|---|---|---|
| Constitutional docs | GIS_INTEGRATION.md (both repos) | ✅ Written |
| `spatial_sources` + `spatial_imports` migration | Platform Core Supabase | ✅ Applied |
| ArcGIS REST connector | `apps/umkhandlu/src/lib/gis/arcgis-connector.ts` | ✅ Built |
| Source registry UI | `apps/umkhandlu/src/app/(umkhandlu)/spatial/sources/` | ✅ Built |
| Geographic view placeholder | `apps/umkhandlu/src/app/(umkhandlu)/spatial/map/` | ✅ Built |
| Sidebar spatial section | `apps/umkhandlu/src/navigation/sidebar/sidebar-items.ts` | ✅ Built |
| `listing` boundary fields | Governance node Sanity schema | ✅ Built |
| `campaign` site fields | Governance node Sanity schema | ✅ Built |
| Push GIS commit to origin/trunk | Governance node | ⏳ Pending |

### Phase GIS-2 — Full CRUD and Source Management

| Step | What | Status |
|---|---|---|
| Source CRUD (create, edit, deactivate) | Control Centre UI | ⏳ |
| Source health check pipeline | Edge Function + scheduled | ⏳ |
| `spatial_datasets` migration | Platform Core Supabase | ⏳ |
| `spatial_pipeline_runs` migration | Platform Core Supabase | ⏳ |
| `spatial_staged_features` migration | Platform Core Supabase | ⏳ |
| Dataset/layer registry UI | Control Centre | ⏳ |
| Pipeline execution UI (run, history, replay) | Control Centre | ⏳ |
| Staging review UI (approve/reject features) | Control Centre | ⏳ |
| GDAL/OGR processing pipeline | Edge Function | ⏳ |
| Amajuba GIS form submission | Founder action | ⏳ |

### Phase GIS-3 — Risk and Compliance

| Step | What | Status |
|---|---|---|
| Risk/compliance migrations (006+) | Platform Core Supabase | ⏳ |
| Risk register CRUD | Control Centre | ⏳ |
| Risk assessment UI (likelihood/impact/treatment) | Control Centre | ⏳ |
| Compliance obligations CRUD | Control Centre | ⏳ |
| Controls CRUD + test recording | Control Centre | ⏳ |
| Evidence management | Control Centre | ⏳ |
| Findings, exceptions, incidents | Control Centre | ⏳ |
| Remediation actions | Control Centre | ⏳ |
| Audit log viewer | Control Centre | ⏳ |
| Management reporting dashboard | Control Centre | ⏳ |

### Phase GIS-4 — Spatial Publication and Map Rendering

| Step | What | Status |
|---|---|---|
| Leaflet boundary polygon rendering | Governance node | ⏳ |
| `/api/intelligence/spatial/summary` | Governance node | ⏳ |
| `developmentNotice` geographic fields | Governance node Sanity | ⏳ |
| Geographic view in Control Centre | `apps/umkhandlu` | ⏳ |
| Ward boundary import (COGTA data) | Governance node | ⏳ (awaiting data) |
| Amajuba DM boundary import | Governance node | ⏳ (awaiting form response) |

### Phase GIS-5 — Automation and Monitoring

| Step | What | Status |
|---|---|---|
| Scheduled pipeline infrastructure | Supabase pg_cron | ⏳ |
| Data freshness monitoring | Edge Function | ⏳ |
| Alert generation and notification | Edge Function | ⏳ |
| Pipeline configuration UI | Control Centre | ⏳ |
| Reconciliation pipeline | Edge Function | ⏳ |
| Operational observability dashboard | Control Centre | ⏳ |

---

## Data Integrity Rules — Non-Negotiable

1. A publicly accessible service is not permission to cache, transform, host or redistribute its data.
2. Every dataset preserves: institution, custodian, date obtained, dataset version, geographic coverage, CRS, permission status, provenance, transformation history.
3. An unverified project must not appear officially confirmed because it has been placed on a map.
4. Official source information is visually and structurally distinguished from Unami-generated records.
5. Water and sanitation infrastructure data from Amajuba District is restricted — absolute, no exceptions.
6. QGIS-prepared or GDAL-processed boundary data is labelled with source, date and permission level before import.
7. The governance node presents geographic context — it does not become COGTA, a municipality, PMU, regulator or statutory approval authority.
8. Risk scores are transparent and explainable — methodology, author, date and evidence are always displayed.
9. No automated legally reserved institutional decisions.
10. Automated imports are staged — operator approval required before publication.
11. Audit logs are immutable — no deletion of audit events.
12. Soft deletion only for records with downstream dependencies — no destructive deletion of published records.

---

## What Is Not Built Here

- A standalone GIS viewer
- A second database for spatial data (GeoJSON in Sanity JSONB is sufficient for Amajuba scale)
- PostGIS (not required — assess actual geometry volumes before reconsidering)
- A new Sanity, Vercel or Supabase project
- Real-time spatial subscriptions
- Automated legally reserved institutional decisions
- Water and sanitation infrastructure data from Amajuba District
