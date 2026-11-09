'use client';

import nextDynamic from 'next/dynamic';
import type { PublishedDataset, NoticeMarker, NodeGeoRef } from './SpatialMap';

const SpatialMap = nextDynamic(
  () => import('./SpatialMap').then((m) => m.SpatialMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

interface Props {
  datasets: PublishedDataset[];
  notices: NoticeMarker[];
  nodeGeoRefs: NodeGeoRef[];
}

export function SpatialMapClient({ datasets, notices, nodeGeoRefs }: Props) {
  return <SpatialMap datasets={datasets} notices={notices} nodeGeoRefs={nodeGeoRefs} />;
}
