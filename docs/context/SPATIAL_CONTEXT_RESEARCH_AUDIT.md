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
  nearby subsets for large layers. `truncated`, `radiusKm` and `returnedCount`
  make incomplete results explicit. The endpoint still reads JSONB rows on the
  server; it does not have a spatial database index.
- For liquor notices, the 500m radius is used only when the Node identifies
  coordinates as `verified` or `operator-provided`. Other locations use the
  layer's broader context radius. The map only draws the 500m illustrative
  circle for those reliable precision states. Approximate/locality-only points
  are not treated as verified premises.
- `/api/spatial/features` now accepts validated `lat`, `lng` and
  `radiusMeters` filters, limits nearby responses to 500 features, scans at
  most 20,000 approved rows, and returns completeness/pagination metadata.
  Unfiltered pagination is limited to datasets with at most 3,000 approved
  features. It still requires future indexed spatial querying for scale; the
  server-side scan is an interim mechanism, not a PostGIS substitute.
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
