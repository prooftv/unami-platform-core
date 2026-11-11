import { PageHeader } from '@unami/ui';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchNodeGeoRefs } from '@/lib/nodes/fetcher';
import { SpatialMapClient } from './_components/SpatialMapClient';
import type { PublishedDataset, NoticeMarker, NodeGeoRef } from './_components/SpatialMap';

export const dynamic = 'force-dynamic';

// Datasets with more features than this are loaded on-demand via the API route
// rather than inlined into the page payload.
const INLINE_LIMIT = 1000;

export default async function SpatialMapPage() {
  const supabase = createServiceClient();

  const { data: datasets } = await supabase
    .from('spatial_datasets')
    .select('id, name, feature_count, dataset_date, crs, attribution, spatial_sources(name, institution)')
    .eq('status', 'published')
    .eq('active', true)
    .order('published_at', { ascending: false });

  const rows = datasets ?? [];

  // Load features per-dataset — avoids the 1,000-row PostgREST default limit
  // that silently truncates a single cross-dataset query.
  const publishedDatasets: PublishedDataset[] = await Promise.all(
    rows.map(async (d) => {
      const src = Array.isArray(d.spatial_sources)
        ? (d.spatial_sources[0] as { name: string; institution: string } | undefined)
        : (d.spatial_sources as { name: string; institution: string } | null);

      const featureCount = d.feature_count ?? 0;

      // Large datasets: defer to client-side on-demand loading via /api/spatial/features
      if (featureCount > INLINE_LIMIT) {
        return {
          id: d.id,
          name: d.name,
          source_institution: src?.institution ?? 'Unknown',
          feature_count: featureCount,
          dataset_date: d.dataset_date,
          geojson: null,
          attribution: d.attribution ?? null,
          loadOnDemand: true,
        };
      }

      // Small/medium datasets: inline features into page payload
      const { data: featureRows } = await supabase
        .from('spatial_staged_features')
        .select('feature_geojson, feature_properties')
        .eq('dataset_id', d.id)
        .eq('operator_status', 'approved')
        .limit(INLINE_LIMIT);

      const geojson = featureRows?.length
        ? {
            type: 'FeatureCollection' as const,
            features: featureRows.map((f) => ({
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
        feature_count: featureCount,
        dataset_date: d.dataset_date,
        geojson,
        attribution: d.attribution ?? null,
        loadOnDemand: false,
      };
    }),
  );

  // Notices with coordinates
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

  // Node geographic references
  const rawGeoRefs = await fetchNodeGeoRefs();
  const nodeGeoRefs: NodeGeoRef[] = rawGeoRefs
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => ({
      nodeId:       r.nodeId ?? '',
      recordId:     r.recordId ?? '',
      recordType:   (r.recordType ?? 'record') as NodeGeoRef['recordType'],
      label:        r.label ?? '',
      latitude:     r.latitude!,
      longitude:    r.longitude!,
      district:     r.district,
      municipality: r.municipality,
      ward:         r.ward,
      timestamp:    r.timestamp,
    }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Geographic View"
        description="Published spatial datasets, active notices and governance node activity for Amajuba District."
      />
      <SpatialMapClient datasets={publishedDatasets} notices={noticeMarkers} nodeGeoRefs={nodeGeoRefs} />
    </div>
  );
}
