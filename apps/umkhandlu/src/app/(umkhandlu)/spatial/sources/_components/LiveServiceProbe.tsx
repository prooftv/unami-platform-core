'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Zap } from 'lucide-react';

interface Props {
  sourceId: string;
  baseUrl: string;
  sourceType: string;
}

interface QueryResult {
  reachable: boolean;
  responseMs: number;
  layerCount?: number;
  sampleFeatureCount?: number;
  error?: string;
}

export function LiveServiceProbe({ baseUrl, sourceType }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);

  const isArcGIS = sourceType.startsWith('arcgis');

  async function probe() {
    setRunning(true);
    setResult(null);
    const start = Date.now();
    try {
      const res = await fetch(`/api/spatial/probe?url=${encodeURIComponent(baseUrl)}&type=${sourceType}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      setResult({ ...data, responseMs: Date.now() - start });
    } catch (e) {
      setResult({ reachable: false, responseMs: Date.now() - start, error: String(e) });
    }
    setRunning(false);
  }

  if (!isArcGIS) {
    return (
      <p className="text-sm text-muted-foreground">
        Live probing is available for ArcGIS services. Download sources are tested via health check.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={probe} disabled={running}>
        <Zap className="size-4 mr-1.5" />
        {running ? 'Probing…' : 'Probe live service'}
      </Button>

      {result && (
        <div className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${result.reachable ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-destructive'}`}>
          {result.reachable
            ? <CheckCircle className="size-4 mt-0.5 shrink-0" />
            : <XCircle className="size-4 mt-0.5 shrink-0" />
          }
          <div className="space-y-0.5">
            {result.reachable ? (
              <>
                <p className="font-medium">Service reachable — {result.responseMs}ms</p>
                {result.layerCount != null && <p>{result.layerCount} layer{result.layerCount !== 1 ? 's' : ''} available</p>}
                {result.sampleFeatureCount != null && <p>{result.sampleFeatureCount} features returned on sample query</p>}
              </>
            ) : (
              <p>{result.error ?? 'Service unreachable'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
