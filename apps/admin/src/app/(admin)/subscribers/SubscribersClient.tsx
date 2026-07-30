'use client';

import { useState } from 'react';
import {
  PageHeader, DataTable, TableToolbar, TablePagination,
  Badge, KPIGrid, MetricCard,
} from '@moments/ui';
import type { ColumnDef } from '@moments/ui';
import type { Subscription, PaginatedResponse } from '@moments/api';
import type { SubscriberStats } from '@moments/api';
import { Region, DeliverySchedule } from '@moments/shared';
import { Users, TrendingDown, UserCheck, Calendar } from 'lucide-react';

const SCHEDULE_VARIANT: Record<string, 'outline' | 'info' | 'warning' | 'secondary'> = {
  instant: 'info', morning: 'outline', evening: 'warning', weekly: 'secondary',
};

const REGIONS = Object.values(Region);
const SCHEDULES = Object.values(DeliverySchedule);

interface Props {
  initialData: PaginatedResponse<Subscription> | null;
  stats: SubscriberStats | null;
}

export function SubscribersClient({ initialData, stats }: Props) {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');

  const rows = (initialData?.data ?? []).filter((s) => {
    const matchSearch = !search || s.phoneNumber.includes(search);
    const matchRegion = !regionFilter || s.regions.includes(regionFilter as typeof REGIONS[number]);
    const matchSchedule = !scheduleFilter || s.deliverySchedule === scheduleFilter;
    return matchSearch && matchRegion && matchSchedule;
  });

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
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All regions</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All schedules</option>
              {SCHEDULES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
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
          page={initialData.pagination.page}
          pageSize={initialData.pagination.limit}
          total={initialData.pagination.total}
          onPageChange={() => {}}
        />
      )}
    </div>
  );
}
