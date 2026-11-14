import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  isGeometryWithinBounds,
  isGeometryWithinRadius,
  isValidGeoJSONGeometry,
  isValidWgs84Bounds,
  isValidWgs84Point,
  type Wgs84Bounds,
  type Wgs84Point,
} from '@/lib/gis/spatial-proximity';
import { filterPubliclyRedistributableDatasets } from '@/lib/gis/spatial-public-access';

export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

const PAGE_SIZE = 1000;
const MAX_RETURNED_FEATURES = 500;
const MAX_SCANNED_FEATURES = 20_000;
const MAX_VIEWPORT_SPAN_DEGREES = 2;
const MAX_RADIUS_METRES = 20_000;
const DATASET_QUERY_CONCURRENCY = 4;

type SpatialFeature = {
  type: 'Feature';
  id: string;
  geometry: { type: string; coordinates?: unknown; geometries?: unknown };
  properties: Record<string, unknown>;
};

type SpatialSourceSummary = {
  name: string;
  institution: string;
  attribution: string | null;
};

type SpatialDataset = {
  id: string;
  name: string;
  attribution: string | null;
  published_at: string | null;
  dataset_date: string | null;
  feature_count: number | null;
  source_id: string | null;
  permission_classification: string | null;
  spatial_sources: SpatialSourceSummary | SpatialSourceSummary[] | null;
};

type FeatureRow = {
  id: string;
  feature_geojson: unknown;
  feature_properties: unknown;
};

type SpatialFilter = {
  bounds: Wgs84Bounds | null;
  location: Wgs84Point | null;
  radiusMeters: number | null;
};

type SpatialMapLayerResponse = {
  id: string;
  datasetId: string;
  status: 'available' | 'empty';
  label: string;
  colour: string;
  weight: number;
  fillOpacity: number;
  featureCount: number;
  returnedCount: number;
  loadOnDemand: boolean;
  truncated: boolean;
  radiusKm: number | null;
  features: SpatialFeature[];
  attribution: string | null;
  sourceId: string | null;
  sourceName: string | null;
  sourceInstitution: string | null;
  publishedAt: string | null;
  datasetDate: string | null;
  radiusFiltered: boolean;
};

function getLayerColour(datasetId: string): string {
  let hash = 0;
  for (const character of datasetId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return `hsl(${hash % 360} 68% 42%)`;
}

function getSource(
  dataset: SpatialDataset,
): SpatialSourceSummary | null {
  const source = dataset.spatial_sources;
  if (Array.isArray(source)) return source[0] ?? null;
  return source;
}

function parseSpatialFilter(url: URL):
  | { filter: SpatialFilter; error?: never }
  | { filter?: never; error: string } {
  const boundsValue = url.searchParams.get('bbox');
  const hasLat = url.searchParams.has('lat');
  const hasLng = url.searchParams.has('lng');
  const hasRadius = url.searchParams.has('radiusMeters');

  if (boundsValue !== null && (hasLat || hasLng || hasRadius)) {
    return { error: 'Provide either bbox or lat, lng and radiusMeters.' };
  }
  if (hasLat !== hasLng || hasLat !== hasRadius) {
    return { error: 'Point filters require lat, lng and radiusMeters together.' };
  }
  if (boundsValue === null && !hasLat) {
    return { filter: { bounds: null, location: null, radiusMeters: null } };
  }

  if (boundsValue !== null) {
    const rawValues = boundsValue.split(',');
    const values = rawValues.map((value) =>
      value.trim() === '' ? Number.NaN : Number(value),
    );
    if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
      return { error: 'bbox must be west,south,east,north in WGS84.' };
    }
    const bounds = {
      west: values[0],
      south: values[1],
      east: values[2],
      north: values[3],
    };
    if (
      !isValidWgs84Bounds(bounds) ||
      bounds.east - bounds.west > MAX_VIEWPORT_SPAN_DEGREES ||
      bounds.north - bounds.south > MAX_VIEWPORT_SPAN_DEGREES
    ) {
      return {
        error: `bbox must be a valid WGS84 extent no wider than ${MAX_VIEWPORT_SPAN_DEGREES} degrees.`,
      };
    }
    return { filter: { bounds, location: null, radiusMeters: null } };
  }

  const location = {
    lat: Number(url.searchParams.get('lat')),
    lng: Number(url.searchParams.get('lng')),
  };
  const radiusMeters = Number(url.searchParams.get('radiusMeters'));
  if (
    !isValidWgs84Point(location) ||
    !Number.isFinite(radiusMeters) ||
    radiusMeters <= 0 ||
    radiusMeters > MAX_RADIUS_METRES
  ) {
    return {
      error: `Point filters require valid WGS84 coordinates and radiusMeters between 1 and ${MAX_RADIUS_METRES}.`,
    };
  }
  return { filter: { bounds: null, location, radiusMeters } };
}

