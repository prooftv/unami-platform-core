# Amajuba Geographic Coverage Register

Living reference — Unami Platform Core / Umkhandlu Governance Node
Status: Active
Last updated: 2026-11-12 (MDB ingestion complete)
Maintained by: platform investigation + monthly source monitoring

---

## Purpose

This register establishes the reliable geographic inventory for the Umkhandlu Amajuba
deployment. It distinguishes:

1. **Geographic entities** — district, municipalities, wards, traditional authorities, isigodi, settlements
2. **Geometry** — boundary polygons, points, lines or no geometry
3. **Source authority** — who defines or maintains the information
4. **Permission** — what Unami may view, process, display or redistribute
5. **Operational coverage** — whether the Governance Node has records associated with that geography

A source being official does not mean its data is current, complete, downloadable or
authorised for redistribution. These are separate questions and must be answered separately.

---

## Status Definitions

| Status | Meaning |
|---|---|
| `available` | Source or geometry identified, queryable, permission confirmed or public domain |
| `validate` | Source identified, but geometry, currency, permission or accuracy still needs checking |
| `gap` | No sufficiently verified geographic representation established |
| `reference` | Useful for geographic context, not a substitute for authoritative geometry |
| `restricted` | Absolute restriction — do not ingest, display or redistribute |
| `historical` | Superseded by newer data — retain for comparison only |

---

## Key Investigation Findings (2026-11-12)

### MDB Wards 2026 — INGESTED AND PUBLISHED ✅

**This is the most significant finding — now complete.**

The Municipal Demarcation Board publishes a live ArcGIS FeatureServer with 2026 ward
boundaries for all South African municipalities.

```
https://services7.arcgis.com/oeoyTUJC8HEeYsRB/arcgis/rest/services/MDB_Wards_2026/FeatureServer/0
```

Confirmed and ingested:
- Amajuba DC25: **55 wards** — Newcastle 36, Emadlangeni 6, Dannhauser 13
- Geometry: WGS84 (EPSG:4326), Polygon/MultiPolygon
- All 55 features validated: 0 geometry errors, 0 duplicate WardIDs
- All features within Amajuba spatial extent
- CAT_B codes verified: KZN252 (Newcastle), KZN253 (Emadlangeni), KZN254 (Dannhauser)
- DATE field: 2026 delimitation epoch confirmed
- Licence: Public domain, attribution required
- Attribution: Municipal Demarcation Board of South Africa (MDB)

**Control Centre dataset ID: `017eeb0a-89ec-416f-b2b5-d6a58edbf1d4`**
**Source ID: `bc86c5c0-f2d9-42bf-b563-6074dfe6d8ec`**
**Pipeline run ID: `62cf0baf-a9be-4af6-9604-202b52d1553b`**
**Status: published — 55/55 features approved, visible on `/spatial/map`**

22 validation tests pass (see `src/lib/gis/__tests__/mdb-ingestion.test.ts`).

### COGTA ILIS — newly identified layers

The research document identified two layers not previously registered:

- **ILIS_Base_map_2025 / MapServer / 50** — Ward boundary (MDB 2021), polygon, GeoJSON support
- **ILIS_Base_map_2025 / MapServer / 31** — Traditional Council Boundaries, polygon, GAZETTESTA field

Both are on `giswebmaps1.kzncogta.gov.za` which currently returns HTTP 502 on all
query endpoints from external IPs. Service roots were previously accessible but are
now also returning 502. These layers are catalogued but not yet retrievable.

**Status: `validate` — layer metadata confirmed in service catalogue, geometry not yet retrieved**

### COGTA SIFT — traditional council layer

- **PSDF_10_8_2_WebMap / MapServer / 3** — Traditional Council Boundaries, polygon

Same server, same 502 block. Catalogued, not retrievable.

**Status: `validate`**

### KZN Transport GIS

SSL certificate issue from this environment. Layer catalogue not yet inspected.
Identified as a useful independent comparison source for traditional council polygons.

**Status: `validate` — needs manual inspection**

---

## A. Administrative Geography

| Entity | Coverage | Source | Permission | Status |
|---|---|---|---|---|
| District boundary | Amajuba DC25 | MDB 2026 FeatureServer | Public domain, attribution | `available` |
| District boundary | Amajuba DC25 | DPME FeatureServer (existing) | Reference | `reference` |
| Municipality boundary | Newcastle KZN252 | MDB 2026 FeatureServer | Public domain, attribution | `available` |
| Municipality boundary | Emadlangeni KZN253 | MDB 2026 FeatureServer | Public domain, attribution | `available` |
| Municipality boundary | Dannhauser KZN254 | MDB 2026 FeatureServer | Public domain, attribution | `available` |
| Municipality boundaries | All 3 LMs | ArcGIS Online SouthAfricanBoundaries (existing) | Reference | `reference` |
| Electoral wards — 2026 | 55 wards (DC25) | MDB 2026 FeatureServer | Public domain, attribution | `available` — **INGESTED** |
| Electoral wards — 2021 | Historical | COGTA ILIS layer 50 | Pending COGTA form | `historical` |

