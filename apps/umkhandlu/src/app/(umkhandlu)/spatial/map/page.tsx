import nextDynamic from 'next/dynamic';
import { PageHeader } from '@unami/ui';
import { createServiceClient } from '@/lib/supabase/server';
import type { PublishedDataset, NoticeMarker } from './_components/SpatialMap';

export const dynamic = 'force-dynamic';

// Leaflet requires window — load client-side only
const SpatialMap = nextDynamic(
  () => import('./_components/SpatialMap').then((m) => m.SpatialMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

export default async function SpatialMapPage() {
  const supabase = createServiceClient();

  const { data: datasets } = await supabase
    .from('spatial_datasets')
    .select('id, name, feature_count, dataset_date, crs, spatial_sources(name, institution)')
    .eq('status', 'published')
    .eq('active', true)
    .order('published_at', { ascending: false });

  const rows = datasets ?? [];
  const datasetIds = rows.map((d) => d.id);

  const { data: features } = datasetIds.length
    ? await supabase
        .from('spatial_staged_features')
        .select('dataset_id, feature_geojson, feature_properties')
        .in('dataset_id', datasetIds)
        .eq('operator_status', 'approved')
    : { data: [] };

  const featuresByDataset = new Map<string, Array<{ dataset_id: string; feature_geojson: unknown; feature_properties: unknown }>>();
  for (const f of features ?? []) {
    if (!featuresByDataset.has(f.dataset_id)) featuresByDataset.set(f.dataset_id, []);
    featuresByDataset.get(f.dataset_id)!.push(f);
  }

  const publishedDatasets: PublishedDataset[] = rows.map((d) => {
    const src = Array.isArray(d.spatial_sources)
      ? (d.spatial_sources[0] as { name: string; institution: string } | undefined)
      : (d.spatial_sources as { name: string; institution: string } | null);

    const datasetFeatures = featuresByDataset.get(d.id) ?? [];
    const geojson = datasetFeatures.length
      ? {
          type: 'FeatureCollection' as const,
          features: datasetFeatures.map((f) => ({
            type: 'Feature' as const,
            geometry: f.feature_geojson as { type: string; coordinates: unknown },
            properties: (f.feature_properties ?? {}) as Record<string, unknown>,
          })),
        }
      : null;

    return {
      id: d.id,
      name: d.name,
      source_institution: src?.institution ?? 'Unknown',
      feature_count: d.feature_count,
      dataset_date: d.dataset_date,
      geojson,
    };
  });

  // Notices with coordinates — shown as map overlay markers
  const { data: noticeRows } = await supabase
    .from('notices')
    .select('id, type, title, status, is_statutory, comment_deadline, ward_ref, latitude, longitude')
    .in('status', ['published', 'open'])
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  const noticeMarkers: NoticeMarker[] = (noticeRows ?? []).map((n) => ({
    id: n.id,
    type: n.type as string,
    title: n.title,
    status: n.status,
    is_statutory: n.is_statutory,
    comment_deadline: n.comment_deadline,
    ward_ref: n.ward_ref,
    latitude: n.latitude as number,
    longitude: n.longitude as number,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Geographic View"
        description="Published spatial datasets and active notices for Amajuba District."
      />
      <SpatialMap datasets={publishedDatasets} notices={noticeMarkers} />
    </div>
  );
}
