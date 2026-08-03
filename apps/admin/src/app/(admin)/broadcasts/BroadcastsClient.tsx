'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, TablePagination } from '@moments/ui';
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Broadcasts"
        description="WhatsApp delivery history — recipient reach, success rates, and failed sends"
      />

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
              <TableRow key={b.id} className="cursor-pointer" onClick={() => router.push(`/broadcasts/${b.id}`)}>
                <TableCell>
                  <p className="font-medium text-sm">{b.moment.title}</p>
                  <p className="text-xs text-muted-foreground">{b.moment.region} &middot; {b.moment.category}</p>
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

      {total > limit && (
        <TablePagination
          page={currentPage}
          pageSize={limit}
          total={total}
          onPageChange={(p) => router.push(`/broadcasts?page=${p}`)}
        />
      )}
    </div>
  );
}
