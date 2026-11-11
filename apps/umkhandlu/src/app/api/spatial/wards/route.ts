import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Public endpoint — no auth required.
 * Returns published MDB ward features as a GeoJSON FeatureCollection.
 * Consumed by the Governance Node /map page to render authoritative ward boundaries.
 * Public domain data (MDB, CC-BY attribution required).
 */
export async function GET() {
  const supabase = createServiceClient();

  // Resolve the published MDB wards dataset by exact name prefix
  const { data: dataset } = await supabase
    .from('spatial_datasets')
    .select('id, name, dataset_date, attribution')
    .eq('status', 'published')
    .eq('active', true)
    .ilike('name', 'MDB Wards 2026%')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!dataset) {
    return NextResponse.json(
      { type: 'FeatureCollection', features: [], meta: { source: 'unami-platform-core', count: 0 } },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
  }

  // Paginate through Supabase's 1,000-row limit — ward count is currently 55
  // but pagination guards against silent truncation if the dataset grows.
  const PAGE_SIZE = 1000;
  const allRows: Array<{ feature_geojson: unknown; feature_properties: unknown }> = [];
  let page = 0;
  while (true) {
    const { data: rows } = await supabase
      .from('spatial_staged_features')
      .select('feature_geojson, feature_properties')
      .eq('dataset_id', dataset.id)
      .eq('operator_status', 'approved')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (!rows?.length) break;
    allRows.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    page++;
  }

  const features = allRows.map((r) => ({
    type: 'Feature' as const,
    geometry: r.feature_geojson as { type: string; coordinates: unknown },
    properties: (r.feature_properties ?? {}) as Record<string, unknown>,
  }));

  return NextResponse.json(
    {
      type: 'FeatureCollection',
      features,
      meta: {
        source: 'unami-platform-core',
        dataset: dataset.name,
        datasetDate: dataset.dataset_date,
        attribution: dataset.attribution ?? 'Municipal Demarcation Board (MDB) — public domain, CC-BY',
        count: features.length,
      },
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
