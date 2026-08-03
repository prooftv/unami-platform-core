'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, KPIGrid, TableToolbar, TablePagination } from '@unami/ui';
import type { Subscription, PaginatedResponse } from '@unami/api';
import type { SubscriberStats } from '@unami/api';
import { Region, DeliverySchedule } from '@/domain/moments';
import { Users, TrendingDown, UserCheck, Calendar } from 'lucide-react';

const SCHEDULE_VARIANT: Record<string, 'outline' | 'secondary' | 'default'> = {
  instant: 'default', morning: 'outline', evening: 'secondary', weekly: 'outline',
};

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
    const matchRegion = !regionFilter || regionFilter === 'all' || (s.regions as string[]).includes(regionFilter);
    const matchSchedule = !scheduleFilter || scheduleFilter === 'all' || s.deliverySchedule === scheduleFilter;
    return matchSearch && matchRegion && matchSchedule;
  });

  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;

  const kpiItems = [
    { title: 'Total', value: stats?.total ?? '—', description: 'All subscribers', icon: Users },
    { title: 'Active', value: stats?.active ?? '—', description: 'Currently opted in', icon: UserCheck },
    { title: 'New Today', value: stats?.newToday ?? '—', description: 'Joined today', icon: Calendar },
    { title: 'Opt-out Rate', value: stats ? `${stats.optOutRate7d.toFixed(1)}%` : '—', description: 'Rolling 7 days', icon: TrendingDown },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Subscribers"
        description="WhatsApp community members who have opted in — numbers masked per POPIA"
      />

      <KPIGrid items={kpiItems} columns={4} />

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by masked number..."
        filters={
          <>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="h-8 w-36"><SelectValue placeholder="All regions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {Object.values(Region).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
              <SelectTrigger className="h-8 w-36"><SelectValue placeholder="All schedules" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schedules</SelectItem>
                {Object.values(DeliverySchedule).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subscriber</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Regions</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No subscribers yet.</TableCell>
            </TableRow>
          ) : rows.map((s) => (
            <TableRow key={s.id} className="cursor-pointer" onClick={() => router.push(`/subscribers/${s.id}`)}>
              <TableCell><span className="font-mono text-sm">{s.phoneNumber}</span></TableCell>
              <TableCell>
                <Badge variant={s.optedIn ? 'default' : 'destructive'}>{s.optedIn ? 'Opted in' : 'Opted out'}</Badge>
              </TableCell>
              <TableCell><Badge variant={SCHEDULE_VARIANT[s.deliverySchedule]}>{s.deliverySchedule}</Badge></TableCell>
              <TableCell><span className="text-xs text-muted-foreground">{s.regions.join(', ')}</span></TableCell>
              <TableCell><span className="text-xs text-muted-foreground">{new Date(s.optedInAt).toLocaleDateString()}</span></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {total > limit && (
        <TablePagination
          page={currentPage}
          pageSize={limit}
          total={total}
          onPageChange={(p) => router.push(`/subscribers?page=${p}`)}
        />
      )}
    </div>
  );
}
