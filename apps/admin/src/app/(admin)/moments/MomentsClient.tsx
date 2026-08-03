'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BulkActionBar } from '@unami/ui';
import type { MomentWithSponsor, PaginatedResponse, AdminSession } from '@unami/api';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { MomentStatus } from '@/domain/moments';
import { PlusCircle, XCircle } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  draft: 'outline', scheduled: 'secondary', broadcasted: 'default', cancelled: 'destructive',
};

interface Props {
  initialData: PaginatedResponse<MomentWithSponsor> | null;
  session: AdminSession;
  currentPage: number;
  currentStatus: string;
  currentSearch: string;
}

export function MomentsClient({ initialData, session, currentPage, currentStatus, currentSearch }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [bulkPending, setBulkPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const rows = initialData?.data ?? [];
  // Only draft/scheduled are cancellable — broadcasted is immutable (D-006)
  const cancellableRows = rows.filter((m) => m.status === 'draft' || m.status === 'scheduled');

  const { selected, toggle, toggleAll, clear, selectedCount } = useBulkSelection<MomentWithSponsor>((m) => m.id);
  // Constrain selection to only cancellable rows
  const cancellableSelected = Array.from(selected).filter((id) =>
    cancellableRows.some((m) => m.id === id)
  );

  const canCreate = session.role === 'superadmin' || session.role === 'content_admin';
  const canBulkCancel = session.role === 'superadmin' || session.role === 'content_admin';

  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  function buildUrl(overrides: { page?: number; status?: string; search?: string }) {
    const params = new URLSearchParams();
    const p = overrides.page ?? currentPage;
    const s = overrides.status !== undefined ? overrides.status : currentStatus;
    const q = overrides.search !== undefined ? overrides.search : currentSearch;
    if (p > 1) params.set('page', String(p));
    if (s && s !== 'all') params.set('status', s);
    if (q) params.set('search', q);
    const qs = params.toString();
    return `/moments${qs ? '?' + qs : ''}`;
  }

  const handleStatusChange = useCallback((value: string) => {
    clear();
    router.push(buildUrl({ status: value, page: 1 }));
  }, [currentSearch, router]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    clear();
    router.push(buildUrl({ search, page: 1 }));
  }, [search, currentStatus, router]);

  async function bulkCancel() {
    if (cancellableSelected.length === 0) return;
    setBulkPending(true);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      const results = await Promise.allSettled(cancellableSelected.map((id) => api.moments.cancel(id)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      setFeedback(
        failed === 0
          ? `${cancellableSelected.length} moment${cancellableSelected.length > 1 ? 's' : ''} cancelled`
          : `${cancellableSelected.length - failed} cancelled, ${failed} failed`
      );
      clear();
      router.refresh();
    } finally {
      setBulkPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Moments</h1>
          <p className="text-sm text-muted-foreground">Draft, schedule, and publish community moments for WhatsApp broadcast</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => router.push('/moments/new')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Moment
          </Button>
        )}
      </div>

      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}

      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <Input
          placeholder="Search moments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-64"
        />
        <Button type="submit" variant="outline" size="sm">Search</Button>
        <Select value={currentStatus || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-8 w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(MomentStatus).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            {canBulkCancel && (
              <TableHead className="w-10 pr-0">
                <input
                  type="checkbox"
                  checked={cancellableRows.length > 0 && cancellableRows.every((m) => selected.has(m.id))}
                  ref={(el) => {
                    if (el) el.indeterminate = cancellableRows.some((m) => selected.has(m.id)) && !cancellableRows.every((m) => selected.has(m.id));
                  }}
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
              <TableCell colSpan={canBulkCancel ? 6 : 5} className="text-center text-muted-foreground py-8">
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
                {canBulkCancel && (
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
                    ) : (
                      // broadcasted/cancelled — not selectable, show empty cell
                      <span className="block h-4 w-4" />
                    )}
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

      {canBulkCancel && (
        <BulkActionBar
          selectedCount={cancellableSelected.length}
          entityLabel="moment"
          onClear={clear}
          actions={[
            {
              label: bulkPending ? 'Cancelling...' : 'Cancel selected',
              icon: <XCircle className="h-3.5 w-3.5" />,
              onClick: bulkCancel,
              disabled: bulkPending,
              variant: 'destructive',
            },
          ]}
        />
      )}
    </div>
  );
}
