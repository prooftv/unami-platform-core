'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@unami/ui';
import { Send, Pencil, XCircle } from 'lucide-react';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import type { MomentWithSponsor, AdminSession, BroadcastWithMoment } from '@unami/api';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  draft: 'outline', scheduled: 'secondary', broadcasted: 'default', cancelled: 'destructive',
};

const BROADCAST_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending: 'outline', processing: 'secondary', completed: 'default', failed: 'destructive',
};

interface Props {
  moment: MomentWithSponsor;
  session: AdminSession;
  broadcasts: BroadcastWithMoment[];
  stats: { viewCount: number; commentCount: number; shareCount: number; reactionCount: number; updatedAt: string } | null;
}

export function MomentDetailClient({ moment, session, broadcasts, stats }: Props) {
  const router = useRouter();
  const [broadcasting, setBroadcasting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canEdit = (session.role === 'superadmin' || session.role === 'content_admin') && (moment.status === 'draft' || moment.status === 'scheduled');
  const canBroadcast = (session.role === 'superadmin' || session.role === 'content_admin') && (moment.status === 'draft' || moment.status === 'scheduled');
  const canCancel = (session.role === 'superadmin' || session.role === 'content_admin') && (moment.status === 'draft' || moment.status === 'scheduled');

  async function handleBroadcast() {
    if (!confirm(`Broadcast "${moment.title}" to subscribers? This cannot be undone.`)) return;
    setBroadcasting(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      const res = await api.broadcasts.trigger(moment.id);
      setFeedback(`Broadcast complete — ${res.successCount} of ${res.recipientCount} delivered`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  }

  async function handleCancel() {
    if (!confirm(`Cancel "${moment.title}"? This cannot be undone.`)) return;
    setCancelling(true);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      await api.moments.cancel(moment.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={moment.title}
        description={`${moment.region} · ${moment.category} · ${moment.language}`}
        actions={
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/moments/${moment.id}/edit`)}>
                <Pencil className="h-4 w-4 mr-2" />Edit
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling}>
                <XCircle className="h-4 w-4 mr-2" />{cancelling ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}
            {canBroadcast && (
              <Button size="sm" onClick={handleBroadcast} disabled={broadcasting}>
                <Send className="h-4 w-4 mr-2" />{broadcasting ? 'Broadcasting...' : 'Broadcast'}
              </Button>
            )}
          </div>
        }
      />

      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="max-w-3xl space-y-6">
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

        {stats && (
          <Card>
            <CardHeader><CardTitle>Engagement</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                {([
                  { label: 'Views', value: stats.viewCount },
                  { label: 'Comments', value: stats.commentCount },
                  { label: 'Shares', value: stats.shareCount },
                  { label: 'Reactions', value: stats.reactionCount },
                ] as const).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {broadcasts.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Broadcast History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcasts.map((b) => {
                    const rate = b.recipientCount > 0 ? Math.round((b.successCount / b.recipientCount) * 100) : 0;
                    return (
                      <TableRow key={b.id}>
                        <TableCell><Badge variant={BROADCAST_VARIANT[b.status]}>{b.status}</Badge></TableCell>
                        <TableCell className="text-sm">{b.recipientCount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{b.successCount.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">({rate}%)</span>
                        </TableCell>
                        <TableCell className="text-sm">{b.failureCount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(b.broadcastStartedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {moment.status === 'broadcasted' && (
          <p className="text-xs text-muted-foreground">This moment has been broadcasted and is immutable.</p>
        )}
      </div>
    </div>
  );
}
