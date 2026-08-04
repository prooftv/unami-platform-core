'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { GovernanceNotice, PaginatedResponse } from '@unami/api';
import {
  NoticeType,
  NoticeStatus,
  NOTICE_TYPE_LABELS,
  STATUTORY_NOTICE_TYPES,
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

interface Props {
  initialData: PaginatedResponse<GovernanceNotice> | null;
  currentPage: number;
  currentStatus: string;
  currentType: string;
}

export function NoticesClient({ initialData, currentPage, currentStatus, currentType }: Props) {
  const router = useRouter();

  const rows = initialData?.data ?? [];
  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  function buildUrl(overrides: { page?: number; status?: string; type?: string }) {
    const params = new URLSearchParams();
    const p = overrides.page ?? currentPage;
    const s = overrides.status !== undefined ? overrides.status : currentStatus;
    const t = overrides.type !== undefined ? overrides.type : currentType;
    if (p > 1) params.set('page', String(p));
    if (s && s !== 'all') params.set('status', s);
    if (t && t !== 'all') params.set('type', t);
    const qs = params.toString();
    return `/notices${qs ? '?' + qs : ''}`;
  }

  const handleStatusChange = useCallback((value: string) => {
    router.push(buildUrl({ status: value, page: 1 }));
  }, [currentType, router]);

  const handleTypeChange = useCallback((value: string) => {
    router.push(buildUrl({ type: value, page: 1 }));
  }, [currentStatus, router]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notices"
        description="Community and statutory notices — the origin point of the governance chain"
        actions={
          <Button size="sm" onClick={() => router.push('/notices/new')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Notice
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <Select value={currentStatus || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-8 w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(NoticeStatus).map((s) => (
              <SelectItem key={s} value={s}>{NOTICE_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentType || 'all'} onValueChange={handleTypeChange}>
          <SelectTrigger className="h-8 w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.values(NoticeType).map((t) => (
              <SelectItem key={t} value={t}>{NOTICE_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Comment Deadline</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No notices found.
              </TableCell>
            </TableRow>
          ) : rows.map((n) => {
            const isStatutory = STATUTORY_NOTICE_TYPES.includes(n.type as typeof STATUTORY_NOTICE_TYPES[number]);
            return (
              <TableRow
                key={n.id}
                className="cursor-pointer"
                onClick={() => router.push(`/notices/${n.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {isStatutory && (
                      <Badge variant="secondary" className="text-xs">Statutory</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{n.content.slice(0, 80)}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{NOTICE_TYPE_LABELS[n.type as keyof typeof NOTICE_TYPE_LABELS] ?? n.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[n.status] ?? 'outline'}>
                    {NOTICE_STATUS_LABELS[n.status] ?? n.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {n.commentDeadline ? (
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.commentDeadline).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1}
              onClick={() => router.push(buildUrl({ page: currentPage - 1 }))}>
              Previous
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages}
              onClick={() => router.push(buildUrl({ page: currentPage + 1 }))}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
