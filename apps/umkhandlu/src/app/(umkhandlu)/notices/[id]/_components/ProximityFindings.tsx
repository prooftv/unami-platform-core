'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MapPin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import {
  computeProximityFindings,
  type ProximityLayer,
  type ProximityFinding,
} from '@/lib/gis/proximity-findings';
import type { ProximityRadiusConfig } from './notice-layer-config';

export type { ProximityLayer, ProximityFinding };

interface Props {
  layers: ProximityLayer[];
  origin: { lat: number; lng: number };
  radiusConfig: ProximityRadiusConfig;
  noticeId: string;
}

const ROLE_COLOUR: Record<string, string> = {
  'Schools / learning institutions': 'bg-blue-100 text-blue-800',
  'Health facilities': 'bg-red-100 text-red-800',
  'Religious institutions': 'bg-purple-100 text-purple-800',
  'Affected communities': 'bg-amber-100 text-amber-800',
  'Waterways / watercourses': 'bg-cyan-100 text-cyan-800',
  'Road network': 'bg-gray-100 text-gray-700',
  'Railways': 'bg-stone-100 text-stone-700',
};

function roleBadge(role: string) {
  return ROLE_COLOUR[role] ?? 'bg-slate-100 text-slate-700';
}

export function ProximityFindings({ layers, origin, radiusConfig, noticeId }: Props) {
  const [expanded, setExpanded] = useState(true);

  const findings = useMemo(
    () => computeProximityFindings(layers, origin, radiusConfig.metres),
    [layers, origin, radiusConfig.metres],
  );

  const unavailableLayers = layers.filter((l) => l.availability !== 'available');

  const byLayer = useMemo(() => {
    const map = new Map<string, ProximityFinding[]>();
    for (const f of findings) {
      const arr = map.get(f.layerId) ?? [];
      arr.push(f);
      map.set(f.layerId, arr);
    }
    return map;
  }, [findings]);

  return (
    <Card className="border-violet-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="size-4 text-violet-600" />
            Proximity Findings
            <span className="text-xs font-normal text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full">
              {radiusConfig.metres}m radius
            </span>
          </CardTitle>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={expanded ? 'Collapse findings' : 'Expand findings'}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
        <p className="text-xs text-violet-700 mt-0.5">{radiusConfig.statutoryBasis}</p>
        {radiusConfig.caveat && (
          <p className="text-xs text-muted-foreground mt-0.5">{radiusConfig.caveat}</p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3 pt-0">
          {findings.length === 0 && unavailableLayers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No features found within {radiusConfig.metres}m of this site.
            </p>
          )}

          {findings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {findings.length} feature{findings.length !== 1 ? 's' : ''} within radius
              </p>
              <div className="divide-y rounded-md border">
                {findings.map((f) => (
                  <div key={`${f.layerId}-${f.featureId}`} className="px-3 py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{f.featureName}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleBadge(f.layerRole)}`}>
                          {f.layerRole}
                        </span>
                        {f.attribution && (
                          <span className="text-xs text-muted-foreground">{f.attribution}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-violet-700">
                        {f.distanceMetres < 1000
                          ? `${f.distanceMetres}m`
                          : `${(f.distanceMetres / 1000).toFixed(2)}km`}
                      </p>
                      <Link
                        href={`/spatial/map?noticeId=${noticeId}&featureId=${f.featureId}&layerId=${f.layerId}`}
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        View <ExternalLink className="size-2.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <details className="group">
                <summary className="list-none cursor-pointer text-xs text-muted-foreground hover:text-foreground py-1">
                  <span className="font-medium">By layer</span>
                  <span className="ml-1 group-open:hidden">▾</span>
                  <span className="ml-1 hidden group-open:inline">▴</span>
                </summary>
                <div className="mt-1 space-y-1">
                  {[...byLayer.entries()].map(([layerId, lf]) => {
                    const layer = layers.find((l) => l.id === layerId);
                    return (
                      <div key={layerId} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-muted/40">
                        <span className="font-medium">{layer?.label ?? layerId}</span>
                        <span className="text-muted-foreground">{lf.length} feature{lf.length !== 1 ? 's' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          )}

          {unavailableLayers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="size-3 text-amber-500" />
                Layers not screened
              </p>
              {unavailableLayers.map((l) => (
                <div key={l.id} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                  <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">{l.role}</span>
                    {l.permissionNote && (
                      <span className="text-amber-600 ml-1">— {l.permissionNote}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Distances are approximate (equirectangular projection). Proximity screening is not a legal determination.
            Screening radius: {radiusConfig.metres}m · {radiusConfig.statutoryBasis}.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
