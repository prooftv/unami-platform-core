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

  // Resolve the published MDB wards dataset
  const { data: dataset } = await supabase
    .from('spatial_datasets')
    .select('id, name, dataset_date')
    .eq('status', 'published')
    .eq('active', true)
    .ilike('name', '%ward%')
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

  const { data: rows } = await supabase
    .from('spatial_staged_features')
    .select('feature_geojson, feature_properties')
    .eq('dataset_id', dataset.id)
    .eq('operator_status', 'approved');

  const features = (rows ?? []).map((r) => ({
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
        count: features.length,
        attribution: 'Municipal Demarcation Board (MDB) — public domain, CC-BY',
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
