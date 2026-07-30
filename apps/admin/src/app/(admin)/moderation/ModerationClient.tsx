'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader, DataTable, Badge, KPIGrid, MetricCard,
  Card, CardContent, CardHeader, CardTitle, Button,
} from '@moments/ui';
import type { ColumnDef } from '@moments/ui';
import type { Message, Advisory, PaginatedResponse, AdminSession } from '@moments/api';
import type { ModerationStats } from '@moments/api';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

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
      const api = createApiClient({
        baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1',
        token,
      });
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

  const msgColumns: ColumnDef<Message>[] = [
    {
      key: 'from',
      header: 'From',
      cell: (m) => <span className="font-mono text-sm">{m.fromNumber}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (m) => <Badge variant="outline">{m.messageType}</Badge>,
    },
    {
      key: 'content',
      header: 'Content',
      cell: (m) => (
        <p className="text-sm truncate max-w-xs">{m.content ?? '(media)'}</p>
      ),
    },
    {
      key: 'received',
      header: 'Received',
      cell: (m) => (
        <span className="text-xs text-muted-foreground">
          {new Date(m.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (m) => canAct ? (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); act(m.id, 'approve'); }}
            disabled={acting === m.id}
            className="inline-flex items-center gap-1 rounded-md border border-green-600 px-2 py-1 text-xs text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
          >
            <CheckCircle className="h-3 w-3" /> Approve
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); act(m.id, 'reject'); }}
            disabled={acting === m.id}
            className="inline-flex items-center gap-1 rounded-md border border-destructive px-2 py-1 text-xs text-destructive hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <XCircle className="h-3 w-3" /> Reject
          </button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Moderation"
        description="Review inbound WhatsApp messages and AI advisory flags"
      />

      <KPIGrid columns={4}>
        <MetricCard title="Pending" value={stats ? stats.pendingMessages : '—'} description="Awaiting review" icon={ShieldAlert} />
        <MetricCard title="Escalated" value={stats ? stats.escalatedAdvisories : '—'} description="High confidence flags" icon={AlertTriangle} />
        <MetricCard title="Approved Today" value={stats ? stats.approvedToday : '—'} description="Approved today" icon={CheckCircle} />
        <MetricCard
          title="Oldest Pending"
          value={stats?.oldestPendingAge != null ? `${stats.oldestPendingAge}m` : '—'}
          description="Minutes ago"
          icon={Clock}
        />
      </KPIGrid>

      {feedback && (
        <p className={`text-sm ${feedback.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
          {feedback.msg}
        </p>
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
        <DataTable
          columns={msgColumns}
          data={messages?.data ?? []}
          getRowKey={(m) => m.id}
          emptyMessage="No pending messages."
        />
      </div>
    </div>
  );
}
