'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { GovernanceRecord, PaginatedResponse, AdminSession } from '@unami/api';
import { RECORD_TYPE_LABELS, RECORD_STATUS_LABELS, RecordStatus, RecordType } from '@/domain/umkhandlu';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending: 'outline',
  adopted: 'default',
  approved: 'default',
  resolved: 'secondary',
  rejected: 'destructive',
};

interface Props {
  initialData: PaginatedResponse<GovernanceRecord> | null;
  session: AdminSession;
  currentPage: number;
  currentStatus: string;
  currentType: string;
}

export function RecordsClient({ initialData, session, currentPage, currentStatus, currentType }: Props) {
  const router = useRouter();

  const rows = initialData?.data ?? [];
  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  const canCreate = session.role === 'superadmin' || session.role === 'content_admin';

  function buildUrl(overrides: { page?: number; status?: string; type?: string }) {
    const params = new URLSearchParams();
    const p = overrides.page ?? currentPage;
    const s = overrides.status !== undefined ? overrides.status : currentStatus;
    const t = overrides.type !== undefined ? overrides.type : currentType;
    if (p > 1) params.set('page', String(p));
    if (s && s !== 'all') params.set('status', s);
    if (t && t !== 'all') params.set('type', t);
    const qs = params.toString();
    return `/records${qs ? '?' + qs : ''}`;
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
        title="Governance Records"
        description="Institutional memory — minutes, resolutions, decisions, and outcomes"
        actions={
          canCreate ? (
            <Button size="sm" onClick={() => router.push('/records/new')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Record
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2">
        <Select value={currentStatus || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-8 w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(RecordStatus).map((s) => (
              <SelectItem key={s} value={s}>{RECORD_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentType || 'all'} onValueChange={handleTypeChange}>
          <SelectTrigger className="h-8 w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.values(RecordType).map((t) => (
              <SelectItem key={t} value={t}>{RECORD_TYPE_LABELS[t]}</SelectItem>
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
            <TableHead>Lineage</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No records found.
              </TableCell>
            </TableRow>
          ) : rows.map((r) => (
            <TableRow
              key={r.id}
              className="cursor-pointer"
              onClick={() => router.push(`/records/${r.id}`)}
            >
              <TableCell>
                <p className="font-medium text-sm">{r.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{r.content.slice(0, 80)}</p>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{RECORD_TYPE_LABELS[r.type as keyof typeof RECORD_TYPE_LABELS] ?? r.type}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[r.status] ?? 'outline'}>
                  {RECORD_STATUS_LABELS[r.status as keyof typeof RECORD_STATUS_LABELS] ?? r.status}
                </Badge>
              </TableCell>
              <TableCell>
                {r.parentRecordId ? (
                  <span className="text-xs text-muted-foreground">Has parent</span>
                ) : r.originNoticeId ? (
                  <span className="text-xs text-muted-foreground">From notice</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Root</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </TableCell>
            </TableRow>
          ))}
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
