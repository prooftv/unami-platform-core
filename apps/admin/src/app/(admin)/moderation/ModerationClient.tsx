'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BulkActionBar } from '@moments/ui';
import type { Message, Advisory, PaginatedResponse, AdminSession } from '@moments/api';
import type { ModerationStats } from '@moments/api';
import { createApiClient } from '@moments/api';
import { getToken } from '@/lib/auth/token';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface Props {
  messages: PaginatedResponse<Message> | null;
  advisories: PaginatedResponse<Advisory> | null;
  stats: ModerationStats | null;
  session: AdminSession;
}

export function ModerationClient({ messages, advisories, stats, session }: Props) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackOk, setFeedbackOk] = useState(true);
  const [bulkPending, setBulkPending] = useState(false);

  const rows = messages?.data ?? [];
  const { selected, toggle, toggleAll, clear, selectedCount } = useBulkSelection<Message>((m) => m.id);

  const canAct = session.role !== 'viewer';

  function getApi(token: string) {
    return createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
  }

  async function act(messageId: string, action: 'approve' | 'reject') {
    setActing(messageId);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = getApi(token);
      if (action === 'approve') await api.moderation.approve(messageId);
      else await api.moderation.reject(messageId);
      setFeedback(`Message ${action}d`);
      setFeedbackOk(true);
      router.refresh();
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Action failed');
      setFeedbackOk(false);
    } finally {
      setActing(null);
    }
  }

  async function bulkAct(action: 'approve' | 'reject') {
    if (selectedCount === 0) return;
    setBulkPending(true);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = getApi(token);
      const ids = Array.from(selected);
      const results = await Promise.allSettled(
        ids.map((id) => action === 'approve' ? api.moderation.approve(id) : api.moderation.reject(id))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      setFeedbackOk(failed === 0);
      setFeedback(
        failed === 0
          ? `${ids.length} message${ids.length > 1 ? 's' : ''} ${action}d`
          : `${ids.length - failed} ${action}d, ${failed} failed`
      );
      clear();
      router.refresh();
    } finally {
      setBulkPending(false);
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
        <p className={`text-sm ${feedbackOk ? 'text-muted-foreground' : 'text-destructive'}`}>{feedback}</p>
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
              <div
                key={a.id}
                className="flex items-start justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0 cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 transition-colors"
                onClick={() => router.push(`/moderation/advisories/${a.id}`)}
              >
                <div className="space-y-0.5">
                  <p className="font-medium">{a.advisoryType} &mdash; confidence {(a.confidence * 100).toFixed(0)}%</p>
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
              {canAct && (
                <TableHead className="w-10 pr-0">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every((m) => selected.has(m.id))}
                    ref={(el) => {
                      if (el) el.indeterminate = rows.some((m) => selected.has(m.id)) && !rows.every((m) => selected.has(m.id));
                    }}
                    onChange={() => toggleAll(rows)}
                    className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              <TableHead>From</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Received</TableHead>
              {canAct && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canAct ? 6 : 4} className="text-center text-muted-foreground py-8">
                  No pending messages.
                </TableCell>
              </TableRow>
            ) : rows.map((m) => (
              <TableRow
                key={m.id}
                className={`cursor-pointer ${selected.has(m.id) ? 'bg-muted/60' : ''}`}
                onClick={() => router.push(`/moderation/messages/${m.id}`)}
              >
                {canAct && (
                  <TableCell className="w-10 pr-0">
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={(e) => { e.stopPropagation(); toggle(m.id); }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                      aria-label="Select row"
                    />
                  </TableCell>
                )}
                <TableCell><span className="font-mono text-sm">{m.fromNumber}</span></TableCell>
                <TableCell><Badge variant="outline">{m.messageType}</Badge></TableCell>
                <TableCell><p className="text-sm truncate max-w-xs">{m.content ?? '(media)'}</p></TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{new Date(m.timestamp).toLocaleString()}</span></TableCell>
                {canAct && (
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); act(m.id, 'approve'); }}
                        disabled={acting === m.id || bulkPending}
                        className="inline-flex items-center gap-1 rounded-md border border-green-600 px-2 py-1 text-xs text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); act(m.id, 'reject'); }}
                        disabled={acting === m.id || bulkPending}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive px-2 py-1 text-xs text-destructive hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
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

      {canAct && (
        <BulkActionBar
          selectedCount={selectedCount}
          entityLabel="message"
          onClear={clear}
          actions={[
            {
              label: bulkPending ? 'Processing...' : 'Approve selected',
              icon: <CheckCircle className="h-3.5 w-3.5" />,
              onClick: () => bulkAct('approve'),
              disabled: bulkPending,
            },
            {
              label: bulkPending ? 'Processing...' : 'Reject selected',
              icon: <XCircle className="h-3.5 w-3.5" />,
              onClick: () => bulkAct('reject'),
              disabled: bulkPending,
              variant: 'destructive',
            },
          ]}
        />
      )}
    </div>
  );
}