**Notes:**
- DPME district boundary has a known data quality issue: Province field shows "Free State".
  Geometry is correct. Retain as reference, do not use as primary.
- MDB 2026 is the authoritative reference for current ward geography.
- 2021 COGTA ILIS ward layer is historical reference only — do not present as current.

---

## B. Traditional Authorities and Traditional Land Areas

This is more complex than a simple boundary list. Three distinct entity types must be
kept separate:

1. **Traditional council institutions** — gazetted bodies with leadership
2. **Traditional authority / community authority areas** — land areas under traditional governance
3. **Traditional land parcels** — specific land parcels (often Ingonyama Trust)

### Identified traditional entities

| Entity | Type | Source | Status |
|---|---|---|---|
| Ubuhle-Bomzinyathi | Community authority area | Amajuba SDF 2024/25 | `validate` polygon |
| Nyanyadu | Community authority area | Amajuba SDF 2024/25 | `validate` polygon |
| Khathide Traditional Council | Council institution | Newcastle IDP/SDF | Institution confirmed, boundary `validate` |
| Ndlamlenze Traditional Council | Council institution | Newcastle IDP 2019/20 | `validate` current status |
| Mgundeni Traditional Council | Council institution | Newcastle IDP 2019/20 | `validate` current status |
| Gule Traditional Council | Council institution | Newcastle IDP 2019/20 | `validate` current status |
| Amajuba Traditional Council | District-level traditional forum | Newcastle IDP | Relationship to verify |

**Important:** The Amajuba SDF identifies two community authority areas. This does not
mean Amajuba has only two recognised traditional councils. Newcastle municipal documentation
identifies at least four separate traditional council institutions.

**Ingonyama Trust Board** has responsibilities relating to administration and long-term
leasing of relevant land parcels within traditional areas. This is a separate layer from
council boundaries.

### Boundary source candidates

| Source | Layer | Type | Status |
|---|---|---|---|
| COGTA ILIS | MapServer/31 | Traditional Council polygons, GAZETTESTA field | `validate` — 502 blocked |
| COGTA SIFT PSDF | MapServer/3 | Traditional Council polygons | `validate` — 502 blocked |
| KZN Transport GIS | TBC | Traditional Council polygons | `validate` — needs inspection |

These are concrete technical leads. Investigate via the existing COGTA access request
and the permission controls already in development. Do not start a new email exercise.

---

## C. Settlements, Villages and Localities

### Initial Locality Register

| Locality | Municipality / Context | Evidence | Status |
|---|---|---|---|
| Newcastle | Newcastle | Municipal SDF | Identified |
| Osizweni | Newcastle | SDF, schools, ward maps | Identified |
| Madadeni | Newcastle | SDF, ward maps, public facilities | Identified |
| Mndozo / Mndozi | Newcastle, Osizweni context | Newcastle SDF; DBE school listing (Khethokuhle Primary, Mndozo Farm); Human Settlements housing project list | Name reconciliation — use Mndozo as canonical, Mndozi as alias |
| Dicks Halt | Newcastle | Newcastle SDF, 2026 ward information | Identified |
| Khathide | Newcastle, northern Osizweni | Newcastle SDF and IDP; identified as Traditional Council | Identified |
| KwaGudlucingo | Pilot locality | Existing project context | Community verification required |
| Nyanyadu | Dannhauser context | Amajuba SDF | Identified |
| Ubuhlebomzinyathi | Amajuba/Newcastle context | Amajuba and Newcastle SDFs | Identified |
| Utrecht | Emadlangeni | Amajuba SDF | Identified |
| Hattingspruit | Dannhauser | Amajuba SDF | Identified |
| Durnacol | Dannhauser | Amajuba SDF | Identified |
| Kwamdakane | Amajuba | Amajuba SDF | Identified |
| Mahlwane | Amajuba | Amajuba SDF | Identified |
| Imfundwane | Amajuba | Amajuba SDF | Identified |
| Mbabane | Amajuba | Amajuba SDF | Identified |
| Hadebe | Amajuba | Amajuba SDF | Identified |
| Zondo | Amajuba | Amajuba SDF | Identified |
| Alcockspruit | Newcastle | Amajuba SDF (land reform settlement) | Identified |
| Mossdale | Newcastle | Amajuba SDF (land reform settlement) | Identified |
| Elandsklip | Newcastle | Amajuba SDF (land reform settlement) | Identified |
| Long Lands | Newcastle | Amajuba SDF (land reform settlement) | Identified |

