'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { fetchAreaReportAction } from '../_actions';
import type { AreaReport, AreaType } from '@/lib/gis/area-report';

interface SelectedFeature {
  datasetName: string;
  datasetSource: string;
  datasetDate: string | null;
  properties: Record<string, unknown>;
}

interface Props {
  feature: SelectedFeature;
  onClose: () => void;
}

// Attempt to extract a meaningful area name and type from GeoJSON properties.
// Governance nodes use municipality/ward names — match against common field names.
function resolveArea(props: Record<string, unknown>): { areaName: string; areaType: AreaType } | null {
  const candidates: [string[], AreaType][] = [
    [['MUNICNAME', 'MunicName', 'municipality', 'MUNICIPALITY', 'LocalMunic', 'LOCAL_MUNIC'], 'municipality'],
    [['WARDNAME', 'WardName', 'ward', 'WARD', 'WARD_NAME', 'WardNo', 'WARDNO'], 'ward'],
    [['DISTNAME', 'DistName', 'district', 'DISTRICT', 'DC_NAME'], 'district'],
    [['LOCALITY', 'locality', 'LocalityName', 'LOCALITYNAME'], 'locality'],
  ];
  for (const [keys, type] of candidates) {
    for (const key of keys) {
      const val = props[key];
      if (typeof val === 'string' && val.trim()) {
        return { areaName: val.trim(), areaType: type };
      }
    }
  }
  return null;
}

const TYPE_COLOUR: Record<string, string> = {
  record:  'bg-violet-100 text-violet-800',
  notice:  'bg-cyan-100 text-cyan-800',
  project: 'bg-green-100 text-green-800',
};

export function AreaInfoPanel({ feature, onClose }: Props) {
  const [report, setReport] = useState<AreaReport | null>(null);
  const [isPending, startTransition] = useTransition();
  const resolved = resolveArea(feature.properties);

  useEffect(() => {
    if (!resolved) return;
    setReport(null);
    startTransition(async () => {
      const r = await fetchAreaReportAction(resolved.areaName, resolved.areaType);
      setReport(r);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature]);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {resolved?.areaName ?? 'Selected feature'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {feature.datasetName} · {feature.datasetSource}
            {feature.datasetDate ? ` · ${feature.datasetDate}` : ''}
          </p>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground shrink-0">✕</button>
      </div>

      {/* Raw properties — always shown */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Geographic properties
        </summary>
        <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
          {Object.entries(feature.properties)
            .filter(([, v]) => v != null && v !== '')
            .slice(0, 20)
            .map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-muted-foreground shrink-0 w-24 truncate">{k}</span>
                <span className="truncate">{String(v)}</span>
              </div>
            ))}
        </div>
      </details>

      {/* No area resolved */}
      {!resolved && (
        <p className="text-xs text-muted-foreground">
          No municipality or ward identity found in this feature's properties.
          Governance intelligence requires a named area reference.
        </p>
      )}

      {/* Loading */}
      {resolved && isPending && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Fetching governance intelligence for {resolved.areaName}…
        </p>
      )}

      {/* Report */}
      {report && !isPending && (
        <div className="space-y-3">
          {/* Totals */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Records', value: report.totals.records },
              { label: 'Notices', value: report.totals.notices },
              { label: 'Active projects', value: report.totals.activeProjects },
              { label: 'Dev notices', value: report.totals.activeDevNotices },
            ].map(({ label, value }) => (
              <div key={label} className="rounded bg-muted/50 px-2 py-1.5">
                <p className="text-lg font-semibold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Per-node summaries */}
          {report.nodeSummaries.map((ns) => (
            <div key={ns.nodeId} className="space-y-1">
              <p className="text-xs font-medium">{ns.nodeName}</p>
              {!ns.available && (
                <p className="text-xs text-muted-foreground italic">Node unavailable</p>
              )}
              {ns.available && !ns.municipality && !ns.ward && (
                <p className="text-xs text-muted-foreground italic">
                  No spatial summary for {report.areaName} from this node.
                </p>
              )}
              {ns.municipality && (
                <div className="text-xs text-muted-foreground space-y-0.5 pl-2">
                  <p>{ns.municipality.recordCount} records · {ns.municipality.noticeCount} notices</p>
                  <p>{ns.municipality.activeProjects} active projects · {ns.municipality.activeDevNotices} dev notices</p>
                  {!ns.municipality.boundaryAvailable && (
                    <p className="text-amber-700">Boundary not available from this node</p>
                  )}
                </div>
              )}
              {ns.ward && (
                <div className="text-xs text-muted-foreground space-y-0.5 pl-2">
                  <p>{ns.ward.recordCount} records · {ns.ward.activeProjects} active projects</p>
                  {!ns.ward.boundaryAvailable && (
                    <p className="text-amber-700">Boundary not available from this node</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* GeoRefs in this area */}
          {report.geoRefs.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium">
                Recorded activity ({report.geoRefs.length})
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {report.geoRefs.map((ref, i) => (
                  <div key={`${ref.recordId}-${i}`} className="flex items-start gap-1.5 text-xs">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${TYPE_COLOUR[ref.recordType ?? 'record'] ?? 'bg-gray-100 text-gray-700'}`}>
                      {ref.recordType ?? 'record'}
                    </span>
                    <span className="truncate text-muted-foreground">{ref.label ?? ref.recordId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unavailable nodes */}
          {report.unavailableNodes.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Not available: {report.unavailableNodes.join(', ')}
            </p>
          )}

          {/* Source provenance */}
          <div className="pt-1 border-t space-y-0.5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Sources</p>
            <p className="text-[10px] text-muted-foreground">
              Spatial: {feature.datasetName} ({feature.datasetSource})
            </p>
            {report.nodeSummaries.filter((n) => n.available).map((ns) => (
              <p key={ns.nodeId} className="text-[10px] text-muted-foreground">
                Governance: {ns.nodeName} — {ns.nodeAuthority}
              </p>
            ))}
            <p className="text-[10px] text-muted-foreground">
              Generated: {new Date(report.generatedAt).toLocaleTimeString()}
            </p>
          </div>

          <Link
            href={`/spatial/report?area=${encodeURIComponent(report.areaName)}&type=${report.areaType}`}
            className="block text-xs text-blue-600 hover:underline"
          >
            Full area report →
          </Link>
        </div>
      )}
    </div>
  );
}
