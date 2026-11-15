'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { fetchAndStageFromGratisGisAction } from '../../_actions';

export function GratisGisFetchTrigger({
  datasetId,
  datasetStatus,
  collectionId,
  permissionClassification,
}: {
  datasetId: string;
  datasetStatus: string;
  collectionId: string | null;
  permissionClassification: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runFetch() {
    setPending(true);
    setResult(null);
    try {
      const response = await fetchAndStageFromGratisGisAction(datasetId);
      if (response.error) {
        setResult(response.error);
      } else if (response.success) {
        setResult(`Staged ${response.staged} features for operator review.`);
        router.refresh();
      } else {
        setResult('GratisGIS feature staging did not complete.');
      }
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'GratisGIS request failed.');
    } finally {
      setPending(false);
    }
  }

  const disabled =
    pending ||
    !collectionId ||
    !['internal', 'download', 'redistribute'].includes(permissionClassification) ||
    ['published', 'archived', 'rejected'].includes(datasetStatus);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Fetches the registered OGC collection read-only and stages features for operator review.
        No public-demo fallback or GratisGIS editing is used.
      </p>
      <Button type="button" onClick={runFetch} disabled={disabled}>
        {pending ? 'Fetching…' : 'Fetch and stage features'}
      </Button>
      {result && <p className="text-sm" role="status">{result}</p>}
    </div>
  );
}
