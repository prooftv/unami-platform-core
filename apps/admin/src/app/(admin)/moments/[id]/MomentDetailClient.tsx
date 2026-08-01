'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MomentWithSponsor, AdminSession } from '@moments/api';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';
import { Send, ArrowLeft } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  draft: 'outline', scheduled: 'secondary', broadcasted: 'default', cancelled: 'destructive',
};

async function getToken() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

interface Props {
  moment: MomentWithSponsor;
  session: AdminSession;
}

export function MomentDetailClient({ moment, session }: Props) {
  const router = useRouter();
  const [broadcasting, setBroadcasting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canBroadcast =
    (session.role === 'superadmin' || session.role === 'content_admin') &&
    (moment.status === 'draft' || moment.status === 'scheduled');

  async function handleBroadcast() {
    if (!confirm(`Broadcast "${moment.title}" to subscribers? This cannot be undone.`)) return;
    setBroadcasting(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      const res = await api.broadcasts.trigger(moment.id);
      setResult(`Broadcast complete — ${res.successCount} of ${res.recipientCount} delivered`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">{moment.title}</h1>
          <p className="text-sm text-muted-foreground">{moment.region} · {moment.category} · {moment.language}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/moments')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {canBroadcast && (
            <Button size="sm" onClick={handleBroadcast} disabled={broadcasting}>
              <Send className="h-4 w-4 mr-2" />
              {broadcasting ? 'Broadcasting...' : 'Broadcast'}
            </Button>
          )}
        </div>
      </div>

      {result && <p className="text-sm text-green-600 dark:text-green-400">{result}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[moment.status]}>{moment.status}</Badge>
              {moment.isSponsored && <Badge variant="secondary">Sponsored</Badge>}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Urgency: <span className="font-medium text-foreground">{moment.urgencyLevel}</span></p>
              <p>Source: <span className="font-medium text-foreground">{moment.contentSource}</span></p>
              {moment.broadcastedAt && (
                <p>Broadcasted: <span className="font-medium text-foreground">{new Date(moment.broadcastedAt).toLocaleString()}</span></p>
              )}
              {moment.scheduledAt && !moment.broadcastedAt && (
                <p>Scheduled: <span className="font-medium text-foreground">{new Date(moment.scheduledAt).toLocaleString()}</span></p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>PWA: <span className="font-medium text-foreground">{moment.publishToPwa ? 'Yes' : 'No'}</span></p>
            <p>WhatsApp: <span className="font-medium text-foreground">{moment.publishToWhatsapp ? 'Yes' : 'No'}</span></p>
            {moment.pwaLink && <p>Link: <a href={moment.pwaLink} className="text-primary underline truncate">{moment.pwaLink}</a></p>}
            {moment.sponsor && <p>Sponsor: <span className="font-medium text-foreground">{moment.sponsor.displayName}</span></p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Content</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{moment.content}</p>
        </CardContent>
      </Card>

      {moment.status === 'broadcasted' && (
        <p className="text-xs text-muted-foreground">This moment has been broadcasted and is immutable.</p>
      )}
    </div>
  );
}
