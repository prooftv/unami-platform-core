'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader, DataTable, TableToolbar, TablePagination,
  Badge, Button, FilterSelect,
} from '@moments/ui';
import type { ColumnDef } from '@moments/ui';
import type { MomentWithSponsor, PaginatedResponse, AdminSession } from '@moments/api';
import { MomentStatus } from '@moments/shared';
import { PlusCircle } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'outline' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
  draft:       'outline',
  scheduled:   'warning',
  broadcasted: 'success',
  cancelled:   'destructive',
};

const URGENCY_VARIANT: Record<string, 'secondary' | 'info' | 'warning' | 'destructive'> = {
  low:    'secondary',
  medium: 'info',
  high:   'warning',
  urgent: 'destructive',
};

const STATUS_OPTIONS = Object.values(MomentStatus).map((s) => ({ value: s, label: s }));

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
    const matchStatus = !statusFilter || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handlePageChange(page: number) {
    router.push(`/moments?page=${page}`);
  }

  const columns: ColumnDef<MomentWithSponsor>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (m) => (
        <div>
          <p className="font-medium text-sm">{m.title}</p>
          <p className="text-xs text-muted-foreground">{m.region} · {m.category}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (m) => <Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge>,
    },
    {
      key: 'urgency',
      header: 'Urgency',
      cell: (m) => <Badge variant={URGENCY_VARIANT[m.urgencyLevel]}>{m.urgencyLevel}</Badge>,
    },
    {
      key: 'sponsor',
      header: 'Sponsor',
      cell: (m) => m.sponsor ? (
        <span className="text-sm">{m.sponsor.displayName}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      cell: (m) => (
        <span className="text-xs text-muted-foreground">
          {new Date(m.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Moments"
        description="Draft, schedule, and publish community moments for WhatsApp broadcast"
        actions={
          canCreate ? (
            <Button onClick={() => router.push('/moments/new')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Moment
            </Button>
          ) : undefined
        }
      />

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search moments..."
        filters={
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            placeholder="All statuses"
          />
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(m) => m.id}
        onRowClick={(m) => router.push(`/moments/${m.id}`)}
        emptyMessage="No moments yet. Create your first moment."
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
