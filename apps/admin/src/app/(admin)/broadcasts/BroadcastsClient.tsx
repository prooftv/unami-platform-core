'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BroadcastWithMoment, PaginatedResponse } from '@moments/api';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending: 'outline', processing: 'secondary', completed: 'default', failed: 'destructive',
};

interface Props {
  initialData: PaginatedResponse<BroadcastWithMoment> | null;
  currentPage: number;
}

export function BroadcastsClient({ initialData, currentPage }: Props) {
  const router = useRouter();
  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Broadcasts</h1>
        <p className="text-sm text-muted-foreground">WhatsApp delivery history — recipient reach, success rates, and failed sends</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Moment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Delivered</TableHead>
            <TableHead>Started</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(initialData?.data ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No broadcasts yet.</TableCell>
            </TableRow>
          ) : (initialData?.data ?? []).map((b) => {
            const rate = b.recipientCount > 0 ? Math.round((b.successCount / b.recipientCount) * 100) : 0;
            return (
              <TableRow key={b.id}>
                <TableCell>
                  <p className="font-medium text-sm">{b.moment.title}</p>
                  <p className="text-xs text-muted-foreground">{b.moment.region} · {b.moment.category}</p>
                </TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge></TableCell>
                <TableCell><span className="text-sm">{b.recipientCount.toLocaleString()}</span></TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{b.successCount.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1">({rate}%)</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{new Date(b.broadcastStartedAt).toLocaleString()}</span>
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
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => router.push(`/broadcasts?page=${currentPage - 1}`)}>Previous</Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => router.push(`/broadcasts?page=${currentPage + 1}`)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
