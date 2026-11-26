'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink, Play, ArrowRight, CheckCircle, Send, AlertTriangle } from 'lucide-react';

interface WorkflowRun {
  id: string;
  stage: string;
  geolibre_project_id?: string | null;
  geolibre_project_url?: string | null;
  gn_notice_ref?: string | null;
  approved_at?: string | null;
}

interface Props {
  noticeId: string;
  noticeType: string;
  run: WorkflowRun | null;
  workbenchUrl: string;
  geolibreUrl: string;
  hasCoordinates: boolean;
}

async function callWorkflowApi(body: Record<string, unknown>) {
  const res = await fetch('/api/spatial/notice-workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function WorkflowStageActions({ noticeId, noticeType, run, workbenchUrl, geolibreUrl, hasCoordinates }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [geolibreProjectUrl, setGeolibreProjectUrl] = useState(run?.geolibre_project_url ?? '');
  const [analystName, setAnalystName] = useState('');
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function act(action: string, toStage?: string, extra?: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    const result = await callWorkflowApi({ noticeId, noticeType, action, toStage, notes: notes || undefined, ...extra });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setNotes('');
    router.refresh();
  }

  const stage = run?.stage ?? null;

  if (!run) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Start Workflow</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No workflow run exists for this notice. Start one to begin the four-stage process.
          </p>
          {!hasCoordinates && (
            <p className="text-xs text-amber-600">
              This notice has no coordinates. Stage 1 screening will be incomplete. You can still start the workflow.
            </p>
          )}
          <Button onClick={() => act('start')} disabled={loading} className="gap-2">
            <Play className="size-4" /> Start workflow
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  if (stage === 'rejected') {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-4">
          <p className="text-sm text-destructive font-medium">Workflow rejected.</p>
          <p className="text-xs text-muted-foreground mt-1">Start a new workflow run to restart the process.</p>
          <Button variant="outline" onClick={() => act('start')} disabled={loading} className="mt-3">
            Restart workflow
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (stage === 'published') {
    return (
      <Card className="border-green-500/50">
        <CardContent className="pt-4">
          <p className="text-sm text-green-700 font-medium flex items-center gap-2">
            <CheckCircle className="size-4" /> Workflow complete — notice published.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          Current stage: <span className="capitalize">{stage}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stage === 'draft' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Verify site geometry and screening status, then open the Spatial Workbench to begin analysis.
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={workbenchUrl} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                Open Workbench <ExternalLink className="size-3.5" />
              </a>
              <Button onClick={() => act('advance', 'workbench')} disabled={loading} className="gap-2">
                Advance to Workbench Analysis <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {stage === 'workbench' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Complete spatial analysis in GeoLibre. Paste the project URL when done.
            </p>
            <a href={geolibreUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 transition-colors">
              Open GeoLibre <ExternalLink className="size-3.5" />
            </a>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">GeoLibre project URL (optional)</label>
              <Input
                placeholder="https://maps.gis.unamifoundation.org/projects/..."
                value={geolibreProjectUrl}
                onChange={(e) => setGeolibreProjectUrl(e.target.value)}
                className="text-sm"
              />
            </div>
            <Button
              onClick={() => act('advance', 'review', geolibreProjectUrl ? { geolibreProjectUrl } : undefined)}
              disabled={loading}
              className="gap-2"
            >
              Analysis complete — advance to Review <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {stage === 'review' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Review analysis outputs and provenance. Approve or reject.
            </p>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Analyst name</label>
              <Input
                placeholder="Name of reviewing analyst"
                value={analystName}
                onChange={(e) => setAnalystName(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Key findings summary</label>
              <Textarea
                placeholder="Summarise the spatial screening findings..."
                value={analysisSummary}
                onChange={(e) => setAnalysisSummary(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => act('advance', 'approved', {
                  analysisOutputs: {
                    analystName: analystName || undefined,
                    summary: analysisSummary || undefined,
                    analysisDate: new Date().toISOString(),
                    geolibreProjectUrl: run?.geolibre_project_url || undefined,
                  },
                })}
                disabled={loading}
                className="gap-2"
              >
                <CheckCircle className="size-4" /> Approve
              </Button>
              <Button variant="destructive" onClick={() => act('reject')} disabled={loading}>
                Reject
              </Button>
            </div>
          </div>
        )}

        {stage === 'approved' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Transfer approved outputs to the Governance Node. This creates a development notice record in the GN.
            </p>
            <Button onClick={() => act('advance', 'transferred')} disabled={loading} className="gap-2">
              <Send className="size-4" /> Transfer to Governance Node
            </Button>
          </div>
        )}

        {stage === 'transferred' && (
          <div className="space-y-3">
            {run?.gn_notice_ref ? (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                <p className="font-medium flex items-center gap-1.5">
                  <CheckCircle className="size-4" /> Transferred to Governance Node
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">GN ref: {run.gn_notice_ref}</p>
              </div>
            ) : (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <p>Transfer recorded but GN reference not confirmed. Check GN connectivity.</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Confirm public publication on the Governance Node before marking as published.
            </p>
            <Button onClick={() => act('advance', 'published')} disabled={loading} className="gap-2">
              <CheckCircle className="size-4" /> Confirm published
            </Button>
          </div>
        )}

        {stage === 'transferred' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Confirm public publication on the Governance Node.
            </p>
            <Button onClick={() => act('advance', 'published')} disabled={loading} className="gap-2">
              <CheckCircle className="size-4" /> Confirm published
            </Button>
          </div>
        )}

        <div className="space-y-1.5">
          <Textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
