import { PageHeader } from '@unami/ui';
import { createServiceClient } from '@/lib/supabase/server';
import { filterPubliclyRedistributableDatasets } from '@/lib/gis/spatial-public-access';
import { fetchNodeGeoRefs } from '@/lib/nodes/fetcher';
import { SpatialMapClient } from './_components/SpatialMapClient';
import type { PublishedDataset, NoticeMarker, NodeGeoRef } from './_components/SpatialMap';
import { PROXIMITY_RADIUS } from '@/app/(umkhandlu)/notices/[id]/_components/notice-layer-config';

export const dynamic = 'force-dynamic';

export default async function SpatialMapPage() {
  const supabase = createServiceClient();

  const { data: datasetRows, error: datasetError } = await supabase
    .from('spatial_datasets')
    .select('id, name, feature_count, dataset_date, attribution, source_id, permission_classification, spatial_sources(name, institution, attribution)')
    .eq('status', 'published')
    .eq('active', true)
    .order('published_at', { ascending: false });

  if (datasetError) {
    throw new Error(`Could not load published map datasets: ${datasetError.message}`);
  }
  const { datasets: rows } = await filterPubliclyRedistributableDatasets(
    supabase,
    datasetRows ?? [],
  );

  const publishedDatasets: PublishedDataset[] = rows.map((d) => {
    const src = Array.isArray(d.spatial_sources)
      ? d.spatial_sources[0]
      : d.spatial_sources;
    return {
      id: d.id,
      name: d.name,
      source_institution: src?.institution ?? 'Unknown',
      feature_count: d.feature_count,
      dataset_date: d.dataset_date,
      geojson: null,
      attribution: d.attribution ?? src?.attribution ?? null,
      loadOnDemand: true,
    };
  });

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
    proximity_radius_metres: PROXIMITY_RADIUS[n.type as string]?.metres ?? null,
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
