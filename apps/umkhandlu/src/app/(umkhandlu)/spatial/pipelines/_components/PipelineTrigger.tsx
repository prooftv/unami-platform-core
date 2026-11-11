'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAndStageFromArcGISAction } from '../../_actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  institution: string;
  source_type: string;
  permission_classification: string;
}

interface Dataset {
  id: string;
  name: string;
  status: string;
  source_id: string;
  layer_id: string | null;
}

interface Props {
  sources: Source[];
  datasets: Dataset[];
}

const BLOCKS_INGEST = new Set(['restricted', 'prohibited', 'pending', 'reference', 'display', 'formal_permission_required']);

export function PipelineTrigger({ sources, datasets }: Props) {
  const router = useRouter();
  const [sourceId, setSourceId] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const [layerId, setLayerId] = useState('0');
  const [whereClause, setWhereClause] = useState('1=1');
  const [maxFeatures, setMaxFeatures] = useState('2000');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; staged?: number; invalid?: number; error?: string } | null>(null);

  const arcgisSources = sources.filter((s) => s.source_type.startsWith('arcgis'));
  const selectedSource = arcgisSources.find((s) => s.id === sourceId);
  const sourceDatasets = datasets.filter((d) => d.source_id === sourceId);
  const selectedDataset = sourceDatasets.find((d) => d.id === datasetId);

  const isBlocked = selectedSource ? BLOCKS_INGEST.has(selectedSource.permission_classification) : false;
  const isPublished = selectedDataset?.status === 'published';
  const canRun = !!sourceId && !!datasetId && !isBlocked && !isPublished && !running;

  function handleSourceChange(val: string) {
    setSourceId(val);
    setDatasetId('');
    setResult(null);
    const ds = datasets.filter((d) => d.source_id === val);
    if (ds.length === 1) {
      setDatasetId(ds[0].id);
      setLayerId(ds[0].layer_id ?? '0');
    }
  }

  function handleDatasetChange(val: string) {
    setDatasetId(val);
    setResult(null);
    const ds = datasets.find((d) => d.id === val);
    if (ds?.layer_id) setLayerId(ds.layer_id);
  }

  async function run() {
    const lid = parseInt(layerId, 10);
    if (isNaN(lid)) {
      setResult({ error: 'Layer ID must be a number.' });
      return;
    }
    setRunning(true);
    setResult(null);
    const res = await fetchAndStageFromArcGISAction(datasetId, lid, {
      where: whereClause || '1=1',
      maxFeatures: parseInt(maxFeatures, 10) || 2000,
    });
    setResult(res);
    if (res.success) router.refresh();
    setRunning(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Play className="size-4" />
          Trigger Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Select an ArcGIS source and registered dataset, configure parameters, then fetch and stage features for review.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select value={sourceId} onValueChange={handleSourceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select ArcGIS source…" />
              </SelectTrigger>
              <SelectContent>
                {arcgisSources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="truncate">{s.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Dataset</Label>
            <Select value={datasetId} onValueChange={handleDatasetChange} disabled={!sourceId}>
              <SelectTrigger>
                <SelectValue placeholder={sourceId ? 'Select dataset…' : 'Select source first'} />
              </SelectTrigger>
              <SelectContent>
                {sourceDatasets.length === 0 && (
                  <SelectItem value="_none" disabled>No datasets registered for this source</SelectItem>
                )}
                {sourceDatasets.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                    <span className="ml-2 text-xs text-muted-foreground">({d.status})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedSource && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ChevronRight className="size-3" />
            <span>{selectedSource.institution}</span>
            <span>·</span>
            <span className={BLOCKS_INGEST.has(selectedSource.permission_classification) ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
              {selectedSource.permission_classification}
            </span>
          </div>
        )}

        {isBlocked && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <p>Ingestion blocked: permission classification is <strong>{selectedSource?.permission_classification}</strong>. Update the source permission to internal, download or redistribute to enable ingestion.</p>
          </div>
        )}

        {isPublished && (
          <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <p>Dataset is already published. Register a new dataset version to re-ingest.</p>
          </div>
        )}

        {!isBlocked && !isPublished && datasetId && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pt-layer">Layer ID</Label>
              <Input
                id="pt-layer"
                value={layerId}
                onChange={(e) => setLayerId(e.target.value)}
                className="font-mono"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt-where">Where clause</Label>
              <Input
                id="pt-where"
                value={whereClause}
                onChange={(e) => setWhereClause(e.target.value)}
                className="font-mono"
                placeholder="1=1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt-max">Max features</Label>
              <Input
                id="pt-max"
                value={maxFeatures}
                onChange={(e) => setMaxFeatures(e.target.value)}
                className="font-mono"
                placeholder="2000"
              />
            </div>
          </div>
        )}

        {!isBlocked && !isPublished && (
          <Button onClick={run} disabled={!canRun}>
            <Play className="size-4 mr-1.5" />
            {running ? 'Running…' : 'Fetch and stage'}
          </Button>
        )}

        {result?.success && (
          <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            <CheckCircle className="size-4 mt-0.5 shrink-0" />
            <p>
              {result.staged} features staged.
              {result.invalid ? ` ${result.invalid} have geometry issues.` : ''}
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
      </CardContent>
    </Card>
  );
}