function matchesFilter(
  geometry: SpatialFeature['geometry'],
  filter: SpatialFilter,
): boolean {
  if (filter.bounds) return isGeometryWithinBounds(geometry, filter.bounds);
  if (filter.location && filter.radiusMeters !== null) {
    return isGeometryWithinRadius(
      geometry,
      filter.location,
      filter.radiusMeters,
    );
  }
  return false;
}

async function fetchFeaturesForDataset(
  supabase: ReturnType<typeof createServiceClient>,
  datasetId: string,
  filter: SpatialFilter,
): Promise<{
  features: SpatialFeature[];
  total: number;
  truncated: boolean;
}> {
  const { count, error: countError } = await supabase
    .from('spatial_staged_features')
    .select('id', { count: 'exact', head: true })
    .eq('dataset_id', datasetId)
    .eq('operator_status', 'approved');
  if (countError) {
    throw new Error(`Could not count published spatial features: ${countError.message}`);
  }

  const total = count ?? 0;
  if (!filter.bounds && !filter.location) {
    return { features: [], total, truncated: false };
  }

  const features: SpatialFeature[] = [];
  let scanned = 0;
  let matched = 0;
  while (scanned < Math.min(total, MAX_SCANNED_FEATURES)) {
    const end = Math.min(scanned + PAGE_SIZE, MAX_SCANNED_FEATURES) - 1;
    const { data: rows, error } = await supabase
      .from('spatial_staged_features')
      .select('id, feature_geojson, feature_properties')
      .eq('dataset_id', datasetId)
      .eq('operator_status', 'approved')
      .order('id', { ascending: true })
      .range(scanned, end);
    if (error) {
      throw new Error(`Could not read published spatial features: ${error.message}`);
    }
    if (!rows?.length) break;
    scanned += rows.length;

    for (const row of rows as FeatureRow[]) {
      const geometry = row.feature_geojson as SpatialFeature['geometry'];
      if (!isValidGeoJSONGeometry(geometry)) {
        throw new Error(`Published feature ${row.id} has invalid geometry.`);
      }
      if (!matchesFilter(geometry, filter)) continue;
      matched++;
      if (features.length < MAX_RETURNED_FEATURES) {
        features.push({
          type: 'Feature',
          id: row.id,
          geometry,
          properties: (row.feature_properties ?? {}) as Record<string, unknown>,
        });
      }
    }
    if (rows.length < PAGE_SIZE) break;
  }

  return {
    features,
    total,
    truncated:
      matched > features.length || scanned < total,
  };
}

