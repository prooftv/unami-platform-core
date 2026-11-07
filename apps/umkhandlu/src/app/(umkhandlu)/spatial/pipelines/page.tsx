import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createServiceClient } from '@/lib/supabase/server';
import { RunHealthCheckButton } from './_components/RunHealthCheckButton';
import { ReplayButton } from './_components/ReplayButton';

export const dynamic = 'force-dynamic';

const statusColour: Record<string, string> = {
  running: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed:  'bg-red-100 text-red-800',
  partial: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default async function PipelinesPage() {
  const supabase = createServiceClient();
  const { data: runs } = await supabase
    .from('spatial_pipeline_runs')
    .select('*, spatial_sources(name, institution)')
    .order('started_at', { ascending: false })
    .limit(100);

  const rows = runs ?? [];
  const failed  = rows.filter((r) => r.status === 'failed').length;
  const success = rows.filter((r) => r.status === 'success').length;
  const running = rows.filter((r) => r.status === 'running').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline Runs"
        description="Execution history for all spatial data pipelines."
        actions={<RunHealthCheckButton />}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-green-600">{success}</p>
          <p className="text-sm text-muted-foreground">Successful</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-destructive">{failed}</p>
          <p className="text-sm text-muted-foreground">Failed</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-blue-600">{running}</p>
          <p className="text-sm text-muted-foreground">Running</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Execution History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No pipeline runs yet. Run a health check to begin.
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((run) => {
                const src = run.spatial_sources as { name: string; institution: string } | null;
                const duration = run.completed_at
                  ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                  : null;
                return (
                  <div key={run.id} className="px-6 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{run.pipeline_type}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[run.status] ?? ''}`}>
                          {run.status}
                        </span>
                      </div>
                      {src && <p className="text-xs text-muted-foreground">{src.institution} — {src.name}</p>}
                      {run.error_message && <p className="text-xs text-destructive">{run.error_message}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                      {duration != null && <span>{duration}s</span>}
                      <span>{new Date(run.started_at).toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{run.triggered_by}</span>
                      {run.status === 'failed' && <ReplayButton runId={run.id} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
