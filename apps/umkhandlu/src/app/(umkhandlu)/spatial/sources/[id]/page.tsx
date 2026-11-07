import { notFound } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { SourceForm } from '../_components/SourceForm';
import { SourceActions } from '../_components/SourceActions';
import type { SpatialSource } from '@/lib/gis/spatial-sources-fetcher';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

export default async function SourceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: source } = await supabase
    .from('spatial_sources')
    .select('*')
    .eq('id', id)
    .single();

  if (!source) notFound();

  const { data: recentRuns } = await supabase
    .from('spatial_pipeline_runs')
    .select('id, pipeline_type, status, started_at, completed_at, error_message')
    .eq('source_id', id)
    .order('started_at', { ascending: false })
    .limit(10);

  const s = source as SpatialSource;

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.name}
        description={s.institution}
        actions={
          <div className="flex items-center gap-2">
            <SourceActions id={s.id} active={s.active} />
            <Button variant="outline" asChild>
              <Link href="/spatial/sources">Back</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Type:</span> {s.source_type}</p>
              <p><span className="text-muted-foreground">Coverage:</span> {s.geographic_coverage}</p>
              <p><span className="text-muted-foreground">CRS:</span> {s.coordinate_system}</p>
              <p><span className="text-muted-foreground">Status:</span> {s.active ? 'Active' : 'Inactive'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Permission:</span> {s.permission_status}</p>
              {s.custodian_name && <p><span className="text-muted-foreground">Custodian:</span> {s.custodian_name}</p>}
              {s.custodian_email && <p><span className="text-muted-foreground">Email:</span> {s.custodian_email}</p>}
              {s.last_checked_at && (
                <p><span className="text-muted-foreground">Last checked:</span> {new Date(s.last_checked_at).toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {recentRuns && recentRuns.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Recent Pipeline Runs</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentRuns.map((run) => (
                  <div key={run.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <p>{run.pipeline_type}</p>
                      {run.error_message && <p className="text-xs text-destructive">{run.error_message}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                      <span className={
                        run.status === 'success' ? 'text-green-600' :
                        run.status === 'failed'  ? 'text-destructive' : 'text-amber-600'
                      }>{run.status}</span>
                      <span>{new Date(run.started_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Edit Source</CardTitle></CardHeader>
          <CardContent>
            <SourceForm source={s} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
