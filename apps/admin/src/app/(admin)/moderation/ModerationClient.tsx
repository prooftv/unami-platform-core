'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Message, Advisory, PaginatedResponse, AdminSession } from '@moments/api';
import type { ModerationStats } from '@moments/api';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';

async function getToken() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

interface Props {
  messages: PaginatedResponse<Message> | null;
  advisories: PaginatedResponse<Advisory> | null;
  stats: ModerationStats | null;
  session: AdminSession;
}

export function ModerationClient({ messages, advisories, stats, session }: Props) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const canAct = session.role !== 'viewer';

  async function act(messageId: string, action: 'approve' | 'reject') {
    setActing(messageId);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      if (action === 'approve') await api.moderation.approve(messageId);
      else await api.moderation.reject(messageId);
      setFeedback({ id: messageId, msg: `Message ${action}d`, ok: true });
      router.refresh();
    } catch (e) {
      setFeedback({ id: messageId, msg: e instanceof Error ? e.message : 'Action failed', ok: false });
    } finally {
      setActing(null);
    }
  }

  const kpis = [
    { title: 'Pending', value: stats?.pendingMessages ?? '—', description: 'Awaiting review', icon: ShieldAlert },
    { title: 'Escalated', value: stats?.escalatedAdvisories ?? '—', description: 'High confidence flags', icon: AlertTriangle },
    { title: 'Approved Today', value: stats?.approvedToday ?? '—', description: 'Approved today', icon: CheckCircle },
    { title: 'Oldest Pending', value: stats?.oldestPendingAge != null ? `${stats.oldestPendingAge}m` : '—', description: 'Minutes ago', icon: Clock },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Moderation</h1>
          <p className="text-sm text-muted-foreground">Inbound WhatsApp messages and AI advisory flags awaiting community review</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/moderation/comments')}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Comments
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(({ title, value, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>{feedback.msg}</p>
      )}

      {(advisories?.data ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Escalated Advisories</CardTitle>
              <Badge variant="destructive">{advisories!.data.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {advisories!.data.map((a) => (
              <div key={a.id} className="flex items-start justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0">
                <div className="space-y-0.5">
                  <p className="font-medium">{a.advisoryType} — confidence {(a.confidence * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Urgency: {a.urgencyLevel}</p>
                </div>
                <Badge variant="destructive">Escalated</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-medium mb-3">Pending Messages</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Received</TableHead>
              {canAct && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(messages?.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={canAct ? 5 : 4} className="text-center text-muted-foreground py-8">No pending messages.</TableCell>
              </TableRow>
            ) : (messages?.data ?? []).map((m) => (
              <TableRow key={m.id} className="cursor-pointer" onClick={() => router.push(`/moderation/messages/${m.id}`)}>
                <TableCell><span className="font-mono text-sm">{m.fromNumber}</span></TableCell>
                <TableCell><Badge variant="outline">{m.messageType}</Badge></TableCell>
                <TableCell><p className="text-sm truncate max-w-xs">{m.content ?? '(media)'}</p></TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{new Date(m.timestamp).toLocaleString()}</span></TableCell>
                {canAct && (
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); act(m.id, 'approve'); }} disabled={acting === m.id} className="inline-flex items-center gap-1 rounded-md border border-green-600 px-2 py-1 text-xs text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors">
                        <CheckCircle className="h-3 w-3" /> Approve
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); act(m.id, 'reject'); }} disabled={acting === m.id} className="inline-flex items-center gap-1 rounded-md border border-destructive px-2 py-1 text-xs text-destructive hover:bg-red-50 disabled:opacity-50 transition-colors">
                        <XCircle className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