**Notes:**
- Mndozo and Mndozi are the same place. Maintain Mndozi as alias until confirmed.
  Do not create duplicate locality records.
- KwaGudlucingo is not found in indexed official documents. This does not establish
  that the place does not exist. Requires local confirmation of name, parent locality
  and position.
- AmaHlubi settlement around Drycut may fall outside the proclaimed area (Newcastle SDF
  warning). Do not assign a boundary assumption to this locality.
- SDF maps are planning maps — do not digitise as if they were precise surveyed boundaries.

### Pilot locality hierarchy (most important for initial deployment)

The documentary evidence connects these entities into a verifiable hierarchy:

```
Amajuba District (DC25)
  └── Newcastle Municipality (KZN252)
        └── MDB 2026 Ward (TBC — ward number to be confirmed)
              └── Ubuhlebomzinyathi Community Authority Area
                    ├── Khathide Traditional Council
                    │     └── Khathide locality (northern Osizweni)
                    ├── Mndozo locality
                    └── Dicks Halt locality
  └── KwaGudlucingo (parent locality and ward TBC — community verification)
```

Where a legally recognised boundary is not available, the map must present verified
locality points and area associations without implying an exact boundary exists.

---

## D. Additional Data Sources

### Confirmed accessible

| Source | Purpose | Access | Permission | Status |
|---|---|---|---|---|
| MDB 2026 FeatureServer | Ward + district boundaries | ArcGIS REST, no auth | Public domain, attribution | `available` |
| DPME FeatureServer | District + LM boundaries (existing) | ArcGIS REST, no auth | Reference | `reference` |
| ArcGIS Online SouthAfricanBoundaries | District + LM boundaries (existing) | ArcGIS REST, no auth | Reference | `reference` |

### Identified, not yet validated

| Source | Purpose | Access | Permission | Status |
|---|---|---|---|---|
| CD:NGI Geospatial Portal | Topographic, roads, hydrography, settlements | WMS/WFS/download | Per dataset — check | `validate` |
| DFFE EGIS | Land cover, protected areas, environmental | Download | Free, custodian attribution | `validate` |
| Stats SA 2022 ward estimates | Ward-level population (2020 ward boundaries) | Download | Open | `validate` — note: 2020 wards, not 2026 |
| KZN Transport GIS | Roads, wards, traditional councils | ArcGIS REST | Validate vintage and permission | `validate` |
| Amajuba SDF 2024/25 | Settlement patterns, transport, social facilities, land parcels | PDF/planning maps | Planning reference | `reference` |
| KZN COGTA Municipal Data portal | Ward profiles, PDMC, LED, electricity, dams | Web portal | Validate per dataset | `validate` |
| KZN Office of the Premier GIS | Admin boundaries, cadastral, health, education, transport | Web portal | Validate per dataset | `validate` |

### Blocked pending COGTA form approval

| Source | Layers of interest | Status |
|---|---|---|
| COGTA ILIS Base Map 2025 | Layer 31 (traditional councils), Layer 50 (2021 wards) | `validate` — 502 blocked |
| COGTA SIFT PSDF | Layer 3 (traditional councils) | `validate` — 502 blocked |
| COGTA Ward Profile V3 | District municipal boundaries | `pending` — 502 blocked |
| COGTA Flood Risk | Municipal flood risk indicators | `pending` — 502 blocked |
| COGTA Disaster Incidents | Disaster incident points | `pending` — 502 blocked |
| COGTA Disaster Risk Reduction ILIS | PDMC flood incidents, schools, health | `pending` — 502 blocked |
| COGTA Land Use Scheme Pillar 2026 | Land use layers | `pending` — 502 blocked |
| COGTA Land Tenure Component v2 | Land tenure classification | `pending` — 502 blocked |
| COGTA Road Transport | Road network | `pending` — 502 blocked |

### Absolute restriction

| Source | Restriction |
|---|---|
| Amajuba water and sanitation infrastructure | Absolute — do not ingest, display or redistribute. Amajuba GIS Manager confirmed. |
| COGTA Infrastructure 2022 — water/sanitation layers | Absolute — independent restriction from Amajuba DM |

---

## E. Coverage Assessment Summary

