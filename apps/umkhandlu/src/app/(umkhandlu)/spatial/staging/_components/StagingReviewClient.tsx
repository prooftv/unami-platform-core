'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { reviewStagedFeaturesAction } from '../../_actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Feature {
  id: string;
  dataset_id: string;
  geometry_valid: boolean;
  geometry_issues: string[] | null;
  feature_properties: Record<string, unknown>;
  feature_geojson: { type?: string } | null;
  operator_status: string;
}

interface Props {
  datasetId: string;
  features: Feature[];
}

function geomLabel(geojson: { type?: string } | null): string {
  if (!geojson?.type) return 'No geometry';
  return geojson.type;
}

function featureSummary(props: Record<string, unknown>): string {
  const nameKeys = ['name', 'NAME', 'Name', 'title', 'TITLE', 'label', 'LABEL'];
  for (const k of nameKeys) {
    if (props[k]) return String(props[k]);
  }
  return Object.entries(props).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ');
}

export function StagingReviewClient({ datasetId, features }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(features.map((f) => f.id)));
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalid = features.filter((f) => !f.geometry_valid);
  const geomTypes = [...new Set(features.map((f) => geomLabel(f.feature_geojson)))];

  async function submit(action: 'approve' | 'reject') {
    if (!selected.size) return;
    setPending(action);
    setError(null);
    const res = await reviewStagedFeaturesAction(datasetId, Array.from(selected), action, notes || undefined);
    if (res.error) setError(res.error);
    else router.refresh();
    setPending(null);
  }

  function toggleAll() {
    if (selected.size === features.length) setSelected(new Set());
    else setSelected(new Set(features.map((f) => f.id)));
  }

  if (features.length === 0) {
    return <p className="text-sm text-muted-foreground">All features reviewed.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{features.length} features</span>
        <span>Geometry: {geomTypes.join(', ')}</span>
        {invalid.length > 0 && (
          <span className="text-amber-700 font-medium">{invalid.length} with geometry issues</span>
        )}
      </div>

      {invalid.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <p>{invalid.length} feature(s) have geometry issues. Review before approving.</p>
        </div>
      )}

      <div className="border rounded-md divide-y max-h-80 overflow-y-auto">
        <div className="px-4 py-2 flex items-center gap-3 bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0">
          <input
            type="checkbox"
            checked={selected.size === features.length}
            onChange={toggleAll}
            className="rounded"
          />
          <span>Select all ({features.length})</span>
        </div>
        {features.map((f) => (
          <div key={f.id} className="px-4 py-2 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={selected.has(f.id)}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(f.id);
                else next.delete(f.id);
                setSelected(next);
              }}
              className="mt-0.5 rounded"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {f.geometry_valid
                  ? <CheckCircle className="size-3.5 text-green-600 shrink-0" />
                  : <XCircle className="size-3.5 text-destructive shrink-0" />
                }
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  {geomLabel(f.feature_geojson)}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {featureSummary(f.feature_properties)}
                </span>
              </div>
              {f.geometry_issues?.length ? (
                <p className="text-xs text-destructive mt-0.5 pl-5">{f.geometry_issues.join(', ')}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Review notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Reason for approval or rejection…"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <Button
          onClick={() => submit('approve')}
          disabled={!!pending || !selected.size}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="size-4 mr-1" />
          {pending === 'approve' ? 'Approving…' : `Approve ${selected.size}`}
        </Button>
        <Button
          variant="destructive"
          onClick={() => submit('reject')}
          disabled={!!pending || !selected.size}
        >
          <XCircle className="size-4 mr-1" />
          {pending === 'reject' ? 'Rejecting…' : `Reject ${selected.size}`}
        </Button>
      </div>
    </div>
  );
}
