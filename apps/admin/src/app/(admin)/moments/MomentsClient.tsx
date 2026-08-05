'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader, TableToolbar, TablePagination, BulkActionBar } from '@unami/ui';
import type { MomentWithSponsor, PaginatedResponse, AdminSession } from '@unami/api';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { MomentStatus } from '@/domain/moments';
import { PlusCircle, XCircle } from 'lucide-react';
import { bulkCancelMomentsAction } from './_actions/moment-actions';
import { STATUS_VARIANT, buildMomentsUrl, canCreateMoment } from './_lib/moment-utils';

interface Props {
  initialData: PaginatedResponse<MomentWithSponsor> | null;
  session: AdminSession;
  currentPage: number;
  currentStatus: string;
  currentSearch: string;
}

export function MomentsClient({ initialData, session, currentPage, currentStatus, currentSearch }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const rows = initialData?.data ?? [];
  const cancellableRows = rows.filter((m) => m.status === 'draft' || m.status === 'scheduled');
  const { selected, toggle, toggleAll, clear } = useBulkSelection<MomentWithSponsor>((m) => m.id);
  const cancellableSelected = Array.from(selected).filter((id) => cancellableRows.some((m) => m.id === id));

  const total = initialData?.pagination.total ?? 0;
  const totalPages = Math.ceil(total / (initialData?.pagination.limit ?? 20));
  const canCreate = canCreateMoment(session);
  const canBulk = canCreate;

  function nav(overrides: { page?: number; status?: string; search?: string }) {
    router.push(buildMomentsUrl({ ...overrides, currentPage, currentStatus, currentSearch }));
  }

  function handleBulkCancel() {
    if (!cancellableSelected.length) return;
    startTransition(async () => {
      const { cancelled, failed } = await bulkCancelMomentsAction(cancellableSelected);
      setFeedback(failed === 0 ? `${cancelled} moment${cancelled > 1 ? 's' : ''} cancelled` : `${cancelled} cancelled, ${failed} failed`);
      clear();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Moments"
        description="Draft, schedule, and publish community moments for WhatsApp broadcast"
        actions={canCreate ? (
          <button
            onClick={() => router.push('/moments/new')}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            New Moment
          </button>
        ) : undefined}
      />

      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}

      <TableToolbar
        search={currentSearch}
        onSearchChange={(q) => nav({ search: q, page: 1 })}
        filters={
          <Select value={currentStatus || 'all'} onValueChange={(v) => { clear(); nav({ status: v, page: 1 }); }}>
            <SelectTrigger className="h-8 w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.values(MomentStatus).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            {canBulk && (
              <TableHead className="w-10 pr-0">
                <input
                  type="checkbox"
                  checked={cancellableRows.length > 0 && cancellableRows.every((m) => selected.has(m.id))}
                  ref={(el) => { if (el) el.indeterminate = cancellableRows.some((m) => selected.has(m.id)) && !cancellableRows.every((m) => selected.has(m.id)); }}
                  onChange={() => toggleAll(cancellableRows)}
                  className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                  aria-label="Select all cancellable"
                />
              </TableHead>
            )}
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Urgency</TableHead>
            <TableHead>Sponsor</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canBulk ? 6 : 5} className="text-center text-muted-foreground py-8">
                No moments found.
              </TableCell>
            </TableRow>
          ) : rows.map((m) => {
            const isCancellable = m.status === 'draft' || m.status === 'scheduled';
            const isSelected = selected.has(m.id);
            return (
              <TableRow
                key={m.id}
                className={`cursor-pointer ${isSelected ? 'bg-muted/60' : ''}`}
                onClick={() => router.push(`/moments/${m.id}`)}
              >
                {canBulk && (
                  <TableCell className="w-10 pr-0">
                    {isCancellable ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => { e.stopPropagation(); toggle(m.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                        aria-label="Select row"
                      />
                    ) : <span className="block h-4 w-4" />}
                  </TableCell>
                )}
                <TableCell>
                  <p className="font-medium text-sm">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.region} &middot; {m.category}</p>
                </TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge></TableCell>
                <TableCell><Badge variant="outline">{m.urgencyLevel}</Badge></TableCell>
                <TableCell>
                  {m.sponsor
                    ? <span className="text-sm">{m.sponsor.displayName}</span>
                    : <span className="text-xs text-muted-foreground">&mdash;</span>}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <TablePagination
        page={currentPage}
        pageSize={initialData?.pagination.limit ?? 20}
        total={total}
        onPageChange={(p) => nav({ page: p })}
      />

      {canBulk && (
        <BulkActionBar
          selectedCount={cancellableSelected.length}
          entityLabel="moment"
          onClear={clear}
          actions={[
            {
              label: isPending ? 'Cancelling...' : 'Cancel selected',
              icon: <XCircle className="h-3.5 w-3.5" />,
              onClick: handleBulkCancel,
              disabled: isPending,
              variant: 'destructive',
            },
          ]}
        />
      )}
    </div>
  );
}
