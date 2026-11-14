# Spatial Context Research and Audit

**Reviewed:** 2026-11-13
**Scope:** Unami Control Centre (`prooftv/unami-platform-core`) and Umkhandlu Governance Node (`prooftv/Umkhandlu`).

This is a source-based comparison and repository audit, not a claim that every
listed platform or every live dataset was exhaustively reviewed. External
repository findings below are limited to the cited files and documentation.

## 1. Open-source platform comparison

| Project | Stack and evidence-based pattern | Maturity and licence notes |
|---|---|---|
| [GratisGIS](https://github.com/palavido-dev/gratis-gis) | NestJS API, Next.js/PWA clients, PostgreSQL/PostGIS and MinIO. Its architecture documents append-only, bitemporal spatial observations, access-checked vector tiles, retaining source CRS alongside WGS84 output, and queued offline sync. See [architecture](https://github.com/palavido-dev/gratis-gis/blob/d54607daf2cbcca5ccb447be579f378b01b1da11/ARCHITECTURE.md#L210-L229) and [CRS policy](https://github.com/palavido-dev/gratis-gis/blob/d54607daf2cbcca5ccb447be579f378b01b1da11/ARCHITECTURE.md#L248-L290). | README reports v1.4.3 and an AGPL v3 badge; it also limits its replacement claims. |
| [Locus](https://github.com/IvettaDashkova/locus) | Next.js/Postgres/Drizzle. Its [schema](https://github.com/IvettaDashkova/locus/blob/d10e380a575b11cb0b2d4960c4a7143f8eb361ea/src/db/schema.ts#L20-L40) uses spatially indexed site anchors and links spatial submissions and retrieval records to stable domain entities. | Package is private, version 0.1.0; no licence was verified in the inspected root listing. |
| [OpenPlan](https://github.com/nfredmond/openplan) | Planning and GIS intake. Its [provenance model](https://github.com/nfredmond/openplan/blob/513b553e7284b4bcafd82ac10063e0490d8df6e2/openplan/src/lib/data-sources/dataset-provenance.ts#L1-L74) records source, citation, licence, version/vintage, checksum and refresh time, and reports missing provenance. Its [viewport helper](https://github.com/nfredmond/openplan/blob/513b553e7284b4bcafd82ac10063e0490d8df6e2/openplan/src/lib/geo/wgs84-query-viewport.ts#L1-L30) validates WGS84 bounds. | README states Apache-2.0 and active development, while cautioning that configured features do not prove complete planning jobs or validated forecasts. |
| [OboApp](https://github.com/oboapp/oboapp) | Civic-intelligence monorepo with a Next.js PWA/BFF and Hono API. Its [geocoding router](https://github.com/oboapp/oboapp/blob/31626138f8143614d0bd6ab7fa70172d629313f8/ingest/geocoding/router.ts#L35-L123) selects providers by locality and location type, supports an explicit skip, and validates results against locality boundaries. | README licence badge links to a licence file, but the licence text was not verified. |
| [Geo Asset Management Portal](https://github.com/tahmidnafees619/geo-asset-management-portal) | Lightweight asset-dashboard example. Its [proximity helper](https://github.com/tahmidnafees619/geo-asset-management-portal/blob/7f0d5d648e396c34046e0945a7d16c96a17b1530/app/lib/geo.ts#L19-L61) uses a linear scan and polygon centroids and explicitly assumes small datasets. | README presents a demo/portfolio project; licence not independently verified. Not a suitable large-layer query architecture. |
| [Parcels Dashboard Pro](https://github.com/wadaln3ma/Parcels-Dashboard-Pro) | Compact Next.js/PostGIS API examples for [buffers](https://github.com/wadaln3ma/Parcels-Dashboard-Pro/blob/main/app/api/buffer/route.ts#L17-L35) and [spatial intersection](https://github.com/wadaln3ma/Parcels-Dashboard-Pro/blob/main/app/api/within/route.ts#L42-L64). | Useful implementation example, not evidence of a mature GIS platform; licence not independently verified. |
| [Civics Resolve](https://github.com/ARafaykhalid/civics-resolve) | Civic reporting form captures an address and optional coordinates ([form](https://github.com/ARafaykhalid/civics-resolve/blob/74a3150742040d7c9a1cf7bc1d1ecf05dde3e9d6/src/app/submit/page.tsx#L97-L105)). This is a location-capture UX reference, not a spatial data platform. | README claims MIT; no LICENSE file was confirmed in the inspected root listing. |
| [TerriaJS](https://github.com/TerriaJS/terriajs) | TypeScript geospatial explorer with a nested layer catalogue, shareable map views, time dimensions and WMS/WFS/WMTS/Esri connectors ([README](https://github.com/TerriaJS/terriajs/blob/7b76f6aa1745c723c9259b20c2afc08981620036/README.md#L9-L21)). | README lists government deployments; licence text was not inspected. A useful interoperability reference, not a reason to replace Leaflet in this application. |
| [NextGIS Web](https://github.com/nextgis/nextgisweb) | Web GIS server with PostGIS-backed REST querying. Its [feature-query implementation](https://github.com/nextgis/nextgisweb/blob/8c7d9ac2df931dc358b5bdc6019e6523ed4ad4f8/nextgisweb/vector_layer/feature_query.py#L100-L193) transforms query geometry to the layer CRS, applies `ST_Intersects`, and supports pagination and output simplification. | README describes an established GIS server/QGIS workflow; repository declares GPLv3. |
| [GeoNode](https://github.com/GeoNode/geonode) | Django geospatial catalogue and publishing platform. The [Dataset model](https://github.com/GeoNode/geonode/blob/c125d8f2231ce7b1a80b165656084a8d99dc9637/geonode/layers/models.py#L104-L144) carries store/workspace, OWS and temporal metadata and remote-service association. | Mature platform assembled from geospatial projects; repository licence is GPL-3.0-or-later. |
| [Hajk](https://github.com/hajkmap/Hajk) | React/Material UI/OpenLayers client, separate admin UI and REST backend. Its [backend documentation](https://github.com/hajkmap/Hajk/blob/943bf85ca16a9f6762aa3beb5ba2183365cfc0f4/apps/backend/README.md#L16-L31) distinguishes admin-only configuration from client configuration. | README names municipal deployments; licence is MIT. |

### Patterns applicable here

1. Retain the existing Control Centre / Governance Node ownership boundary and
   improve explicit, read-only spatial contracts rather than introducing a
   parallel GIS or copying spatial datasets into Sanity.
2. Show provenance completeness separately from permission, authority and
   technical usability. OpenPlan's missing-field indicator is a useful pattern;
   Unami's [source governance standard](./DATA_SOURCE_GOVERNANCE.md) already
   requires those dimensions to remain distinct.
3. If geocoding is added, select providers by locality and location type, allow
   operators to skip uncertain results, and check results against verified
   boundaries. Do not equate settlement names with premises coordinates.
4. Keep spatial work server-side. PostGIS is the eventual indexed solution for
   intersections and proximity at larger scale; browser-side linear scans and
   centroids, as in the small-data asset dashboard, are not a substitute.
5. Preserve distinct `pending-permission`, `unavailable`, `not-found` and
   `not-applicable` states. Missing data must not be presented as evidence that
   no real-world feature exists.
6. Do not copy GPL/AGPL project code or adopt a full GIS platform without a
   separate architecture and licence review.

## 2. Existing architecture and capabilities

### Control Centre

- Owns `spatial_sources`, `spatial_datasets`, pipeline runs and staged features.
  Governance records remain owned by the Node; this is consistent with
  [GIS integration ownership](./GIS_INTEGRATION.md).
- The dataset model stores normalized feature geometry and properties as JSONB
  (`spatial_staged_features`); the checked-in migrations contain no PostGIS
  geometry/geography column, spatial index, or extension setup. The GIS
  integration document explicitly defers PostGIS until volume warrants it.
- The ArcGIS connector can inspect services and query FeatureServer layers,
  requests GeoJSON and `outSR=4326`, and clips the default query to the Amajuba
  bounding box. The operator pipeline checks permission before ingestion and
  stages fetched records for review. A generic WFS fetcher was not found in the
  inspected implementation.
- `/api/spatial/notice-context` supplies administrative boundaries and
  demographics plus explicit proximity/site-context availability states.
  `/api/spatial/map-layers` supplies selected published feature layers.
- The previous `loadOnDemand` flag did not initiate a request in the client.
  `/api/spatial/features` existed, but did not support spatial filtering.
- The public APIs use the service client and wildcard CORS. They check
  `published`/`active` dataset state and approved feature state. The updated
  public GeoJSON routes additionally fail closed unless both the dataset and
  its source are explicitly classified `redistribute`. Live classifications
  and source terms still require operator verification.

### Governance Node

- Sanity owns community directory listings, their operator-entered geopoints
  and verification status. Listings are not spatial datasets.
- Public development notices hold a geopoint and `locationPrecision`
  (`verified`, `operator-provided`, `approximate`, `locality-only`). The public
  map already consumes Control Centre administrative context and renders maps
  through shared Leaflet utilities.
- The prior `NoticeStatutoryMap` fetched map layers, but skipped every
  `loadOnDemand` layer. The directory fetched nearby context and listed
  attribution, but excluded load-on-demand layers and did not render those
  external features on a map.
- The public directory has no independent external feature store and does not
  automatically turn OSM/Giga features into verified Sanity listings.
- Record-to-area references and coordinate precision remain in the Node; the
  Node does not own the Control Centre catalogue.

## 3. Verified commits and deployed dataset inventory

The requested baseline commits exist in repository history:

- Control Centre `7607ea2` added `/api/spatial/map-layers`.
- Governance Node `bc48c17` added POI rendering to `NoticeStatutoryMap`.

At audit time the checked-out branches were `main` and `trunk`, each containing
those commits and subsequent commits. The deployed Control Centre endpoint
returned HTTP 200 on 2026-11-13. A request around `(-27.75, 29.93)` confirmed
these published feature counts:

| Layer | Published features |
|---|---:|
| Giga Schools | 834 |
| HOT OSM Education | 129 |
| HOT OSM Health | 50 |
| HOT OSM Populated Places | 1,917 |
| HOT OSM Cultural | 158 |
| HOT OSM Financial | 61 |
| HOT OSM Points of Interest | 4,160 |
| HOT OSM Roads | 14,738 |
| HOT OSM Waterways | 19,098 |
| HOT OSM Railways | 1,673 |

The original response included point, polygon and multipolygon features. A
coordinate-range check on the returned GeoJSON found no out-of-range WGS84
coordinates. This is not a full topology, CRS provenance or source-permission
validation. Attribution, dataset vintage and publication timestamps were
present in the response.

## 4. Source files, live services and data governance

- **Repository-verified:** Migration 006 defines nullable `retrieval_date`,
  `fingerprint` and `file_size_bytes` columns on `spatial_datasets`.
  Migration 016 adds nullable `source_url` to that table. The staged feature
  table persists `feature_geojson` and `feature_properties` as JSONB.
- **Repository-verified:** The GeoJSON upload action receives text, parses the
  FeatureCollection and inserts staged feature rows. The ArcGIS connector
  fetches feature responses in memory. Searches of the spatial ingestion code
  and spatial migrations found no original-file archive path, spatial-source
  Storage bucket declaration, Storage upload/download call, or retention/
  cleanup lifecycle. Other, unrelated product buckets do exist in the
  repository. No automated path computes or populates dataset
  `fingerprint` or `file_size_bytes`. Dataset-level `source_url` was not
  previously captured by the UI. The update adds source-URL entry and editing
  to the dataset workflow; successful ArcGIS fetches record the layer URL and
  retrieval timestamp when no explicit dataset URL is already present.
  GeoJSON uploaders can record a source URL when registering or editing the
  dataset. The source record also retains its separate editable `source_url`.
- **Not live-verified:** The assertions that no Storage buckets exist and that
  all 17 published dataset rows have null `source_url`, `retrieval_date` and
  `fingerprint` require querying the deployed Supabase project. No authorized
  live database or Storage query was performed, so those exact counts and
  values remain unconfirmed. Repository evidence does not rule out buckets or
  retention configured outside this checkout.
- **Assessment:** The checked-in ingestion path does not retain the uploaded
  original file; normalized staged GeoJSON is its observed persistent data
  path. The inspected path receives GeoJSON text or fetches ArcGIS features;
  it does not establish that ZIP/Shapefile source files are downloaded and
  discarded. This supports the retention concern, but is not proof that
  original files are absent from the live project or other systems.
- **Provenance follow-up:** Record the source URL and retrieval/vintage
  information for MDB/DPME datasets. The dataset fields and operator UI now
  support recording the URL; these code changes do not populate historical
  records or verify the correct URL for each dataset. ODbL HOT OSM data may be
  re-downloadable, but that alone does not replace recording the exact source,
  retrieval date, attribution and licence obligations. `fingerprint` and
  `file_size_bytes` remain unpopulated by the checked-in ingestion paths.
- The source catalogue supports ArcGIS FeatureServer/MapServer, WFS,
  downloads and static maps. The ArcGIS connector is a live-service capability;
  operators must still establish permission and authority before using any
  service. The current public API does not expose enough source-registry
  metadata to establish which source URLs and permissions produced every
  published Giga/HOT OSM dataset.
- No new live service was connected and no data was ingested during this
  change. The registry/credentials and dataset-specific terms must be verified
  first. In particular, the endpoint evidence does not establish that a live
  service is suitable for every listed layer, or authorize redistributing its
  data.
- The repository has an explicit restriction for Amajuba water and sanitation
  data. This work did not query, ingest, display or redistribute that dataset,
  and did not extend the restriction to unrelated public waterways or
  environmental data.
- Neither repository provides evidence of a PostGIS-backed published-feature
  query today. No migration or new storage bucket was created; a database
  change requires live schema verification first.

**Operational ownership:** The agent handles all database migrations and
deployments, including Vercel environment configuration. This verification
made no migration, deployment or Vercel environment changes.

## 5. Changes in this implementation

### Shared query contract and geometry handling

- Added a reusable WGS84 proximity helper for point, multipoint, line,
  multiline, polygon, multipolygon and geometry-collection features. It checks
  coordinate ranges and measures against actual line segments and polygon
  interiors/edges instead of selecting the first vertex. Its local projected
  calculation is appropriate for the configured short-radius context, but is
  not a legal or statutory measurement.
- `/api/spatial/map-layers` now rejects incomplete/invalid coordinate pairs,
  selects the newest active published catalogue entry for duplicate name
  prefixes, filters by configured geographic radius, and returns bounded
  nearby subsets for large layers. It now also accepts a WGS84 `bbox` viewport
  for bounded on-demand delivery and rejects viewports wider than two degrees.
  `truncated`, `radiusKm` and `returnedCount` make incomplete results explicit.
  The endpoint still scans bounded JSONB pages and uses geometry extents for
  viewport candidate filtering; it does not have an exact indexed spatial
  database query.
- For liquor notices, the 500m radius is used only when the Node identifies
  coordinates as `verified` or `operator-provided`. Other locations use the
  layer's broader context radius. The map only draws the 500m illustrative
  circle for those reliable precision states. Approximate/locality-only points
  are not treated as verified premises.
- `/api/spatial/features` now accepts validated `lat`, `lng` and
  `radiusMeters` filters or a WGS84 `bbox`, limits filtered responses to 500
  features, scans at most 20,000 approved rows, and returns
  completeness/pagination metadata. Unfiltered pagination is limited to
  datasets with at most 3,000 approved features. It still requires future
  indexed spatial querying for scale; the server-side scan is an interim
  mechanism, not a PostGIS substitute.
- Public GeoJSON routes require both source and dataset classifications to be
  `redistribute`; missing source links or classifications fail closed.
  Permission-filtered map layers expose a notice rather than implying no
  nearby features exist. Permission-sensitive spatial responses use
  `Cache-Control: no-store` so a permission change does not leave a stale CDN
  response. Responses retain attribution and dataset vintage. This enforces
  stored classifications but does not validate live source terms or whether
  those classifications are correct.
- The operator publication gate and integrity report now use the same
  redistribution requirement; `reference`, `display`, `internal` and
  `download` classifications do not authorize public publication.

### Development Notices

- The notice map now renders returned nearby features even when their full
  dataset is marked on-demand, handles map/layer initialization races, and
  shows attribution, vintage, result radius, partial-coverage notices and a
  visible service-unavailable message.
- Large/context layers are now requested for the current Leaflet viewport,
  with a 200ms debounce and fetch cancellation as the user pans/zooms. The UI
  asks users to zoom in rather than issuing broad viewport scans.
- The existing administrative/context API and ownership model are retained.
  The radius circle is explicitly illustrative and gated by coordinate
  precision; it is not a compliance determination.

### Public Directory

- Directory listings now render eligible nearby external features on a Leaflet
  map using the existing map foundation, alongside the Sanity-managed
  community listing marker and text list.
- The component includes the on-demand POI layer, preserves attribution and
  dataset vintage, displays the actual configured radius and marks capped
  results incomplete. It retains the explicit disclaimer that external
  features are not verified community listings.
- Coordinates are validated as numbers rather than using truthiness, so valid
  zero-valued coordinates are not silently discarded.
- No matching, merging or creation of Sanity listings is performed based on
  proximity or name similarity.

## 6. Gaps and ranked follow-up

| Priority | Follow-up | Value / effort |
|---|---|---|
| 1 | Verify live source and dataset permission fields/terms and confirm current classifications are accurate; public GeoJSON endpoints now require both records to permit redistribution. | High value / medium effort; live registry access is still required. |
| 2 | Inspect Supabase Storage buckets and pipeline execution history to establish original-file retention and checksum coverage. | High value / low-to-medium effort; blocked on project credentials. |
| 3 | Add a verified PostGIS geometry/geography representation and spatial index only after checking extensions/schema and migration workflow; use indexed `ST_DWithin`/`ST_Intersects`, explicit CRS transforms and bounded output. | High value / medium-to-high effort; currently no spatial index and large-layer requests scan JSONB rows. |
| 4 | Verify each HOT/Giga source URL, licence, update cadence, geographic coverage and source attribution. Test suitable live OGC/ArcGIS/OSM services under their actual terms before selecting live-first connections. | High value / medium effort; source metadata could not be read in this environment. |
| 5 | Add operator coordinate-placement/confirmation workflows and retain precision/provenance when rural addresses cannot be reliably geocoded. | Medium-high value / medium effort. |
| 6 | Add integration tests against the live Amajuba catalogue for incomplete coverage, unavailable services, duplicate published datasets and mobile response sizes. | Medium-high value / medium effort; actual DB credentials and a production-safe test harness are not present locally. |

## 7. Verification and limitations

- Added focused geometry tests covering WGS84 validation, point distance,
  a nearby line segment whose endpoints are outside the radius, polygon
  interior/edge behavior, multipolygons and invalid coordinates. A permission
  test verifies that both dataset and source classifications must permit
  redistribution.
- TypeScript checks passed in both repositories. All seven focused
  spatial helper tests and all 30 permission-enforcement tests passed, and
  Biome checks passed for the changed
  Governance Node files.
- The Control Centre ESLint command could not run because this checkout has no
  `eslint.config.*` file; it is not reported as passing.
- The pre-change deployed endpoint and Amajuba counts were verified live.
  Changes made here are not yet deployed; post-deploy runtime and mobile
  performance remain unverified.
- This implementation avoids new database infrastructure and new dependencies.
  Its nearby-row scan is explicitly capped but remains less efficient than
  indexed server-side spatial queries.

## 8. Human operator journeys and reusable architecture addendum

**Status:** read-only architecture assessment and proposed acceptance criteria.
No application code, data, tests, migration, deployment or environment setting
was changed for this addendum.

### 8.1 Operating roles and access assumptions

The user clarified that **Control Centre access is for Unami operators** and
that other Control Centre user roles are not currently in scope. This report
therefore treats the roles below as work responsibilities, not as a proposed
multi-tenant identity or authorization model. One person may perform more
than one responsibility.

| Work responsibility | Application / access boundary | Work to support |
|---|---|---|
| Unami Control Centre operator | Authenticated Control Centre; the spatial admin actions check an operator session. Specific live role assignments were not inspected. | Create and maintain source/dataset records, ingest, validate, stage, review and publish under documented rights; investigate pipeline and service errors. |
| Council/community operator | Governance Node operator workflow, subject to the deployment’s configured access. | Maintain community/locality information and notices; relate records to an area; distinguish proposed from verified locations. |
| Development-notice operator | Governance Node notice workflow. This is a task responsibility, not a separately verified account role. | Capture an application/notice, locate its premises, inspect map context, save and submit through the actual notice workflow. |
| Infrastructure/project monitor | Governance Node project/campaign records. | Relate a project to a locality, track status and evidence, and inspect its geography. |
| Directory operator | Governance Node directory and listing workflow. | Maintain a facility or resource and its verification state; curate a published spatial-feature reference where appropriate. |
| Spatial/GIS administrator | Unami operator responsibility within Control Centre, not a separate external role. | Assess source rights, CRS, geometry and attributes; stage and review data; manage publication, freshness and service health. |
| Public user | Public routes and map views; no Control Centre administration. | Discover published notices, directory items, projects and permitted geographic context. |

The user’s access clarification is an operating constraint, not confirmation
of live Supabase policies or all deployed routes. The earlier audit found
service-role and authenticated grants in checked-in migrations and did not
inspect live grants. In particular, do not broaden Control Centre access to
councils, community operators or external GIS users without an explicit
product and security decision.

### 8.2 End-to-end journeys

The diagrams show the proposed human flow and the existing system boundaries.
Steps marked **gap** are not claims of current functionality.

#### Journey 1 — Register and verify a development notice

```text
Node operator → find/create notice → capture application, reference and dates
  → associate locality / administrative area
  → select a sourced feature or propose a location + precision/provenance
  → inspect shared map: boundaries, facilities, projects and nearby notices
  → save draft → submit through notice review/publication workflow
  → see status/history → public view exposes only permitted information
```

| Journey element | Audit assessment |
|---|---|
| Actor / start | Development-notice operator; starts at the Governance Node notice list/detail or new-notice flow. Exact end-to-end create route was not established in this spatial audit. |
| Information / actions | Application identity, notice type, reference, description, relevant dates, applicant/site details, locality, administrative relationship, location and its source/precision. Existing schema has a Sanity geopoint, `locationPrecision` and optional `siteFeatureId`; these do not yet constitute a complete, shared location-evidence workflow. |
| Decisions / approvals | Choose existing authoritative geometry versus proposed point; decide whether it is fit to display; submit through actual notice status process. A context map does not prove statutory compliance, legal validity, notice adequacy or consultation. |
| Data / geography | Notice remains Node-owned; linked Control Centre feature remains spatial-catalogue-owned. Do not copy external features into Sanity or turn them into verified premises by proximity. |
| Components | Existing `NoticeStatutoryMap`, shared Leaflet primitives, `useSpatialMapLayers`, `SpatialLayerControls`, notice status actions and map context panel. Reuse candidate: a composable map shell and location/provenance section; the notice-specific radius and legal disclaimer remain notice policy. |
| Validation / permission | Validate coordinate range and geometry; record CRS, source, precision, reviewer and timestamp. Check published dataset/source redistribution before showing external geometry. |
| Result / next step | Saved draft or reviewed notice with a clearly stated location status; operator can correct, request verification, or continue review. |
| Audit / recovery | Preserve location edits and notice status transitions. On denied layer, service outage, invalid geometry or no location, retain draft and provide an actionable retry/verification path—not an empty-map success. |

#### Journey 2 — Record and monitor an infrastructure project

```text
Node operator → identify project/source → associate locality and administrative area
  → enter point/geometry with source and precision
  → record sector, implementer, programme, references, phase, status, dates, evidence
  → inspect shared map and nearby facilities/projects
  → publish/update status → retain earlier values/evidence and show history
```

| Journey element | Audit assessment |
|---|---|
| Actor / start | Infrastructure/project monitor; campaign/project detail or editor in the Node. |
| Information / actions | Campaign schema and spatial-intelligence query indicate project/site locations and geographic associations exist. A complete project progress/evidence history was not verified as one coherent workflow. |
| Decisions / approvals | Distinguish verified project facts, operator reports and external context. A project may have a site geometry, an area association, both or neither; do not silently substitute an area centroid. |
| Data / geography | Project/campaign record and evidence remain Node-owned; basemap/context datasets remain Control Centre-owned. Link by stable feature/area IDs where appropriate. |
| Components | Existing campaign pages/schema, map layers, Node shared Leaflet primitives and selected-feature panels. No common project progress timeline plus map-location workflow was identified in the scoped spatial UI. |
| Validation / permission | Validate geometry and chronology; label source, confidence and evidence; check publication permissions independently from spatial proximity. |
| Result / next step | Project can be filtered/inspected on the locality map; monitor can append a progress update without erasing prior history. |
| Audit / recovery | Preserve old status/evidence; recover from unavailable context service without losing project edits. A missing map layer must not block a draft update. |

#### Journey 3 — Maintain the public directory

```text
Directory operator → search listing / create listing → classify and associate locality
  → record proposed location, precision, source and verification state
  → inspect on shared map → submit/obtain verification
  → publish according to listing policy → update without losing history
```

| Journey element | Audit assessment |
|---|---|
| Actor / start | Directory operator; public directory index or listing editor. |
| Information / actions | Listing identity, type, locality, contact information, location, source and verification. The existing listing schema has legacy geopoint and a curated `spatialFeatureId`; the latter is safer for rendering a catalogue feature but requires verified curation. |
| Decisions / approvals | Decide whether the submitted location is approximate/operator-provided/verified and whether it is publishable. External GIS features must not become listings or verified directory locations automatically. |
| Data / geography | Listing and verification remain Node-owned; spatial feature referenced by ID remains Control Centre-owned. |
| Components | Existing directory map/listing detail, `ListingSpatialContext`, `CommunityMapLeaflet`, shared layer hook/control and listing popup. `LocationPin`/`LocationPinLeaflet` remain coordinate-driven alternatives and should not be used for unverified coordinates. |
| Validation / permission | Validate coordinate and referenced feature; report denied/unavailable public feature explicitly; preserve source and verification provenance. |
| Result / next step | Listing is either awaiting verification, verified, or not yet located; only approved/public listing is exposed. |
| Audit / recovery | Record who verified and when; retain prior location. If feature lookup fails, preserve listing and show “verified map location unavailable,” not a fabricated fallback. |

#### Journey 4 — Import and publish a spatial dataset

```text
Unami operator → register source/dataset → assess rights and allowed operations
  → inspect service/file, CRS, geometry and attributes
  → retrieve/upload → validate → stage with run/provenance
  → review errors/warnings and approve → publish layer and attribution
  → monitor freshness/health → replace or revoke while preserving history
```

| Journey element | Audit assessment |
|---|---|
| Actor / start | Unami Control Centre operator; spatial source catalogue or dataset creation. |
| Information / actions | Existing source and dataset forms, ArcGIS inspection/fetch, GeoJSON upload, pipeline runs and staging review. GeoJSON upload stages parsed content; the observed flow does not retain the original uploaded file. |
| Decisions / approvals | Explicitly assess viewing, querying, download, ingestion, archive, publication and redistribution separately. GratisGIS must not bypass these decisions. Approval must not silently imply legal authority. |
| Data / geography | Source/dataset and staged records are Control Centre-owned. Preserve source CRS and transform only through an explicit, recorded process. |
| Components | Existing source form/inspector, live fetch trigger, dataset form, GeoJSON upload, pipeline trigger/history, staging review, publish action and integrity report. They form fragments, not yet a single guided, recoverable import journey. |
| Validation / permission | Check terms before ingestion; geometry/CRS/range/attributes and size; source and dataset permission gates; reviewer identity; original-vintage and retrieval information. |
| Result / next step | Dataset is rejected, staged for review, or published with attribution, vintage, feature count and partial-coverage state. |
| Audit / recovery | Record pipeline run and permission changes. A failed parse/service/permission check preserves the source and draft metadata and states the next action. Revocation removes public access without deleting audit history. |

#### Journey 5 — Inspect a locality

```text
Operator or public user → choose area by name/identifier
  → open map focused on authoritative area geometry
  → progressively enable boundaries, settlements, notices, projects,
    directory facilities, roads/waterways and other approved layers
  → inspect feature provenance/status → change layers or filters
  → open/close detail without losing map focus or selected context
```

Locality selection should use stable area identifiers and actual boundary
geometry. Layer presets may set initial focus/visibility, but every layer
toggle must remain available, subject to the service’s permission metadata.
Missing, denied, stale and truncated sources must be distinguishable from a
valid zero-feature result.

#### Journey 6 — Investigate and recover a spatial-data/service problem

```text
Unami operator → select affected source/dataset/run → inspect last success,
  permissions, ingestion, validation, publication, freshness and API health
  → identify affected maps/journeys → take scoped recovery action
  → rerun/repair/review → verify map response and record audit outcome
```

Existing source inspector, pipeline runs, monitoring/report pages, integrity
API and public-map error messages provide pieces of this journey. They do not
yet establish a single dependency view from source to affected Node maps.
Database errors in some fetcher paths have historically become empty arrays;
the intended recovery experience must preserve the difference between
“no features” and “could not retrieve features.”

### 8.3 Journey-to-component matrix

| Reusable responsibility | Notice | Project | Directory | Locality | Dataset administration | Service recovery |
|---|---:|---:|---:|---:|---:|---:|
| Shared map lifecycle / viewport | Primary | Primary | Primary | Primary | Preview | Diagnose render path |
| Layer registry and permissions | Context | Context | Context | Primary | Configure/publish | Diagnose denial |
| Location/provenance capture | Primary | Primary | Primary | Area reference | CRS/source metadata | Diagnose bad geometry |
| Area selector / breadcrumbs | Primary | Primary | Primary | Primary | Coverage metadata | Identify scope |
| Feature popup/detail panel | Site/context | Project/context | Listing/context | Any feature | Staged preview | Inspect bad feature |
| Status/review/history | Notice workflow | Project workflow | Listing verification | N/A | Staging/publication | Pipeline/audit |
| Source attribution/freshness | Context | Context | Context | Every visible layer | Required | Required |
| Error/loading/empty/partial states | Every map | Every map | Every map | Every map | Every stage | Every diagnostic |

The table describes cross-cutting responsibilities, not a recommendation to
force every domain into one mega-component. Domain status decisions remain in
their owning workflow; map rendering consumes typed data and permission state.

### 8.4 Reusable component inventory

“Not found” means no shared spatial component was identified in the audited
paths, not that no similar UI exists anywhere in either product. Consolidation
should follow measured duplication and shared contracts, not component-name
checklists.

| Addendum concept | Existing equivalent / duplication | Recommendation |
|---|---|---|
| `SpatialMap` | Control Centre `SpatialMap` and Node `GovernanceMapLeaflet`, `NoticeStatutoryMap`, `CommunityMapLeaflet`, `ListingSpatialContext`, `AreaBoundaryLeaflet` all implement Leaflet lifecycle or drawing separately. | **Refactor/consolidate responsibility, not business pages.** Keep one renderer foundation per existing app/design system; unify layer/viewport contracts first. Do not replace Leaflet or merge domain workflows into one map component. |
| `SpatialMapProvider` | No provider/context state abstraction found; maps own local map, viewport and visibility state. | **Do not create yet.** First share explicit props/contracts. Add provider only if cross-panel selection/focus state is demonstrably duplicated and needs persistence. |
| `SpatialLayerRegistry` | Dynamic dataset discovery exists in map-layer API; separate static `notice-layers` profiles, notice-context name/status logic and client layer metadata also exist. | **Consolidate metadata/availability contract.** Avoid a second hardcoded registry. Store/serve layer identity, rights, role, vintage and visibility configuration from the authoritative catalogue where supportable. |
| `SpatialLayerControl` | Node `SpatialLayerControls`; Control Centre sidebar `LayerRow`, toggles for notices and Node activity. | **Consolidate interaction and accessibility conventions.** Data sources differ, but controls should share enabled/loading/denied/partial states. |
| `SpatialLayerGroup` | Node groups by source institution; Control Centre groups small versus large datasets. | **Refactor grouping semantics** into meaningful categories/source groups without losing on-demand behavior. |
| `SpatialLayerLegend` | Color swatches and inline type labels exist; no dedicated shared legend identified. | **Create only if symbol rules need a consistent, multi-map legend.** Pair layer symbol metadata with the renderer; do not duplicate arbitrary colors. |
| `SpatialFeaturePopup` | Generic GeoJSON popup in `render-map-layers`; custom listing popup in community map; custom notice/selected-feature details. | **Refactor renderer popup contract** to show safe, selected properties plus source/date/feature identity. Keep domain actions supplied by caller. |
| `SpatialFeatureDetailPanel` | Control Centre `AreaInfoPanel`; inline selected-notice/node-reference panels; listing popups; notice context details. | **Consolidate panel shell/selection behavior**, retain domain-specific content modules. |
| `SpatialSearch` / `SpatialFilterBar` | Control Centre has dataset/map-specific controls; Node full map has search/type/municipality state; no shared cross-context search identified. | **Reuse existing filters where they fit; create no global search abstraction** until search fields, identity and API semantics are agreed. |
| `SpatialContextPanel` | Notice `FindingsPanel` embedded in map details; separate Node nearby-context and map UI. | **Refactor notice panel to consume shared context/layer states.** Do not treat static narrative labels as feature layers. |
| `LocationPicker` | Sanity geopoint field and coordinate-driven map widgets exist; no reviewed shared picker that records provenance. | **Create when implementing safe location entry.** It must support not-yet-located, proposed location, precision, source, boundary context and review; no automatic snapping or geocoding heuristics. |
| `LocationPrecisionIndicator` | Notice precision metadata/labels exist in `NoticeStatutoryMap`; no common listing/project indicator found. | **Consolidate terminology and rendering** across notice, listing and project while preserving distinct domain validation. |
| `CoordinateEditor` | Sanity geopoint schemas; no shared provenance-aware coordinate editor identified. | **Create only as part of audited location workflow**, not as a bare lat/lng form. |
| `GeometryPreview` | Notice/area/listing maps render geometries independently; no reusable staged-geometry preview identified. | **Extract a preview responsibility** for dataset staging and operator review if it uses the same validated renderer and permission warnings. |
| `AreaBreadcrumb` / `AreaSelector` | Area pages, ward/map query state and locality associations exist; no single shared selector/breadcrumb identified in scope. | **Consolidate stable area lookup/display** using authoritative identifiers and existing Node area records. Do not infer area from point/name alone. |
| `RecordHeader`, `RecordStatus`, `RecordTimeline`, `RecordReference` | Domain pages and status actions exist; no shared cross-domain workflow contract established in this spatial audit. | **Inventory existing Node design patterns before extraction.** Keep domain-owned status enums; do not invent a universal state machine. |
| `RecordLocationSection` / `AreaAssociation` | Listing and notice schemas hold location/area fields; pages use their own layouts. | **Consolidate data-entry presentation** only after stable location/provenance contract is defined. |
| `SourceAttribution` | Attribution appears in map controls, popups and administrative source/dataset pages. | **Consolidate display/accessibility**, with field-level output policy from the API. |
| `VerificationStatus` | Listing has verification fields; notice has location precision; status terminology differs. | **Shared visual primitive only**, backed by domain-specific typed states and explanations. |
| `EvidenceList` / `EvidenceUpload` | Control Centre has evidence records/actions; project/Node integration was not mapped as one shared workflow here. | **Do not duplicate existing evidence system.** Audit ownership and linkage before designing UI. |
| `ReviewPanel` / `ApprovalAction` | Control Centre `StagingReviewClient`; notice status actions and evidence verification controls. | **Share review affordances/patterns, not authority decisions**; publication and notice review remain separate transitions. |
| `ActivityHistory` / `OperatorNotes` | Spatial pipeline/audit records and Node record histories exist in different domains. | **Unify audit presentation only over explicit event contracts.** Preserve original domain ownership. |
| `SaveDraftAction` / `SubmitForReviewAction` | Workflow actions exist in specific modules; no evidence of a shared safe draft/submit abstraction across all records. | **Reuse application form patterns**, but keep persistence/permission/state transition within the domain action. |
| `SourceRegistry` / `DatasetCatalogue` | Existing Control Centre source and dataset pages/forms. | **Reuse and streamline existing pages** into a guided journey; do not create a second catalogue. |
| `PermissionMatrix` | Permission classifications, fields, helper checks and audit table exist; no complete per-operation matrix UI found. | **Create an explicit permission review view** if source terms can support separate view/query/download/ingest/store/publish decisions; remain fail-closed. |
| `IngestionJob` / `PipelineHistory` | Pipeline triggers, dataset fetch, monitoring and pipeline-run records exist. | **Consolidate as one ingestion run/history experience** with retry/error details and affected dataset. |
| `ValidationSummary` / `StagingReview` | Staging review and integrity report exist; checks are split. | **Consolidate validation output and review queue** while retaining machine validation vs human approval distinction. |
| `PublicationControl` | Publish/reject/archive actions and permission gate exist in spatial actions. | **Retain**, ensure clear confirmation, permission explanation and reversible/revocation history. |
| `DatasetFreshness` / `SpatialServiceHealth` | Monitoring/source inspector/probe and retrieval metadata exist. | **Consolidate diagnostics and freshness status**, expose last success and next action; avoid empty success-shaped fallback. |
| `ProvenancePanel` | Source and dataset details store attribution, URL, permission and other provenance fields; displayed across different admin views. | **Consolidate presentation** and completeness checks; do not fabricate missing historical values. |

### 8.5 Component dependency and ownership maps

```text
DOMAIN WORKFLOW (Node: notice / project / directory / locality)
  ├─ owns record form, domain validation, status transitions and audit
  ├─ owns area association and proposed-location provenance
  └─ supplies map context preset + selected record/feature identity
                    │ typed props / public spatial API
                    ▼
SPATIAL VIEW (each existing app; no business rules)
  ├─ map lifecycle + viewport
  ├─ layer controls / legend / feature selection
  ├─ context and detail-panel shell
  └─ loading / empty / denied / stale / partial / error states
                    │
                    ▼
SPATIAL DATA SERVICE (Control Centre)
  ├─ source/dataset permission check
  ├─ viewport/proximity query + bounded pagination
  ├─ attribution, vintage, stable dataset/feature identity
  └─ logs, completeness and diagnostics
                    │
                    ▼
CONTROL CENTRE ADMIN (Unami operators only, per user constraint)
  Source → dataset → ingest run → validation → staging review → publication
```

**Ownership matrix**

| Information | Authoritative owner | Consumers / boundaries |
|---|---|---|
| Source URL, custodian, licence/permission evidence and source health | Control Centre spatial source catalogue | Operator admin; public response only exposes approved metadata. |
| Dataset identity, vintage, CRS, publication state and attribution | Control Centre spatial dataset catalogue | Both apps’ map APIs; Node does not re-host the dataset as Sanity documents. |
| Staged/published GeoJSON and feature IDs | Control Centre spatial catalogue | Public map APIs only after publication and source+dataset permission checks. |
| Notice identity, application fields, notice status and review | Governance Node / Sanity | Control Centre may consume a limited GeoRef; currently that path can use Sanity geopoints and needs reconciliation. |
| Directory listing identity, contacts, locality and verification | Governance Node / Sanity | Map may use curated feature IDs; nearby external features remain context, not listings. |
| Project/campaign status and evidence | Governance Node / Sanity or existing project record service | Shared map is a view; it must not become a second source of project truth. |
| Administrative area identifiers and Node locality records | Governance Node domain records plus licensed/approved boundary source | Join via stable identifiers; source geometry remains governed by Control Centre or verified source. |
| Map viewport, toggles, selected feature, open panels | Client interaction state | Preserve within the current user journey; do not persist as authoritative domain data unless explicitly designed. |
| Public layer visibility/availability/permission | Control Centre API response contract | Client respects states; it never locally overrides permission. |
| User identity and authorization | Existing Supabase/Sanity auth for each app | Do not assume one shared role system; live grants and production role assignments need verification. |

### 8.6 Map contexts and presets

Presets are entry-point configuration over the same viewer and layer contract,
not separate map implementations. Dataset presence and permissions remain
service-driven; presets must not contain hardcoded lists that claim a layer is
available when the service says otherwise.

| Entry context | Initial focus | Suggested initial layer groups | Context-specific behavior |
|---|---|---|---|
| Development notice | Verified site feature/point; otherwise associated area boundary and an explicit “not yet located” state. | Administrative boundaries, notices, directory/facilities, schools/health, infrastructure, approved roads/waterways. | Existing statutory radius is a separate, explicitly labelled overlay and only applies under its policy. Broader layers are not limited to that circle. |
| Infrastructure project | Verified project geometry or selected locality boundary. | Administrative boundaries, projects, facilities, roads/waterways, relevant approved sector layers. | Show project status/source/evidence from Node; distinguish external layer provenance from project data. |
| Directory listing | Curated approved spatial feature; otherwise locality view plus “location awaiting verification.” | Administrative boundaries, similar public context layers and nearby facilities. | Never promote an external point to a verified directory item. |
| Locality page | Exact ward/municipality/district boundary selected by stable ID. | Administrative, notice/project/directory overlays, roads/waterways, other approved layers. | Preserve selection and map extent while opening/closing feature details. |
| Spatial administration preview | Selected dataset geometry/coverage, scoped to the staged dataset. | Basemap, target administrative boundary, candidate layer, optional reference layers. | Clearly mark staged/unpublished; no public publication is implied by preview. |
| Control Centre global map | Available published coverage or operator-selected area. | All permitted published layers, notices and Node activity with explicit origin/precision. | Avoid using unverified Node GeoRefs as an authoritative initial extent. |

Shared contract fields needed across contexts: `datasetId`, stable layer ID,
stable feature ID, source identity, label/category, geometry type, attribution,
vintage/retrieval, permission/availability state, returned count, truncation,
filter/viewport, and optional domain link supplied by the owning application.
Layer state must distinguish at least `available`, `not applicable`,
`not found`, `permission required`, `source unavailable`, `stale`, and
`partial/truncated`; do not collapse these into “no nearby features.”

### 8.7 Mobile, accessibility and operational usability

**Observed strengths:** map clients are dynamically loaded; layer controls use
native `<details>`, `<summary>`, labels and checkboxes in the Node; viewport
maps support pan/zoom; Node notice context is presented in an in-map
collapsible panel; maps carry source/date/attribution in several views.

**Observed risks and gaps:**

- Interactive rendering was not tested with a browser/device. Production
  route 200 responses are not proof that Leaflet layers render or remain
  usable on phones.
- Notice map has a fixed 400px height; directory/community/context maps use
  different fixed heights. Small-screen layout, map controls, panel overlap
  and keyboard focus need device testing.
- The shared layer checkbox labels include counts, date and attribution, but
  controls do not visibly expose every API state such as source unavailable,
  permission denied per layer, staleness and “no features in viewport.”
- The renderer serializes all feature properties into popups. Large or
  sensitive properties may be hard to inspect on mobile and create a
  field-minimization concern.
- Map keyboard operation, focus return after popups/panels, screen-reader
  announcement of updates, non-color layer distinction, contrast, zoom
  alternatives and reduced-motion behavior were not verified.
- Intermittent connectivity needs explicit retry and preserved selection;
  not every consumer currently shares the same error/empty-state behavior.
- Long locality names, translated/local names and low-bandwidth geometry
  simplification have not been tested.
- Control Centre’s Next config disables geolocation in Permissions-Policy;
  no audited workflow depends on browser geolocation. Do not assume a location
  picker can use device location without a separate product/security decision.

**Required verification before acceptance:** keyboard-only layer toggle and
feature selection; visible focus; semantic controls and labels; screen-reader
announcements for loading/error/partial state; sufficient contrast independent
of color; responsive portrait/landscape controls; touch targets; low-bandwidth
retry; large/long-name content; and map alternatives that preserve essential
information without interaction.

### 8.8 Journey-based acceptance tests

These are proposed end-to-end scenarios, not tests added or run by this
read-only audit. Use seeded, non-production test identities/data and the
Amajuba deployment catalogue only after a production-safe test plan is
approved.

1. **Notice registration and context:** create a draft with an existing
   authoritative site feature; assert the map focuses that geometry, shows
   source/date/precision, loads permitted context layers and does not claim
   statutory compliance.
2. **Notice without coordinates:** save a notice without a site point; assert
   it remains editable, says “Not yet located,” and shows area context without
   a fabricated marker or radius circle.
3. **Project and locality:** create a project with an area association and
   sourced geometry; assert status, sector, dates and evidence remain
   Node-owned and the map opens with relevant layers.
4. **Project update history:** change a project phase/status; assert the prior
   value and evidence are retained in history and the map popup reflects the
   current status.
5. **Directory verification:** create or find a listing, add a proposed
   location and source, submit for verification, approve it and link the
   exact approved feature; assert an external context feature alone never
   creates or verifies a listing.
6. **Cross-context layer toggles:** enter notice, project and directory maps;
   toggle the same permitted layer and assert matching layer identity,
   attribution, permission status and geometry where data is identical.
7. **Feature provenance:** inspect one feature from each applicable map;
   assert stable dataset/feature ID, attribution, date/CRS where known, and
   only approved public properties are shown.
8. **Restricted dataset:** request a restricted or unclassified source;
   assert API returns denied state, no geometry/properties leak, and the map
   says “Permission required,” not “zero features.”
9. **Failed spatial service and recovery:** simulate timeout/5xx then restore
   service; assert map selection and draft survive, failure is visible,
   retry succeeds and the error does not become an empty successful result.
10. **Import and validation:** upload a permitted demonstration
    FeatureCollection with valid and invalid features; assert CRS/geometry/
    attribute validation is reported, provenance is recorded, invalid
    features are reviewable, and original-source retention treatment is
    explicit.
11. **Pending publication:** review staged features as an Unami operator;
    assert preview is marked unpublished, public APIs cannot return the
    pending geometry, approval is audited and publication requires the
    permission gate.
12. **Mobile and desktop:** repeat map entry, layer toggle, popup/detail
    open/close, search/filter and recovery at supported phone and desktop
    viewports; assert selected locality, feature and viewport context persist.
13. **Contract compatibility:** for each supported Node map context, assert
    the viewport request uses the documented Control Centre contract and
    receives bounds-filtered features; reject invalid or over-broad bounds
    with an actionable state.
14. **Partial result:** force the server feature/scan cap; assert
    `truncated`/returned count is visible and the UI does not report complete
    coverage.

Journey tests should verify UI and service together. Existing unit/helper
tests do not satisfy these end-to-end scenarios. No browser journey suite was
run in this audit.

### 8.9 Priority and scope decisions

The addendum’s priority order is consistent with the earlier risk assessment,
with this sequencing:

1. Repair and test the shared viewport and spatial-summary contracts; reconcile
   live boundary permission states and the static notice-layer catalogue.
2. Establish typed location/provenance and layer availability contracts.
3. Reuse the current Leaflet primitives and layer controls; consolidate
   repeated lifecycle/error/selection behavior without a new design system.
4. Add notice, project and directory presets to that viewer while preserving
   domain-specific status, permission and radius rules.
5. Evaluate GratisGIS only as a candidate service behind Control Centre’s
   source, permission, publication and audit gates; it must not become a
   second source of truth or a route around publication checks.
6. Simplify the existing Control Centre ingestion/review path after the
   operator journey and live write grants are verified.
7. Validate complete journeys with approved Amajuba data and responsive
   browser tests.

Do not begin with a new application, a third design system, a wholesale map
engine replacement, or a component-per-name exercise. Keep Control Centre
spatial administration restricted to Unami operators as directed; keep Node
domain records with their existing owners; and make public access depend on
the current permission service response.
