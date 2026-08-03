'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@unami/ui';
import { RefreshCw } from 'lucide-react';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import type { Broadcast, AdminSession } from '@unami/api';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending: 'outline', processing: 'secondary', completed: 'default', failed: 'destructive',
};

interface Props {
  broadcast: Broadcast;
  session: AdminSession;
}

export function BroadcastDetailClient({ broadcast, session }: Props) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRetry = (session.role === 'superadmin' || session.role === 'content_admin') && broadcast.status === 'failed';
  const deliveryRate = broadcast.recipientCount > 0 ? Math.round((broadcast.successCount / broadcast.recipientCount) * 100) : 0;

  async function handleRetry() {
    setRetrying(true);
    setError(null);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      const data = await api.broadcasts.retry();
      setFeedback(`Retry complete — ${data.retried ?? 0} batches retried, ${data.skipped ?? 0} skipped`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcast Detail"
        description={broadcast.id}
        actions={
          canRetry ? (
            <Button size="sm" variant="secondary" onClick={handleRetry} disabled={retrying}>
              <RefreshCw className="h-4 w-4 mr-2" />{retrying ? 'Retrying...' : 'Retry Failed Batches'}
            </Button>
          ) : undefined
        }
      />

      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant={STATUS_VARIANT[broadcast.status]}>{broadcast.status}</Badge>
              <div className="space-y-1 text-muted-foreground">
                <p>Started: <span className="font-medium text-foreground">{new Date(broadcast.broadcastStartedAt).toLocaleString()}</span></p>
                {broadcast.broadcastCompletedAt && (
                  <p>Completed: <span className="font-medium text-foreground">{new Date(broadcast.broadcastCompletedAt).toLocaleString()}</span></p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Delivery</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-semibold">{broadcast.recipientCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Recipients</p>
                </div>
                <div>
                  <p className="text-xl font-semibold">{broadcast.successCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-destructive">{broadcast.failureCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${deliveryRate}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">{deliveryRate}% delivery rate</p>
            </CardContent>
          </Card>
        </div>

        {broadcast.errorDetails && (
          <Card>
            <CardHeader><CardTitle>Error Details</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted rounded p-3">
                {JSON.stringify(broadcast.errorDetails, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {broadcast.authorityContext && (
          <Card>
            <CardHeader><CardTitle>Authority Context</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1 text-muted-foreground">
              <p>Level: <span className="font-medium text-foreground">{String((broadcast.authorityContext as Record<string, unknown>).authority_level ?? '—')}</span></p>
              <p>Blast radius applied: <span className="font-medium text-foreground">{String((broadcast.authorityContext as Record<string, unknown>).blast_radius ?? '—')}</span></p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
