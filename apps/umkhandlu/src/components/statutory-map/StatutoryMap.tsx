'use client';

import nextDynamic from 'next/dynamic';
import { AlertTriangle, MapPin } from 'lucide-react';

export interface StatutoryMapSubject {
  lat: number;
  lng: number;
  label: string;
  coordinateRole?: 'site' | 'area-reference';
  proximityRadiusMetres?: number | null;
}

export interface StatutoryMapLayer {
  id: string;
  name: string;
  colour: string;
  geojson: {
    type: 'FeatureCollection';
    features: unknown[];
  };
}

export interface StatutoryMapProps {
  subject: StatutoryMapSubject | null;
  layers?: StatutoryMapLayer[];
  height?: string;
  className?: string;
  missingGeometryMessage?: string;
}

const StatutoryMapInner = nextDynamic(
  () => import('./StatutoryMapInner').then((m) => m.StatutoryMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-muted/30 rounded-lg border" style={{ height: '100%', minHeight: '320px' }}>
        <div className="flex gap-1">
          <span className="bg-muted-foreground/60 size-1.5 animate-pulse rounded-full" />
          <span className="bg-muted-foreground/60 size-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
          <span className="bg-muted-foreground/60 size-1.5 animate-pulse rounded-full [animation-delay:300ms]" />
        </div>
      </div>
    ),
  },
);

export function StatutoryMap({
  subject,
  layers = [],
  height = '400px',
  className,
  missingGeometryMessage,
}: StatutoryMapProps) {
  if (!subject) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/20 text-center p-6 ${className ?? ''}`}
        style={{ height }}
      >
        <MapPin className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {missingGeometryMessage ?? 'No coordinates available for this notice.'}
        </p>
      </div>
    );
  }

  if (subject.coordinateRole === 'area-reference') {
    return (
      <div className={className}>
        <div className="mb-2 flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
          <AlertTriangle className="size-3 shrink-0" />
          Map shows area reference point, not the exact site location.
        </div>
        <StatutoryMapInner subject={subject} layers={layers} height={height} />
      </div>
    );
  }

  return (
    <div className={className}>
      <StatutoryMapInner subject={subject} layers={layers} height={height} />
    </div>
  );
}
