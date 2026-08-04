'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GitBranch } from 'lucide-react';
import { PageHeader } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createApiClient } from '@unami/api';
import type { GovernanceNotice, GovernanceRecord, AdminSession } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import {
  NOTICE_TYPE_LABELS,
  STATUTORY_NOTICE_TYPES,
  RECORD_TYPE_LABELS,
  RECORD_STATUS_LABELS,
} from '@/domain/umkhandlu';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  draft: 'outline',
  published: 'secondary',
  open: 'default',
  closed: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  withdrawn: 'outline',
  archived: 'outline',
};

const NOTICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  open: 'Open',
  closed: 'Closed',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  archived: 'Archived',
};

// Valid transitions per current status
// Rule: only statutory notices may enter 'open'; enforced in UI by checking isStatutory
const TRANSITIONS: Record<string, string[]> = {
  draft: ['published', 'withdrawn'],
  published: ['open', 'closed', 'archived'],
  open: ['closed'],
  closed: ['approved', 'rejected'],
  approved: [],
  rejected: [],
  withdrawn: [],
  archived: [],
};

interface Props {
  notice: GovernanceNotice;
  linkedRecords: GovernanceRecord[];
  session: AdminSession;
}

export function NoticeDetailClient({ notice, linkedRecords, session }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  const isStatutory = STATUTORY_NOTICE_TYPES.includes(notice.type as typeof STATUTORY_NOTICE_TYPES[number]);
  const typeLabel = NOTICE_TYPE_LABELS[notice.type as keyof typeof NOTICE_TYPE_LABELS] ?? notice.type;

  const canTransition = (session.role === 'superadmin' || session.role === 'content_admin')
    && TRANSITIONS[notice.status]?.length > 0;

  // Filter out 'open' for community notices
  const availableTransitions = (TRANSITIONS[notice.status] ?? []).filter((s) => {
    if (s === 'open' && !isStatutory) return false;
    if (s === 'open' && isStatutory && !notice.commentDeadline) return false;
    return true;
  });

  async function handleStatusTransition() {
    if (!newStatus) return;
    setError(null);
    startTransition(async () => {
      try {
        const token = await getToken();
        const api = createApiClient({
          baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1',
          token,
        });
        await api.notices.update(notice.id, {
          status: newStatus as import('@unami/api').GovernanceNoticeStatus,
        });
        router.refresh();
        setNewStatus('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Status update failed');
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={notice.title}
        description={typeLabel}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/notices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="max-w-3xl space-y-6">
        {/* Status + metadata */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[notice.status] ?? 'outline'}>
                  {NOTICE_STATUS_LABELS[notice.status] ?? notice.status}
                </Badge>
                {isStatutory && <Badge variant="secondary">Statutory</Badge>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Created: {new Date(notice.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">By: {notice.createdBy}</p>
              {notice.commentsReceived > 0 && (
                <p className="text-xs text-muted-foreground">
                  Comments received: {notice.commentsReceived}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statutory information */}
        {isStatutory && (
          <Card>
            <CardHeader><CardTitle>Statutory Information</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Comment Deadline</p>
                  <p className="text-sm">
                    {notice.commentDeadline
                      ? new Date(notice.commentDeadline).toLocaleDateString()
                      : <span className="text-muted-foreground">Not set</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Participation Window</p>
                  <p className="text-sm text-muted-foreground">
                    {notice.status === 'open' ? 'Active' : notice.status === 'closed' ? 'Closed' : 'Not yet open'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notice content */}
        <Card>
          <CardHeader><CardTitle>Notice Content</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
          </CardContent>
        </Card>

        {/* Notice → Record lineage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Linked Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {linkedRecords.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No records have been produced from this notice yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {linkedRecords.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-start gap-3 cursor-pointer hover:underline"
                    onClick={() => router.push(`/records/${r.id}`)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {RECORD_TYPE_LABELS[r.type as keyof typeof RECORD_TYPE_LABELS] ?? r.type}
                        {' · '}
                        {RECORD_STATUS_LABELS[r.status as keyof typeof RECORD_STATUS_LABELS] ?? r.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Status transition */}
        {canTransition && availableTransitions.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Status Transition</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {isStatutory && !notice.commentDeadline && (
                <p className="text-xs text-destructive">
                  A statutory notice cannot be opened without a comment deadline.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Status transitions are governance decisions. They are permanent.
              </p>
              <div className="flex items-center gap-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select new status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTransitions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {NOTICE_STATUS_LABELS[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!newStatus || isPending}
                  onClick={handleStatusTransition}
                >
                  {isPending ? 'Updating...' : 'Apply'}
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
