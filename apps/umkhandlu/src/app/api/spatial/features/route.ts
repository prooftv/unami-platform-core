import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  isGeometryWithinRadius,
  isValidWgs84Point,
  type Wgs84Point,
} from '@/lib/gis/spatial-proximity';
import { filterPubliclyRedistributableDatasets } from '@/lib/gis/spatial-public-access';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000; // Supabase max_rows per request
const REQUEST_CAP = 20000; // Hard cap per API call
const NEARBY_REQUEST_CAP = 500;
const MAX_UNFILTERED_FEATURES = 3000;
const MAX_RADIUS_METRES = 20_000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const datasetId = url.searchParams.get('id');
  if (!datasetId) {
    return NextResponse.json({ error: 'id parameter required' }, { status: 400, headers: CORS });
  }

  const hasLat = url.searchParams.has('lat');
  const hasLng = url.searchParams.has('lng');
  const hasRadius = url.searchParams.has('radiusMeters');
  const hasSpatialFilter = hasLat || hasLng || hasRadius;
  if (hasSpatialFilter && !(hasLat && hasLng && hasRadius)) {
    return NextResponse.json(
      { error: 'lat, lng and radiusMeters must be provided together' },
      { status: 400, headers: CORS },
    );
  }

  const latValue = url.searchParams.get('lat');
  const lngValue = url.searchParams.get('lng');
  const location: Wgs84Point | null = hasSpatialFilter
    ? {
        lat: latValue?.trim() ? Number(latValue) : Number.NaN,
        lng: lngValue?.trim() ? Number(lngValue) : Number.NaN,
      }
    : null;
  const radiusMeters = hasSpatialFilter
    ? Number(url.searchParams.get('radiusMeters'))
    : null;
  if (
    (location && !isValidWgs84Point(location)) ||
    (radiusMeters !== null &&
      (!Number.isFinite(radiusMeters) ||
        radiusMeters <= 0 ||
        radiusMeters > MAX_RADIUS_METRES))
  ) {
    return NextResponse.json(
      { error: `Invalid spatial filter; radiusMeters must be between 1 and ${MAX_RADIUS_METRES}` },
      { status: 400, headers: CORS },
    );
  }

  const requestedLimit = Number(url.searchParams.get('limit') ?? (hasSpatialFilter ? 100 : REQUEST_CAP));
  const offset = Number(url.searchParams.get('offset') ?? '0');
  const limitCap = hasSpatialFilter ? NEARBY_REQUEST_CAP : MAX_UNFILTERED_FEATURES;
  if (
    !Number.isInteger(requestedLimit) ||
    requestedLimit < 1 ||
    requestedLimit > limitCap ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > REQUEST_CAP
  ) {
    return NextResponse.json(
      { error: `limit must be 1-${limitCap} and offset must be 0-${REQUEST_CAP}` },
      { status: 400, headers: CORS },
    );
  }

  const supabase = createServiceClient();

  const { data: dataset, error: datasetError } = await supabase
    .from('spatial_datasets')
    .select('id, name, feature_count, attribution, dataset_date, published_at, status, active, source_id, permission_classification')
    .eq('id', datasetId)
    .single();

  if (datasetError && datasetError.code !== 'PGRST116') {
    console.error('Could not read spatial dataset metadata:', datasetError.message);
    return NextResponse.json(
      { error: 'Spatial dataset is temporarily unavailable' },
      { status: 500, headers: CORS },
    );
  }
  if (!dataset || dataset.status !== 'published' || !dataset.active) {
    return NextResponse.json(
      { error: 'Dataset not found or not published' },
      { status: 404, headers: CORS },
    );
  }
  try {
    const { datasets } = await filterPubliclyRedistributableDatasets(
      supabase,
      [dataset],
    );
    if (!datasets.length) {
      return NextResponse.json(
        { error: 'Dataset is not cleared for public redistribution' },
        { status: 403, headers: CORS },
      );
    }
  } catch (error) {
    console.error(
      'Could not verify spatial dataset permissions:',
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { error: 'Spatial dataset permissions are temporarily unavailable' },
      { status: 500, headers: CORS },
    );
  }

  let totalCount: number | null = null;
  let complete = true;
  let hasMore = false;
  let features: Array<{
    type: 'Feature';
    geometry: { type: string; coordinates?: unknown; geometries?: unknown };
    properties: Record<string, unknown>;
  }> = [];

  if (!hasSpatialFilter) {
    const { count, error: countError } = await supabase
      .from('spatial_staged_features')
      .select('id', { count: 'exact', head: true })
      .eq('dataset_id', datasetId)
      .eq('operator_status', 'approved');
    if (countError) {
      console.error('Could not count published spatial features:', countError.message);
      return NextResponse.json(
        { error: 'Spatial features are temporarily unavailable' },
        { status: 500, headers: CORS },
      );
    }
    totalCount = count;
    if ((count ?? 0) > MAX_UNFILTERED_FEATURES) {
      return NextResponse.json(
        {
          error: 'A geographic filter is required for this large dataset',
          maxUnfilteredFeatures: MAX_UNFILTERED_FEATURES,
        },
        { status: 400, headers: CORS },
      );
    }

    let fetched = 0;
    while (fetched < requestedLimit) {
      const pageSize = Math.min(PAGE_SIZE, requestedLimit - fetched);
      const { data: rows, error } = await supabase
        .from('spatial_staged_features')
        .select('feature_geojson, feature_properties')
        .eq('dataset_id', datasetId)
        .eq('operator_status', 'approved')
        .order('id', { ascending: true })
        .range(offset + fetched, offset + fetched + pageSize - 1);
      if (error) {
        console.error('Could not read published spatial features:', error.message);
        return NextResponse.json(
          { error: 'Spatial features are temporarily unavailable' },
          { status: 500, headers: CORS },
        );
      }
      const pageFeatures = (rows ?? []).map((row) => ({
        type: 'Feature' as const,
        geometry: row.feature_geojson as { type: string; coordinates?: unknown; geometries?: unknown },
        properties: (row.feature_properties ?? {}) as Record<string, unknown>,
      }));
      features.push(...pageFeatures);
      fetched += pageFeatures.length;
      if (pageFeatures.length < pageSize) break;
    }
    hasMore = totalCount !== null && offset + features.length < totalCount;
    complete = !hasMore;
  } else if (location && radiusMeters !== null) {
    const { count, error: countError } = await supabase
      .from('spatial_staged_features')
      .select('id', { count: 'exact', head: true })
      .eq('dataset_id', datasetId)
      .eq('operator_status', 'approved');
    if (countError) {
      console.error('Could not count published spatial features:', countError.message);
      return NextResponse.json(
        { error: 'Spatial features are temporarily unavailable' },
        { status: 500, headers: CORS },
      );
    }
    totalCount = count;
    const scanLimit = Math.min(totalCount ?? REQUEST_CAP, REQUEST_CAP);
    let scanned = 0;
    let matched = 0;

    while (scanned < scanLimit) {
      const { data: rows, error } = await supabase
        .from('spatial_staged_features')
        .select('feature_geojson, feature_properties')
        .eq('dataset_id', datasetId)
        .eq('operator_status', 'approved')
        .order('id', { ascending: true })
        .range(scanned, Math.min(scanned + PAGE_SIZE - 1, scanLimit - 1));
      if (error) {
        console.error('Could not query nearby spatial features:', error.message);
        return NextResponse.json(
          { error: 'Nearby spatial features are temporarily unavailable' },
          { status: 500, headers: CORS },
        );
      }
      if (!rows?.length) break;
      scanned += rows.length;

      for (const row of rows) {
        const geometry = row.feature_geojson as { type: string; coordinates?: unknown; geometries?: unknown };
        if (!isGeometryWithinRadius(geometry, location, radiusMeters)) continue;
        if (matched >= offset && features.length < requestedLimit) {
          features.push({
            type: 'Feature',
            geometry,
            properties: (row.feature_properties ?? {}) as Record<string, unknown>,
          });
        } else if (features.length === requestedLimit) {
          hasMore = true;
          break;
        }
        matched++;
      }

      if (hasMore || rows.length < PAGE_SIZE) break;
    }
    complete = !hasMore && scanned >= (totalCount ?? scanned);
    if (!complete) hasMore = true;
  }

  return NextResponse.json(
    {
      type: 'FeatureCollection',
      features,
      meta: {
        datasetId,
        datasetName: dataset.name,
        attribution: dataset.attribution,
        datasetDate: dataset.dataset_date,
        publishedAt: dataset.published_at,
        total: totalCount ?? dataset.feature_count,
        offset,
        limit: requestedLimit,
        returned: features.length,
        radiusMeters,
        filtered: hasSpatialFilter,
        complete,
        hasMore,
        nextOffset: hasMore ? offset + features.length : null,
      },
    },
    { headers: CORS },
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
