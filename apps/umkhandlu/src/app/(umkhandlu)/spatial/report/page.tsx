import { PageHeader } from '@unami/ui';
import Link from 'next/link';
import { buildAreaReport } from '@/lib/gis/area-report';
import { createServiceClient } from '@/lib/supabase/server';
import type { AreaType } from '@/lib/gis/area-report';

export const dynamic = 'force-dynamic';

const AREA_TYPES: { value: AreaType; label: string }[] = [
  { value: 'municipality', label: 'Municipality' },
  { value: 'ward',         label: 'Ward' },
  { value: 'district',     label: 'District' },
  { value: 'locality',     label: 'Locality' },
];

const TYPE_COLOUR: Record<string, string> = {
  record:  'bg-violet-100 text-violet-800',
  notice:  'bg-cyan-100 text-cyan-800',
  project: 'bg-green-100 text-green-800',
};

interface Props {
  searchParams: Promise<{ area?: string; type?: string }>;
}

export default async function SpatialReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const areaName = params.area?.trim() ?? '';
  const areaType = (AREA_TYPES.find((t) => t.value === params.type)?.value ?? 'municipality') as AreaType;

  const supabase = createServiceClient();
  const { data: datasetRows } = await supabase
    .from('spatial_datasets')
    .select('id, name')
    .eq('status', 'published')
    .eq('active', true)
    .order('name');

  const report = areaName ? await buildAreaReport(areaName, areaType) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spatial Report"
        description="Area-based governance intelligence. Select an area to view records, notices and projects from registered governance nodes."
        actions={
          <Link href="/spatial/map" className="text-sm text-muted-foreground hover:text-foreground underline">
            ← Map view
          </Link>
        }
      />

      {/* Filter form */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label htmlFor="area" className="text-xs font-medium text-muted-foreground">Area name</label>
          <input
            id="area"
            name="area"
            defaultValue={areaName}
            placeholder="e.g. Newcastle, Ward 3"
            className="h-9 rounded-md border bg-background px-3 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="type" className="text-xs font-medium text-muted-foreground">Area type</label>
          <select
            id="type"
            name="type"
            defaultValue={areaType}
            className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {AREA_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          Generate report
        </button>
        {areaName && (
          <Link
            href="/spatial/map"
            className="h-9 px-4 rounded-md border text-sm font-medium flex items-center hover:bg-muted"
          >
            View on map
          </Link>
        )}
      </form>

      {!areaName && (
        <div className="rounded-lg border bg-muted/30 p-6 text-center space-y-1">
          <p className="text-sm font-medium">Enter an area name to generate a report</p>
          <p className="text-xs text-muted-foreground">
            Use municipality names (Newcastle, Emadlangeni), ward references (Ward 3) or district names (Amajuba).
          </p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">{report.areaName}</p>
                <p className="text-sm text-muted-foreground capitalize">{report.areaType}</p>
              </div>
              <p className="text-xs text-muted-foreground shrink-0">
                {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Records',         value: report.totals.records },
                { label: 'Notices',         value: report.totals.notices },
                { label: 'Active projects', value: report.totals.activeProjects },
                { label: 'Dev notices',     value: report.totals.activeDevNotices },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            {report.unavailableNodes.length > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2">
                Nodes that did not respond (excluded): {report.unavailableNodes.join(', ')}
              </p>
            )}
          </div>

          {/* Per-node summaries */}
          <div className="space-y-4">
            <p className="text-sm font-medium">Governance node intelligence</p>
            {report.nodeSummaries.map((ns) => (
              <div key={ns.nodeId} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{ns.nodeName}</p>
                    <p className="text-xs text-muted-foreground">{ns.nodeAuthority}</p>
                  </div>
                  {!ns.available && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Unavailable</span>
                  )}
                </div>

                {!ns.available && (
                  <p className="text-xs text-muted-foreground italic">Node did not respond. Data may be incomplete.</p>
                )}

                {ns.available && !ns.municipality && !ns.ward && (
                  <p className="text-xs text-muted-foreground italic">
                    No spatial summary for {report.areaName} from this node.
                    This does not confirm the absence of activity.
                  </p>
                )}

                {ns.municipality && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { label: 'Records',         value: ns.municipality.recordCount },
                      { label: 'Notices',         value: ns.municipality.noticeCount },
                      { label: 'Active projects', value: ns.municipality.activeProjects },
                      { label: 'Dev notices',     value: ns.municipality.activeDevNotices },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded bg-muted/40 px-2 py-1.5">
                        <p className="font-semibold text-base">{value}</p>
                        <p className="text-muted-foreground">{label}</p>
                      </div>
                    ))}
                    {!ns.municipality.boundaryAvailable && (
                      <p className="col-span-4 text-amber-700">Boundary geometry not available from this node.</p>
                    )}
                  </div>
                )}

                {ns.ward && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-muted/40 px-2 py-1.5">
                      <p className="font-semibold text-base">{ns.ward.recordCount}</p>
                      <p className="text-muted-foreground">Records</p>
                    </div>
                    <div className="rounded bg-muted/40 px-2 py-1.5">
                      <p className="font-semibold text-base">{ns.ward.activeProjects}</p>
                      <p className="text-muted-foreground">Active projects</p>
                    </div>
                    {!ns.ward.boundaryAvailable && (
                      <p className="col-span-2 text-amber-700">Boundary geometry not available from this node.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* GeoRefs */}
          {report.geoRefs.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Recorded activity with geographic references ({report.geoRefs.length})
              </p>
              <div className="rounded-lg border bg-card divide-y">
                {report.geoRefs.map((ref, i) => (
                  <div key={`${ref.recordId}-${i}`} className="px-4 py-3 flex items-start gap-3">
                    <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLOUR[ref.recordType ?? 'record'] ?? 'bg-gray-100 text-gray-700'}`}>
                      {ref.recordType ?? 'record'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{ref.label ?? ref.recordId}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        {ref.municipality && <span>{ref.municipality}</span>}
                        {ref.ward && <span>{ref.ward}</span>}
                        {ref.locality && <span>{ref.locality}</span>}
                        {ref.latitude != null && ref.longitude != null && (
                          <span>{ref.latitude.toFixed(4)}, {ref.longitude.toFixed(4)}</span>
                        )}
                        {ref.timestamp && <span>{new Date(ref.timestamp).toLocaleDateString()}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Source: {ref.nodeName} — {ref.nodeAuthority}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.geoRefs.length === 0 && report.nodeSummaries.some((n) => n.available) && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              No georeferenced activity items returned for {report.areaName}.
              Counts above are from node spatial summaries.
              Individual records may exist without precise coordinates.
            </div>
          )}

          {/* Provenance */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <p className="text-sm font-medium">Data sources and provenance</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                Governance intelligence is sourced live from registered governance nodes via read-only APIs.
                No governance records are stored in the Control Centre.
              </p>
              {report.nodeSummaries.filter((n) => n.available).map((ns) => (
                <p key={ns.nodeId}>
                  <span className="font-medium text-foreground">{ns.nodeName}</span> — {ns.nodeAuthority}
                </p>
              ))}
              {(datasetRows ?? []).length > 0 && (
                <p className="pt-1">
                  Published spatial datasets: {(datasetRows ?? []).map((d) => d.name).join(', ')}
                </p>
              )}
              <p className="pt-1 text-amber-700">
                Absence of records does not confirm that no activity occurred.
                Nodes may not have published spatial summaries for all areas.
                Restricted datasets are excluded.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
