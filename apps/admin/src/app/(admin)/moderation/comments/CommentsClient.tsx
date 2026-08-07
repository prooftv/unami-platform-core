'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle } from 'lucide-react';
import { createApiClient } from '@unami/api';
import { createClient } from '@/lib/supabase/client';
import type { AdminSession } from '@unami/api';
import type { Comment } from '@unami/api';
import type { PaginatedResponse } from '@unami/api';
import { ModerationStatus } from '@unami/shared';

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending: 'secondary', approved: 'default', flagged: 'destructive', rejected: 'destructive',
};

interface Props {
  initialData: PaginatedResponse<Comment> | null;
  session: AdminSession;
  currentPage: number;
  currentStatus: string;
}

export function CommentsClient({ initialData, session, currentPage, currentStatus }: Props) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const canAct = session.role !== 'viewer';
  const total = initialData?.pagination.total ?? 0;
  const totalPages = Math.ceil(total / (initialData?.pagination.limit ?? 20));

  function buildUrl(overrides: { page?: number; status?: string }) {
    const params = new URLSearchParams();
    const p = overrides.page ?? currentPage;
    const s = overrides.status !== undefined ? overrides.status : currentStatus;
    if (p > 1) params.set('page', String(p));
    if (s && s !== 'all') params.set('status', s);
    const qs = params.toString();
    return `/moderation/comments${qs ? '?' + qs : ''}`;
  }

  async function act(id: string, action: 'approve' | 'reject') {
    setActing(id);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      if (action === 'approve') await api.moderation.approveComment(id);
      else await api.moderation.rejectComment(id);
      setFeedback({ id, msg: `Comment ${action}d`, ok: true });
      router.refresh();
    } catch (e) {
      setFeedback({ id, msg: e instanceof Error ? e.message : 'Action failed', ok: false });
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Comments</h1>
          <p className="text-sm text-muted-foreground">Community comments from WhatsApp replies — pending moderation</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/moderation')}>Back to Moderation</Button>
      </div>

      <div className="flex items-center gap-2">
        <Select value={currentStatus || 'all'} onValueChange={(v) => router.push(buildUrl({ status: v, page: 1 }))}>
          <SelectTrigger className="h-8 w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(ModerationStatus).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>{feedback.msg}</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>Moment</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            {canAct && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {(initialData?.data ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={canAct ? 6 : 5} className="text-center text-muted-foreground py-8">No comments found.</TableCell>
            </TableRow>
          ) : (initialData?.data ?? []).map((c) => (
            <TableRow key={c.id}>
              <TableCell><span className="font-mono text-xs">{c.fromNumber}</span></TableCell>
              <TableCell><span className="text-xs text-muted-foreground">{(c.moment as { title: string } | null)?.title ?? '—'}</span></TableCell>
              <TableCell><p className="text-sm truncate max-w-xs">{c.content}</p></TableCell>
              <TableCell><Badge variant={STATUS_VARIANT[c.moderationStatus]}>{c.moderationStatus}</Badge></TableCell>
              <TableCell><span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span></TableCell>
              {canAct && (
                <TableCell>
                  {c.moderationStatus === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-green-600 border-green-600 hover:bg-green-50" onClick={() => act(c.id, 'approve')} disabled={acting === c.id}>
                        <CheckCircle className="h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive border-destructive hover:bg-red-50" onClick={() => act(c.id, 'reject')} disabled={acting === c.id}>
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => router.push(buildUrl({ page: currentPage - 1 }))}>Previous</Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => router.push(buildUrl({ page: currentPage + 1 }))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
