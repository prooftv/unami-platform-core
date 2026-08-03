'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';
import type { Broadcast, AdminSession } from '@moments/api';

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

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
  const [retryResult, setRetryResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRetry = (session.role === 'superadmin' || session.role === 'content_admin')
    && broadcast.status === 'failed';

  const deliveryRate = broadcast.recipientCount > 0
    ? Math.round((broadcast.successCount / broadcast.recipientCount) * 100)
    : 0;

  async function handleRetry() {
    setRetrying(true);
    setError(null);
    setRetryResult(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/retry-batches`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );
      const data = await res.json();
      setRetryResult(`Retry complete — ${data.retried ?? 0} batches retried, ${data.skipped ?? 0} skipped`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/broadcasts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Broadcast Detail</h1>
            <p className="text-sm text-muted-foreground font-mono">{broadcast.id}</p>
          </div>
        </div>
        {canRetry && (
          <Button size="sm" variant="secondary" onClick={handleRetry} disabled={retrying}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {retrying ? 'Retrying...' : 'Retry Failed Batches'}
          </Button>
        )}
      </div>

      {retryResult && <p className="text-sm text-green-600 dark:text-green-400">{retryResult}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

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
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-semibold">{broadcast.recipientCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Recipients</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400">{broadcast.successCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-destructive">{broadcast.failureCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
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
  );
}