| Layer | Status | Blocker |
|---|---|---|
| District boundary | `available` | None — MDB 2026 queryable |
| Municipality boundaries (3 LMs) | `available` | None — MDB 2026 queryable |
| 2026 ward boundaries (55 wards) | `available` — **INGESTED** | None — published in Control Centre |
| 2021 ward boundaries | `historical` | COGTA 502 block |
| Traditional council polygons | `validate` | COGTA 502 block + permission pending |
| Traditional council institutions | `validate` | Gazetted status verification |
| Community authority area polygons | `validate` | COGTA/SDF source reconciliation |
| Settlement/locality points | `validate` | Sanity area records need populating |
| Isigodi boundaries | `gap` | No verified source identified |
| Roads | `validate` | NGI/KZN Transport source selection |
| Environmental layers | `validate` | DFFE EGIS access confirmation |
| Flood risk | `pending` | COGTA form approval + 502 unblock |
| Disaster incidents | `pending` | COGTA form approval + 502 unblock |
| Land use | `pending` | COGTA form approval + 502 unblock |
| Water/sanitation infrastructure | `restricted` | Absolute — no exceptions |

---

## F. Implementation Sequence

| Priority | Work | Status |
|---|---|---|
| 1 | Register MDB 2026 as new spatial source in Control Centre | ✅ Complete — source ID `bc86c5c0` |
| 2 | Ingest all 55 Amajuba wards from MDB 2026 FeatureServer | ✅ Complete — dataset ID `017eeb0a`, 55/55 published |
| 3 | Submit COGTA data request form | ✅ Submitted — awaiting approval |
| 4 | Populate Sanity area geopoints — Khathide, Mndozo, KwaGudlucingo | ⏳ Pending — requires Sanity Studio access |
| 5 | Remove generic centroid coordinates from 2 Sanity notices | ⏳ Pending — requires Sanity Studio access |
| 6 | Validate COGTA ILIS layer 31 and SIFT layer 3 (once unblocked) | ⏳ Blocked — COGTA form approval pending |
| 7 | Reconcile traditional polygons with Amajuba SDF and Newcastle IDP | ⏳ Blocked — depends on step 6 |
| 8 | Validate KZN Transport GIS and NGI sources | ⏳ Pending |
| 9 | Validate DFFE EGIS environmental layers | ⏳ Pending |
| 10 | Expand Sanity area records to full locality register | ⏳ Ongoing |

---

## G. Geographic Entity Register Schema

The Control Centre's existing `spatial_sources` and `spatial_datasets` tables manage
source provenance, permission, ingestion and publication.

A separate geographic entity register is needed for the Governance Node's area records.
The Sanity `listing` (area) schema should carry:

| Field | Purpose |
|---|---|
| `name` | Canonical name |
| `alternateNames` | Historical spellings, local variants |
| `areaLevel` | district / municipality / ward / traditional-authority / community-authority / locality / settlement / isigodi |
| `municipality` | Municipal relationship |
| `wardNumber` | Ward relationship (MDB 2026 ward number) |
| `wardId` | MDB WardID (e.g. `52502001`) for precise matching |
| `parentArea` | Geographic hierarchy reference |
| `geopoint` | Verified point coordinate |
| `boundary` | GeoJSON polygon (where available) |
| `boundarySource` | Source institution |
| `boundaryDate` | Vintage of boundary data |
| `boundaryPermission` | Effective permitted use |
| `precisionLevel` | `boundary` / `surveyed-point` / `approximate-point` / `area-association` |
| `verificationStatus` | `verified` / `provisional` / `disputed` / `unverified` |
| `coverageNotes` | Known limitations |

The Governance Node's Sanity records retain their own geographic associations.
They are not copied into the Control Centre.

---

## H. Monthly Source Monitoring

The following sources should be checked monthly for new Amajuba geography:

| Source | What to check |
|---|---|
| MDB Spatial Hub | New ward delimitation updates, boundary corrections |
| COGTA ILIS | Service availability, new layers |
| Stats SA | New ward-level statistical releases |
| Amajuba DM website | SDF updates, IDP revisions |
| Newcastle Municipality | IDP and SDF updates |
| KZN Gazette | Traditional council gazettements, ward determinations |

---

## I. Data Integrity Rules (Amajuba-specific)

1. MDB 2026 ward boundaries are the authoritative reference for current ward geography.
   Do not use 2021 COGTA ILIS wards as current.
2. DPME district boundary has a Province field data quality issue (shows Free State).
   Geometry is correct. Document the issue, do not reclassify the geography.
3. Traditional council institutions and traditional land areas are separate entities.
   Do not conflate them into a single boundary record.
4. SDF planning maps are not surveyed boundaries. Do not digitise them as precise geometry.
5. KwaGudlucingo requires local confirmation. Absence from indexed documents does not
   mean the place does not exist.
6. Mndozo and Mndozi are the same place. One record, one alias.
7. AmaHlubi/Drycut may fall outside the proclaimed area. Do not assign a boundary.
8. Water and sanitation infrastructure from Amajuba DM is absolutely restricted.
9. Where a boundary is not available, present a verified point or area association.
   Never imply precision that does not exist.
10. Every geometry record must carry: source institution, vintage, permission status,
    precision level and any known limitations.
