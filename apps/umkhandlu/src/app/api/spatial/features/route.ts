import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 1000; // Supabase max_rows per request
const REQUEST_CAP = 20000; // Hard cap per API call

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const datasetId = url.searchParams.get('id');
  const requestedLimit = Math.min(
    parseInt(url.searchParams.get('limit') ?? String(REQUEST_CAP), 10),
    REQUEST_CAP,
  );
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  if (!datasetId) {
    return NextResponse.json({ error: 'id parameter required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: dataset } = await supabase
    .from('spatial_datasets')
    .select('id, name, feature_count, attribution, status, active')
    .eq('id', datasetId)
    .single();

  if (!dataset || dataset.status !== 'published' || !dataset.active) {
    return NextResponse.json({ error: 'Dataset not found or not published' }, { status: 404 });
  }

  // Paginate through Supabase's 1,000-row limit to collect all requested features
  const allRows: Array<{ feature_geojson: unknown; feature_properties: unknown }> = [];
  let page = 0;
  let totalCount: number | null = null;

  while (allRows.length < requestedLimit) {
    const pageOffset = offset + page * PAGE_SIZE;
    const pageEnd = pageOffset + PAGE_SIZE - 1;

    const { data: rows, count } = await supabase
      .from('spatial_staged_features')
      .select('feature_geojson, feature_properties', { count: page === 0 ? 'exact' : 'none' })
      .eq('dataset_id', datasetId)
      .eq('operator_status', 'approved')
      .range(pageOffset, pageEnd);

    if (page === 0 && count !== null) totalCount = count;

    if (!rows?.length) break;
    allRows.push(...rows);
    if (rows.length < PAGE_SIZE) break; // Last page
    page++;
  }

  const features = allRows.slice(0, requestedLimit).map((r) => ({
    type: 'Feature' as const,
    geometry: r.feature_geojson as { type: string; coordinates: unknown },
    properties: (r.feature_properties ?? {}) as Record<string, unknown>,
  }));

  return NextResponse.json(
    {
      type: 'FeatureCollection',
      features,
      meta: {
        datasetId,
        datasetName: dataset.name,
        attribution: dataset.attribution,
        total: totalCount ?? dataset.feature_count,
        offset,
        limit: requestedLimit,
        returned: features.length,
      },
    },
    { headers: CORS },
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