async function mapInBatches<T, R>(
  values: T[],
  concurrency: number,
  mapValue: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let offset = 0; offset < values.length; offset += concurrency) {
    const batch = values.slice(offset, offset + concurrency);
    results.push(...(await Promise.all(batch.map(mapValue))));
  }
  return results;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = parseSpatialFilter(url);
  if (!parsed.filter) {
    return NextResponse.json(
      { error: parsed.error ?? 'Invalid spatial filter.' },
      { status: 400, headers: CORS },
    );
  }
  const filter = parsed.filter;
  const datasetIdsValue = url.searchParams.get('datasetIds');
  const requestedDatasetIds =
    datasetIdsValue === null
      ? null
      : datasetIdsValue === ''
        ? []
        : datasetIdsValue.split(',');
  if (
    requestedDatasetIds &&
    (requestedDatasetIds.length > 100 ||
    requestedDatasetIds.some(
      (id) =>
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id,
        ),
    ))
  ) {
    return NextResponse.json(
      { error: 'datasetIds must contain at most 100 dataset UUIDs.' },
      { status: 400, headers: CORS },
    );
  }
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('spatial_datasets')
    .select(
      'id, name, attribution, published_at, dataset_date, feature_count, source_id, permission_classification, spatial_sources(name, institution, attribution)',
    )
    .eq('status', 'published')
    .eq('active', true)
    .order('published_at', { ascending: false });
  if (error) {
    console.error('Could not read published spatial datasets:', error.message);
    return NextResponse.json(
      { error: 'Spatial catalogue is temporarily unavailable' },
      { status: 500, headers: CORS },
    );
  }

  const datasets = (data ?? []) as SpatialDataset[];
  if (!datasets.length) {
    return NextResponse.json(
      {
        layers: [],
        filterLat: filter.location?.lat ?? null,
        filterLng: filter.location?.lng ?? null,
        filterBounds: filter.bounds,
        permissionFiltered: false,
        permissionRequiredDatasetIds: [],
        generatedAt: new Date().toISOString(),
      },
      { headers: CORS },
    );
  }

  let publicDatasets: SpatialDataset[];
  try {
    const filtered = await filterPubliclyRedistributableDatasets(
      supabase,
      datasets,
    );
    publicDatasets = filtered.datasets as SpatialDataset[];
  } catch (error) {
    console.error(
      'Could not verify spatial dataset permissions:',
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { error: 'Spatial catalogue permissions are temporarily unavailable' },
      { status: 500, headers: CORS },
    );
  }
  const selectedDatasets =
    requestedDatasetIds === null
      ? publicDatasets
      : publicDatasets.filter((dataset) =>
          requestedDatasetIds.includes(dataset.id),
        );

  let layers: SpatialMapLayerResponse[];
  try {
    layers = await mapInBatches(
      selectedDatasets,
      DATASET_QUERY_CONCURRENCY,
      async (dataset) => {
        const result = await fetchFeaturesForDataset(supabase, dataset.id, filter);
        const source = getSource(dataset);
        return {
          id: dataset.id,
          datasetId: dataset.id,
          status: result.total === 0 ? 'empty' : 'available',
          label: dataset.name,
          colour: getLayerColour(dataset.id),
          weight: 2,
          fillOpacity: 0.2,
          featureCount: result.total,
          returnedCount: result.features.length,
          loadOnDemand: !filter.bounds && !filter.location,
          truncated: result.truncated,
          radiusKm:
            filter.radiusMeters === null ? null : filter.radiusMeters / 1000,
          features: result.features,
          attribution: dataset.attribution ?? source?.attribution ?? null,
          sourceId: dataset.source_id,
          sourceName: source?.name ?? null,
          sourceInstitution: source?.institution ?? null,
          publishedAt: dataset.published_at,
          datasetDate: dataset.dataset_date,
          radiusFiltered: filter.radiusMeters !== null,
        };
      },
    );
  } catch (error) {
    console.error(
      'Could not load published spatial features:',
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { error: 'Spatial features are temporarily unavailable' },
      { status: 500, headers: CORS },
    );
  }

  return NextResponse.json(
    {
      layers,
      filterLat: filter.location?.lat ?? null,
      filterLng: filter.location?.lng ?? null,
      filterBounds: filter.bounds,
      permissionFiltered: datasets.some(
        (dataset) =>
          !publicDatasets.some((allowed) => allowed.id === dataset.id),
      ),
      permissionRequiredDatasetIds:
        requestedDatasetIds === null
          ? []
          : datasets
              .filter(
                (dataset) =>
                  requestedDatasetIds.includes(dataset.id) &&
                  !publicDatasets.some((allowed) => allowed.id === dataset.id),
              )
              .map((dataset) => dataset.id),
      generatedAt: new Date().toISOString(),
    },
    { headers: CORS },
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
