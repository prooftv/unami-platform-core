'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { publishDatasetAction, archiveDatasetAction } from '../../_actions';
import { Button } from '@/components/ui/button';
import { CheckCircle, Archive, AlertTriangle } from 'lucide-react';

interface Props {
  datasetId: string;
  status: string;
  pendingCount: number;
  approvedCount: number;
}

export function DatasetActions({ datasetId, status, pendingCount, approvedCount }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<'publish' | 'archive' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'archive' | null>(null);

  const canPublish = status !== 'published' && status !== 'archived' && pendingCount === 0 && approvedCount > 0;
  const canArchive = status !== 'archived';

  async function publish() {
    setPending('publish');
    setError(null);
    const res = await publishDatasetAction(datasetId);
    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
    }
    setPending(null);
  }

  async function archive() {
    if (confirm !== 'archive') {
      setConfirm('archive');
      return;
    }
    setPending('archive');
    setError(null);
    const res = await archiveDatasetAction(datasetId);
    if (res.error) {
      setError(res.error);
    } else {
      router.refresh();
    }
    setPending(null);
    setConfirm(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {canPublish && (
          <Button size="sm" onClick={publish} disabled={!!pending} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="size-4 mr-1.5" />
            {pending === 'publish' ? 'Publishing…' : `Publish (${approvedCount} features)`}
          </Button>
        )}
        {pendingCount > 0 && (
          <p className="text-xs text-amber-700 flex items-center gap-1">
            <AlertTriangle className="size-3" />
            {pendingCount} features pending review — approve or reject before publishing
          </p>
        )}
        {approvedCount === 0 && pendingCount === 0 && status !== 'published' && status !== 'archived' && (
          <p className="text-xs text-muted-foreground">No approved features. Stage and approve features before publishing.</p>
        )}
        {canArchive && (
          <Button
            size="sm"
            variant="outline"
            onClick={archive}
            disabled={!!pending}
            className={confirm === 'archive' ? 'border-destructive text-destructive' : ''}
          >
            <Archive className="size-4 mr-1.5" />
            {pending === 'archive' ? 'Archiving…' : confirm === 'archive' ? 'Confirm archive' : 'Archive'}
          </Button>
        )}
        {confirm === 'archive' && (
          <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
