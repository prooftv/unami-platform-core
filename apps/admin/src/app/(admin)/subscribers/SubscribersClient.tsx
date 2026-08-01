'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Subscription, PaginatedResponse } from '@moments/api';
import type { SubscriberStats } from '@moments/api';
import { Region, DeliverySchedule } from '@moments/shared';
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
  const totalPages = Math.ceil(total / limit);

  const kpis = [
    { title: 'Total', value: stats?.total ?? '—', description: 'All subscribers', icon: Users },
    { title: 'Active', value: stats?.active ?? '—', description: 'Currently opted in', icon: UserCheck },
    { title: 'New Today', value: stats?.newToday ?? '—', description: 'Joined today', icon: Calendar },
    { title: 'Opt-out Rate', value: stats ? `${stats.optOutRate7d.toFixed(1)}%` : '—', description: 'Rolling 7 days', icon: TrendingDown },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Subscribers</h1>
        <p className="text-sm text-muted-foreground">WhatsApp community members who have opted in — numbers masked per POPIA</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(({ title, value, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input placeholder="Search by masked number..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-56" />
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
      </div>

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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => router.push(`/subscribers?page=${currentPage - 1}`)}>Previous</Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => router.push(`/subscribers?page=${currentPage + 1}`)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
