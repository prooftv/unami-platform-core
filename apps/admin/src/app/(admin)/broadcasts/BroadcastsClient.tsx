'use client';

import { PageHeader, DataTable, Badge, TablePagination } from '@moments/ui';
import type { ColumnDef } from '@moments/ui';
import type { BroadcastWithMoment, PaginatedResponse } from '@moments/api';
import { useRouter } from 'next/navigation';

const STATUS_VARIANT: Record<string, 'outline' | 'warning' | 'success' | 'destructive'> = {
  pending: 'outline', processing: 'warning', completed: 'success', failed: 'destructive',
};

interface Props {
  initialData: PaginatedResponse<BroadcastWithMoment> | null;
  currentPage: number;
}

export function BroadcastsClient({ initialData, currentPage }: Props) {
  const router = useRouter();

  function handlePageChange(page: number) {
    router.push(`/broadcasts?page=${page}`);
  }
  const columns: ColumnDef<BroadcastWithMoment>[] = [
    {
      key: 'moment',
      header: 'Moment',
      cell: (b) => (
        <div>
          <p className="font-medium text-sm">{b.moment.title}</p>
          <p className="text-xs text-muted-foreground">{b.moment.region} · {b.moment.category}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>,
    },
    {
      key: 'recipients',
      header: 'Recipients',
      cell: (b) => <span className="text-sm">{b.recipientCount.toLocaleString()}</span>,
    },
    {
      key: 'delivered',
      header: 'Delivered',
      cell: (b) => {
        const rate = b.recipientCount > 0
          ? Math.round((b.successCount / b.recipientCount) * 100)
          : 0;
        return (
          <div>
            <span className="text-sm font-medium">{b.successCount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground ml-1">({rate}%)</span>
          </div>
        );
      },
    },
    {
      key: 'started',
      header: 'Started',
      cell: (b) => (
        <span className="text-xs text-muted-foreground">
          {new Date(b.broadcastStartedAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Broadcasts"
        description="Delivery history for all broadcasted moments"
      />

      <DataTable
        columns={columns}
        data={initialData?.data ?? []}
        getRowKey={(b) => b.id}
        emptyMessage="No broadcasts yet."
      />

      {initialData && (
        <TablePagination
          page={currentPage}
          pageSize={initialData.pagination.limit}
          total={initialData.pagination.total}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
