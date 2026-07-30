'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader, DataTable, TableToolbar, TablePagination,
  Badge, Button,
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

const STATUSES = Object.values(MomentStatus);

interface Props {
  initialData: PaginatedResponse<MomentWithSponsor> | null;
  session: AdminSession;
}

export function MomentsClient({ initialData, session }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const canCreate = session.role === 'superadmin' || session.role === 'content_admin';

  const rows = (initialData?.data ?? []).filter((m) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
        description="Create and manage community moments"
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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
          page={initialData.pagination.page}
          pageSize={initialData.pagination.limit}
          total={initialData.pagination.total}
          onPageChange={() => {}}
        />
      )}
    </div>
  );
}
