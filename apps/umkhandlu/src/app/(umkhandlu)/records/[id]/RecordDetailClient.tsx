'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GitBranch, PlusCircle } from 'lucide-react';
import { PageHeader } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createApiClient } from '@unami/api';
import type { GovernanceRecord, AdminSession } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import {
  RECORD_TYPE_LABELS,
  RECORD_STATUS_LABELS,
  RecordStatus,
} from '@/domain/umkhandlu';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending: 'outline',
  adopted: 'default',
  approved: 'default',
  resolved: 'secondary',
  rejected: 'destructive',
};

// Valid transitions per current status
const TRANSITIONS: Record<string, string[]> = {
  pending: ['adopted', 'approved', 'resolved', 'rejected'],
  adopted: [],
  approved: ['resolved'],
  resolved: [],
  rejected: [],
};

interface Props {
  record: GovernanceRecord;
  lineage: GovernanceRecord[];
  session: AdminSession;
}

export function RecordDetailClient({ record, lineage, session }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  const canTransition = (session.role === 'superadmin' || session.role === 'content_admin')
    && TRANSITIONS[record.status]?.length > 0;

  const typeLabel = RECORD_TYPE_LABELS[record.type as keyof typeof RECORD_TYPE_LABELS] ?? record.type;
  const statusLabel = RECORD_STATUS_LABELS[record.status as keyof typeof RECORD_STATUS_LABELS] ?? record.status;

  // lineage[0] is the record itself, rest are ancestors
  const ancestors = lineage.slice(1);

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
        await api.records.update(record.id, {
          status: newStatus as import('@unami/api').GovernanceRecordStatus,
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
        title={record.title}
        description={typeLabel}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/records/new`)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Child Record
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/records')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-6">
        {/* Status + metadata */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle></CardHeader>
            <CardContent>
              <Badge variant={STATUS_VARIANT[record.status] ?? 'outline'}>{statusLabel}</Badge>
              {record.approvedBy && (
                <p className="text-xs text-muted-foreground mt-2">Approved by: {record.approvedBy}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Created: {new Date(record.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                By: {record.createdBy}
              </p>
              {record.authorityId && (
                <p className="text-xs text-muted-foreground">Authority: {record.authorityId}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Card>
          <CardHeader><CardTitle>Record Content</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{record.content}</p>
          </CardContent>
        </Card>

        {/* Lineage chain */}
        {(ancestors.length > 0 || record.originNoticeId || record.parentRecordId) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Lineage Chain
              </CardTitle>
            </CardHeader>
            <CardContent>
              {record.originNoticeId && (
                <p className="text-xs text-muted-foreground mb-3">
                  Origin notice: {record.originNoticeId}
                </p>
              )}
              {ancestors.length > 0 ? (
                <ol className="space-y-2">
                  {ancestors.map((ancestor, i) => (
                    <li key={ancestor.id} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {ancestors.length - i}
                      </span>
                      <div
                        className="flex-1 cursor-pointer hover:underline"
                        onClick={() => router.push(`/records/${ancestor.id}`)}
                      >
                        <p className="text-sm font-medium">{ancestor.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {RECORD_TYPE_LABELS[ancestor.type as keyof typeof RECORD_TYPE_LABELS] ?? ancestor.type}
                          {' · '}
                          {RECORD_STATUS_LABELS[ancestor.status as keyof typeof RECORD_STATUS_LABELS] ?? ancestor.status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-muted-foreground">This is a root record — beginning of a new lineage.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status transition */}
        {canTransition && (
          <Card>
            <CardHeader><CardTitle>Status Transition</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Status transitions are governance decisions. They are permanent.
              </p>
              <div className="flex items-center gap-2">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select new status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSITIONS[record.status]?.map((s) => (
                      <SelectItem key={s} value={s}>
                        {RECORD_STATUS_LABELS[s as keyof typeof RECORD_STATUS_LABELS] ?? s}
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
