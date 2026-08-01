'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MomentWithSponsor, PaginatedResponse, AdminSession } from '@moments/api';
import { MomentStatus } from '@moments/shared';
import { PlusCircle } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  draft: 'outline', scheduled: 'secondary', broadcasted: 'default', cancelled: 'destructive',
};

interface Props {
  initialData: PaginatedResponse<MomentWithSponsor> | null;
  session: AdminSession;
  currentPage: number;
}

export function MomentsClient({ initialData, session, currentPage }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const canCreate = session.role === 'superadmin' || session.role === 'content_admin';

  const rows = (initialData?.data ?? []).filter((m) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

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

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search moments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-64"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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
      </div>

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
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No moments yet. Create your first moment.
              </TableCell>
            </TableRow>
          ) : rows.map((m) => (
            <TableRow key={m.id} className="cursor-pointer" onClick={() => router.push(`/moments/${m.id}`)}>
              <TableCell>
                <p className="font-medium text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.region} · {m.category}</p>
              </TableCell>
              <TableCell><Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge></TableCell>
              <TableCell><Badge variant="outline">{m.urgencyLevel}</Badge></TableCell>
              <TableCell>
                {m.sponsor
                  ? <span className="text-sm">{m.sponsor.displayName}</span>
                  : <span className="text-xs text-muted-foreground">—</span>}
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
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => router.push(`/moments?page=${currentPage - 1}`)}>Previous</Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => router.push(`/moments?page=${currentPage + 1}`)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
