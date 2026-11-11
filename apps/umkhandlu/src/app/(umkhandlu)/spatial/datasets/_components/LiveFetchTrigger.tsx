'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAndStageFromArcGISAction } from '../../_actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  datasetId: string;
  datasetStatus: string;
  layerId: string | null;
  sourceType: string;
  permissionClassification: string;
  sourceName?: string;
}

const BLOCKS_LIVE_FETCH = new Set(['restricted', 'prohibited', 'pending', 'reference', 'display']);

export function LiveFetchTrigger({ datasetId, datasetStatus, layerId, sourceType, permissionClassification, sourceName }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [layerInput, setLayerInput] = useState(layerId ?? '0');
  const [whereClause, setWhereClause] = useState('1=1');
  const [result, setResult] = useState<{ success?: boolean; staged?: number; invalid?: number; error?: string } | null>(null);

  const isArcGIS = sourceType.startsWith('arcgis');
  const isBlocked = BLOCKS_LIVE_FETCH.has(permissionClassification);
  const isPublished = datasetStatus === 'published';

  if (!isArcGIS) return null;

  if (isBlocked) {
    const isFormalRequired = permissionClassification === 'formal_permission_required';
    return (
      <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="size-4 mt-0.5 shrink-0" />
        <p>
          {isFormalRequired
            ? <>Live fetch is blocked: <strong>{sourceName ?? 'this source'}</strong> requires formal written permission before ingestion. Obtain a data access agreement from the custodian, then update the source permission classification.</>
            : <>Live fetch is blocked: permission classification is <strong>{permissionClassification}</strong>. Update the source permission to internal, download or redistribute to enable ingestion.</>
          }
        </p>
      </div>
    );
  }

  if (isPublished) {
    return (
      <p className="text-sm text-muted-foreground">
        Dataset is published. Create a new dataset version to fetch updated data.
      </p>
    );
  }

  async function handleFetch() {
    const lid = parseInt(layerInput, 10);
    if (isNaN(lid)) {
      setResult({ error: 'Layer ID must be a number.' });
      return;
    }
    setPending(true);
    setResult(null);
    const res = await fetchAndStageFromArcGISAction(datasetId, lid, { where: whereClause || '1=1' });
    setResult(res);
    if (res.success) router.refresh();
    setPending(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Fetch features directly from the live ArcGIS service. Features will be staged for review before publication.
        Clips to Amajuba District bounding box by default.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="layer-id">Layer ID</Label>
          <Input
            id="layer-id"
            value={layerInput}
            onChange={(e) => setLayerInput(e.target.value)}
            placeholder="0"
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="where-clause">Where clause</Label>
          <Input
            id="where-clause"
            value={whereClause}
            onChange={(e) => setWhereClause(e.target.value)}
            placeholder="1=1"
            className="font-mono"
          />
        </div>
      </div>

      <Button variant="outline" onClick={handleFetch} disabled={pending}>
        <Download className="size-4 mr-2" />
        {pending ? 'Fetching…' : 'Fetch and stage'}
      </Button>

      {result?.success && (
        <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle className="size-4 mt-0.5 shrink-0" />
          <p>
            {result.staged} features staged for review.
            {result.invalid ? ` ${result.invalid} have geometry issues — review before approving.` : ''}
            {' '}Go to <a href="/spatial/staging" className="underline">Staging Review</a> to approve.
          </p>
        </div>
      )}

      {result?.error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <p>{result.error}</p>
        </div>
      )}
    </div>
  );
}
