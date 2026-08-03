'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MomentWithSponsor, PaginatedResponse, AdminSession } from '@moments/api';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';
import { MomentStatus } from '@moments/shared';
import { PlusCircle, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  draft: 'outline', scheduled: 'secondary', broadcasted: 'default', cancelled: 'destructive',
};

async function getToken() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

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
  const [bulkActing, setBulkActing] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  const canCreate = session.role === 'superadmin' || session.role === 'content_admin';
  const canBulkCancel = session.role === 'superadmin' || session.role === 'content_admin';

  const cancellable = (initialData?.data ?? []).filter(
    (m) => m.status === 'draft' || m.status === 'scheduled'
  );

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
    router.push(buildUrl({ status: value, page: 1 }));
  }, [currentSearch, router]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ search, page: 1 }));
  }, [search, currentStatus, router]);

  async function cancelAll() {
    if (cancellable.length === 0) return;
    if (!confirm(`Cancel all ${cancellable.length} draft/scheduled moments on this page?`)) return;
    setBulkActing(true);
    setBulkFeedback(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      const results = await Promise.allSettled(cancellable.map((m) => api.moments.cancel(m.id)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      setBulkFeedback(
        failed === 0
          ? `All ${cancellable.length} moments cancelled`
          : `${cancellable.length - failed} cancelled, ${failed} failed`
      );
      router.refresh();
    } finally {
      setBulkActing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Moments</h1>
          <p className="text-sm text-muted-foreground">Draft, schedule, and publish community moments for WhatsApp broadcast</p>
        </div>
        <div className="flex items-center gap-2">
          {canBulkCancel && cancellable.length > 0 && (
            <Button variant="outline" size="sm" onClick={cancelAll} disabled={bulkActing}>
              <XCircle className="h-4 w-4 mr-2" />
              {bulkActing ? 'Cancelling...' : `Cancel drafts (${cancellable.length})`}
            </Button>
          )}
          {canCreate && (
            <Button size="sm" onClick={() => router.push('/moments/new')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Moment
            </Button>
          )}
        </div>
      </div>

      {bulkFeedback && (
        <p className="text-sm text-muted-foreground">{bulkFeedback}</p>
      )}

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
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Urgency</TableHead>
            <TableHead>Sponsor</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(initialData?.data ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No moments found.
              </TableCell>
            </TableRow>
          ) : (initialData?.data ?? []).map((m) => (
            <TableRow key={m.id} className="cursor-pointer" onClick={() => router.push(`/moments/${m.id}`)}>
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
