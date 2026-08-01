'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';
import type { AdminSession } from '@moments/api';
import type { MessageWithAdvisories } from '@moments/api';

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending: 'secondary', approved: 'default', flagged: 'destructive', rejected: 'destructive',
};

interface Props {
  message: MessageWithAdvisories;
  session: AdminSession;
}

export function MessageDetailClient({ message, session }: Props) {
  const router = useRouter();
  const [acting, setActing] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const canAct = session.role !== 'viewer' && message.moderationStatus === 'pending';

  async function act(action: 'approve' | 'reject') {
    setActing(true);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      if (action === 'approve') await api.moderation.approve(message.id);
      else await api.moderation.reject(message.id);
      setFeedback({ msg: `Message ${action}d`, ok: true });
      router.refresh();
    } catch (e) {
      setFeedback({ msg: e instanceof Error ? e.message : 'Action failed', ok: false });
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/moderation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Message</h1>
            <p className="text-sm text-muted-foreground font-mono">{message.fromNumber}</p>
          </div>
        </div>
        {canAct && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => act('approve')} disabled={acting}>
              <CheckCircle className="h-4 w-4 mr-2" />Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => act('reject')} disabled={acting}>
              <XCircle className="h-4 w-4 mr-2" />Reject
            </Button>
          </div>
        )}
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>{feedback.msg}</p>
      )}

      <Card>
        <CardHeader><CardTitle>Message</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[message.moderationStatus]}>{message.moderationStatus}</Badge>
            <Badge variant="outline">{message.messageType}</Badge>
          </div>
          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
          {!message.content && <p className="text-muted-foreground italic">(media message)</p>}
          <p className="text-xs text-muted-foreground">{new Date(message.timestamp).toLocaleString()}</p>
        </CardContent>
      </Card>

      {message.advisories.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>AI Advisories</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {message.advisories.map((a) => (
              <div key={a.id} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{a.advisoryType}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <Badge variant={a.confidence > 0.7 ? 'destructive' : a.confidence > 0.4 ? 'secondary' : 'outline'}>
                      {(a.confidence * 100).toFixed(0)}%
                    </Badge>
                    {a.escalationSuggested && <Badge variant="destructive">Escalated</Badge>}
                  </div>
                </div>
                {a.harmSignals && (
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    {Object.entries(a.harmSignals).map(([k, v]) => (
                      <span key={k} className={v ? 'text-destructive font-medium' : ''}>
                        {k.replace(/([A-Z])/g, ' $1').toLowerCase()}: {v ? 'yes' : 'no'}
                      </span>
                    ))}
                  </div>
                )}
                {a.spamIndicators && (
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    {Object.entries(a.spamIndicators).map(([k, v]) => (
                      <span key={k} className={v ? 'text-destructive font-medium' : ''}>
                        {k.replace(/([A-Z])/g, ' $1').toLowerCase()}: {v ? 'yes' : 'no'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
