'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader, DataTable, TableToolbar, TablePagination,
  Badge, KPIGrid, MetricCard, FilterSelect,
} from '@moments/ui';
import type { ColumnDef } from '@moments/ui';
import type { Subscription, PaginatedResponse } from '@moments/api';
import type { SubscriberStats } from '@moments/api';
import { Region, DeliverySchedule } from '@moments/shared';
import { Users, TrendingDown, UserCheck, Calendar } from 'lucide-react';

const SCHEDULE_VARIANT: Record<string, 'outline' | 'info' | 'warning' | 'secondary'> = {
  instant: 'info', morning: 'outline', evening: 'warning', weekly: 'secondary',
};

const REGION_OPTIONS = Object.values(Region).map((r) => ({ value: r, label: r }));
const SCHEDULE_OPTIONS = Object.values(DeliverySchedule).map((s) => ({ value: s, label: s }));

interface Props {
  initialData: PaginatedResponse<Subscription> | null;
  stats: SubscriberStats | null;
  currentPage: number;
}

export function SubscribersClient({ initialData, stats, currentPage }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');

  const rows = (initialData?.data ?? []).filter((s) => {
    const matchSearch = !search || s.phoneNumber.includes(search);
    const matchRegion = !regionFilter || s.regions.includes(regionFilter as typeof REGION_OPTIONS[number]['value']);
    const matchSchedule = !scheduleFilter || s.deliverySchedule === scheduleFilter;
    return matchSearch && matchRegion && matchSchedule;
  });

  function handlePageChange(page: number) {
    router.push(`/subscribers?page=${page}`);
  }

  const columns: ColumnDef<Subscription>[] = [
    {
      key: 'phone',
      header: 'Subscriber',
      cell: (s) => (
        <span className="font-mono text-sm">{s.phoneNumber}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => (
        <Badge variant={s.optedIn ? 'success' : 'destructive'}>
          {s.optedIn ? 'Opted in' : 'Opted out'}
        </Badge>
      ),
    },
    {
      key: 'schedule',
      header: 'Schedule',
      cell: (s) => (
        <Badge variant={SCHEDULE_VARIANT[s.deliverySchedule]}>{s.deliverySchedule}</Badge>
      ),
    },
    {
      key: 'regions',
      header: 'Regions',
      cell: (s) => (
        <span className="text-xs text-muted-foreground">{s.regions.join(', ')}</span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      cell: (s) => (
        <span className="text-xs text-muted-foreground">
          {new Date(s.optedInAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Subscribers"
        description="WhatsApp subscribers who have opted in — phone numbers masked per POPIA"
      />

      <KPIGrid columns={4}>
        <MetricCard title="Total" value={stats ? stats.total : '—'} description="All subscribers" icon={Users} />
        <MetricCard title="Active" value={stats ? stats.active : '—'} description="Currently opted in" icon={UserCheck} />
        <MetricCard title="New Today" value={stats ? stats.newToday : '—'} description="Joined today" icon={Calendar} />
        <MetricCard title="Opt-out Rate" value={stats ? `${stats.optOutRate7d.toFixed(1)}%` : '—'} description="Rolling 7 days" icon={TrendingDown} />
      </KPIGrid>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by masked number..."
        filters={
          <div className="flex gap-2">
            <FilterSelect value={regionFilter} onChange={setRegionFilter} options={REGION_OPTIONS} placeholder="All regions" />
            <FilterSelect value={scheduleFilter} onChange={setScheduleFilter} options={SCHEDULE_OPTIONS} placeholder="All schedules" />
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(s) => s.id}
        emptyMessage="No subscribers yet."
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
