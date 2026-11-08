import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/server';
import { RunSchedulerButton } from './_components/RunSchedulerButton';

export const dynamic = 'force-dynamic';

const statusColour: Record<string, string> = {
  running: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed:  'bg-red-100 text-red-800',
  partial: 'bg-amber-100 text-amber-800',
};

const pipelineLabel: Record<string, string> = {
  'health-check':      'Source Health Check',
  'freshness-check':   'Data Freshness',
  'compliance-alert':  'Compliance Alerts',
  'risk-reminder':     'Risk Reminders',
  'arcgis-fetch':      'ArcGIS Fetch',
  'gdal-process':      'GDAL Processing',
  'publication':       'Publication',
  'reconciliation':    'Reconciliation',
};

export default async function SpatialMonitoringPage() {
  const supabase = createServiceClient();

  const [
    { data: recentRuns },
    { data: sources },
    { data: openFindings },
    { data: staleDatasets },
  ] = await Promise.all([
    supabase
      .from('spatial_pipeline_runs')
      .select('id, pipeline_type, status, started_at, completed_at, error_message, triggered_by')
      .order('started_at', { ascending: false })
      .limit(30),
    supabase
      .from('spatial_sources')
      .select('id, name, active, last_checked_at, permission_status')
      .eq('active', true)
      .order('name'),
    supabase
      .from('findings')
      .select('id, title, severity, identified_at')
      .eq('status', 'open')
      .eq('owner', 'system')
      .order('identified_at', { ascending: false })
      .limit(20),
    supabase
      .from('spatial_datasets')
      .select('id, name, status, last_processed_at')
      .eq('active', true)
      .not('status', 'eq', 'published')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const runs = recentRuns ?? [];
  const lastRun = runs[0];
  const failedToday = runs.filter((r) => {
    const today = new Date().toISOString().split('T')[0];
    return r.status === 'failed' && r.started_at.startsWith(today);
  }).length;

  const neverChecked = (sources ?? []).filter((s) => !s.last_checked_at).length;
  const staleCount = (sources ?? []).filter((s) => {
    if (!s.last_checked_at) return false;
    return new Date(s.last_checked_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spatial Monitoring"
        description="Pipeline health, data freshness and automated alert status."
        actions={<RunSchedulerButton />}
      />

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold">{sources?.length ?? 0}</p>
          <p className="text-sm text-muted-foreground">Active sources</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className={`text-2xl font-semibold ${failedToday > 0 ? 'text-destructive' : 'text-green-600'}`}>{failedToday}</p>
          <p className="text-sm text-muted-foreground">Failed runs today</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className={`text-2xl font-semibold ${neverChecked + staleCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>{neverChecked + staleCount}</p>
          <p className="text-sm text-muted-foreground">Stale / unchecked sources</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className={`text-2xl font-semibold ${(openFindings?.length ?? 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>{openFindings?.length ?? 0}</p>
          <p className="text-sm text-muted-foreground">Open system findings</p>
        </CardContent></Card>
      </div>

      {lastRun && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-between gap-4 text-sm">
            <div>
              <p className="font-medium">Last pipeline run</p>
              <p className="text-muted-foreground">{pipelineLabel[lastRun.pipeline_type] ?? lastRun.pipeline_type} · {lastRun.triggered_by}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[lastRun.status] ?? ''}`}>
                {lastRun.status}
              </span>
              <span className="text-xs text-muted-foreground">{new Date(lastRun.started_at).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Source Health</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {(sources ?? []).map((s) => {
                const isStale = s.last_checked_at
                  ? new Date(s.last_checked_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  : true;
                return (
                  <div key={s.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                    <p className="truncate">{s.name}</p>
                    <div className="flex items-center gap-2 shrink-0 text-xs">
                      {isStale
                        ? <span className="text-amber-600">Stale</span>
                        : <span className="text-green-600">Fresh</span>
                      }
                      <span className="text-muted-foreground">
                        {s.last_checked_at
                          ? new Date(s.last_checked_at).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Open System Findings</CardTitle></CardHeader>
          <CardContent className="p-0">
            {!openFindings?.length ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">No open system findings.</div>
            ) : (
              <div className="divide-y">
                {openFindings.map((f) => (
                  <div key={f.id} className="px-6 py-3 text-sm">
                    <p className="truncate">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.severity} · {new Date(f.identified_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Pipeline Runs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {runs.map((run) => {
              const duration = run.completed_at
                ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                : null;
              return (
                <div key={run.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p>{pipelineLabel[run.pipeline_type] ?? run.pipeline_type}</p>
                    {run.error_message && <p className="text-xs text-destructive">{run.error_message}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    {duration != null && <span>{duration}s</span>}
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusColour[run.status] ?? ''}`}>{run.status}</span>
                    <span>{new Date(run.started_at).toLocaleString()}</span>
                    <span>{run.triggered_by}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {staleDatasets && staleDatasets.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Datasets Awaiting Processing</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {staleDatasets.map((d) => (
                <div key={d.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                  <p>{d.name}</p>
                  <span className="text-xs text-muted-foreground">{d.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
