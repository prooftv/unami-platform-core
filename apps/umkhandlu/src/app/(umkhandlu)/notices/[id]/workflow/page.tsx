import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createServiceClient } from '@/lib/supabase/server';
import { WorkflowStageActions } from './_components/WorkflowStageActions';
import { CheckCircle, Circle, Clock, XCircle, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STAGES = [
  { key: 'draft', label: 'Draft & Contextualise', description: 'Verify site geometry, screening status and required datasets.' },
  { key: 'workbench', label: 'Workbench Analysis', description: 'Open in GeoLibre for spatial analysis and proximity assessment.' },
  { key: 'review', label: 'Review & Provenance', description: 'Review analysis outputs, validate provenance manifest.' },
  { key: 'approved', label: 'Approve & Transfer', description: 'Approve outputs and transfer to Governance Node.' },
] as const;

const STAGE_ORDER = ['draft', 'workbench', 'review', 'approved', 'transferred', 'published'];

function stageIndex(stage: string) {
  return STAGE_ORDER.indexOf(stage);
}

export default async function NoticeWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: notice }, { data: run }] = await Promise.all([
    supabase.from('notices').select('id, title, type, status, latitude, longitude, ward_ref, is_statutory').eq('id', id).single(),
    supabase
      .from('notice_workflow_runs')
      .select('*, notice_workflow_events(id, from_stage, to_stage, actor_type, notes, created_at)')
      .eq('notice_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!notice) notFound();

  const preset = run?.preset_id
    ? (await supabase.from('notice_presets').select('*').eq('id', run.preset_id).single()).data
    : (await supabase.from('notice_presets').select('*').eq('notice_type', notice.type).eq('active', true).order('version', { ascending: false }).limit(1).maybeSingle()).data;

  const currentStageIdx = run ? stageIndex(run.stage) : -1;
  const geolibreUrl = process.env.GEOLIBRE_URL ?? 'https://maps.gis.unamifoundation.org';
  const workbenchUrl = `/spatial/workbench?noticeId=${id}&noticeType=${notice.type}${notice.latitude ? `&lat=${notice.latitude}&lng=${notice.longitude}` : ''}${notice.ward_ref ? `&ward=${encodeURIComponent(notice.ward_ref)}` : ''}&returnTo=/notices/${id}/workflow`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Workflow"
        description={notice.title}
        actions={
          <div className="flex gap-2">
            <Link href={`/notices/${id}`} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              ← Back to notice
            </Link>
          </div>
        }
      />

      {!preset && (
        <Alert>
          <AlertDescription>
            No active preset found for notice type <strong>{notice.type}</strong>. The workflow will run without a preset — validation rules and GeoLibre tool constraints will not be enforced.
          </AlertDescription>
        </Alert>
      )}

      {preset && (
        <Card>
          <CardContent className="pt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{preset.label}</p>
              <p className="text-xs text-muted-foreground">
                v{preset.version}
                {preset.proximity_radius_metres ? ` · ${preset.proximity_radius_metres}m proximity zone` : ''}
                {preset.gn_publication_required ? ' · GN publication required' : ''}
              </p>
            </div>
            <Badge variant="outline">{notice.type}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Stage progress */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {STAGES.map((stage, i) => {
          const done = currentStageIdx > i;
          const active = run?.stage === stage.key;
          const rejected = run?.stage === 'rejected';
          return (
            <Card key={stage.key} className={`${active ? 'border-primary' : done ? 'border-green-500/50' : ''}`}>
              <CardContent className="pt-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  {rejected && active ? (
                    <XCircle className="size-4 text-destructive shrink-0" />
                  ) : done ? (
                    <CheckCircle className="size-4 text-green-600 shrink-0" />
                  ) : active ? (
                    <Clock className="size-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <p className="text-xs font-medium">{i + 1}. {stage.label}</p>
                </div>
                <p className="text-xs text-muted-foreground">{stage.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current stage actions */}
      <WorkflowStageActions
        noticeId={id}
        noticeType={notice.type}
        run={run ?? null}
        workbenchUrl={workbenchUrl}
        geolibreUrl={geolibreUrl}
        hasCoordinates={!!(notice.latitude && notice.longitude)}
      />

      {/* GeoLibre project link if in workbench stage */}
      {run?.geolibre_project_url && (
        <Card>
          <CardHeader><CardTitle className="text-sm">GeoLibre Project</CardTitle></CardHeader>
          <CardContent>
            <a href={run.geolibre_project_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
              Open project in GeoLibre <ExternalLink className="size-3.5" />
            </a>
            <p className="text-xs text-muted-foreground mt-1">ID: {run.geolibre_project_id}</p>
          </CardContent>
        </Card>
      )}

      {/* Event log */}
      {run?.notice_workflow_events && run.notice_workflow_events.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Workflow History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {[...run.notice_workflow_events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((ev) => (
                <div key={ev.id} className="px-6 py-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">
                      {ev.from_stage ? `${ev.from_stage} → ${ev.to_stage}` : ev.to_stage}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</span>
                  </div>
                  {ev.notes && <p className="text-xs text-muted-foreground mt-0.5">{ev.notes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
