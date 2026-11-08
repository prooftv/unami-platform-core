'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ingestGeoJSONAction } from '../../_actions';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  datasetId: string;
  datasetStatus: string;
}

export function GeoJSONUpload({ datasetId, datasetStatus }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; staged?: number; invalid?: number; error?: string } | null>(null);

  if (datasetStatus === 'published') {
    return (
      <p className="text-sm text-muted-foreground">
        Dataset is published. Create a new dataset version to ingest updated data.
      </p>
    );
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.geojson') && !file.name.endsWith('.json')) {
      setResult({ error: 'Only .geojson or .json files are supported.' });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setResult({ error: 'File exceeds 50 MB limit. Split into smaller files.' });
      return;
    }

    setPending(true);
    setResult(null);

    try {
      const text = await file.text();
      const res = await ingestGeoJSONAction(datasetId, text);
      setResult(res);
      if (res.success) router.refresh();
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Upload a GeoJSON FeatureCollection. Features will be staged for review before publication.
        Supports files up to 50 MB / 10,000 features.
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          <Upload className="size-4 mr-2" />
          {pending ? 'Ingesting…' : 'Upload GeoJSON'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".geojson,.json"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {result?.success && (
        <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle className="size-4 mt-0.5 shrink-0" />
          <p>
            {result.staged} features staged for review.
            {result.invalid ? ` ${result.invalid} have geometry issues — review before approving.` : ''}
            Go to <a href="/spatial/staging" className="underline">Staging Review</a> to approve.
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
