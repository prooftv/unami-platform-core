'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AnalyticsCard,
  KPIGrid,
  MetricCard,
  AreaChart,
  BarChart,
} from '@unami/ui';
import type { SubscriberStats, DailyStats } from '@unami/api';
import { Users, TrendingDown, MapPin, Tag } from 'lucide-react';

export function SubscriberGrowthWidget({ dailyStats }: { dailyStats: DailyStats[] }) {
  const totalNew = dailyStats.reduce((s, d) => s + d.newSubscribers, 0);
  const description = dailyStats.length > 0
    ? `${totalNew} new over last ${dailyStats.length} days`
    : 'No data yet';

  const data = dailyStats.map((d) => ({
    label: new Date(d.statDate).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
    value: d.newSubscribers,
  }));

  return (
    <AnalyticsCard title="Subscriber Growth" description={description}>
      <AreaChart
        data={data}
        series={[{ key: 'value', label: 'New subscribers' }]}
        height={200}
        emptyMessage="No subscriber data yet"
      />
    </AnalyticsCard>
  );
}

export function AudienceKPIs({ stats }: { stats: SubscriberStats | null }) {
  const topRegion = stats
    ? Object.entries(stats.byRegion).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    : '—';
  const kpis = [
    { title: 'Active Subscribers', value: stats ? stats.active : '—', description: stats ? `${stats.total} total` : 'No data', icon: Users },
    { title: 'Opt-out Rate', value: stats ? `${stats.optOutRate7d.toFixed(1)}%` : '—', description: 'Rolling 7 days', icon: TrendingDown },
    { title: 'New Today', value: stats ? stats.newToday : '—', description: 'Joined today', icon: MapPin },
    { title: 'Top Region', value: topRegion, description: 'Most subscribers', icon: Tag },
  ];
  return (
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
  );
}

export function DeliveryScheduleWidget({ stats }: { stats: SubscriberStats | null }) {
  const description = stats
    ? Object.entries(stats.bySchedule).map(([k, v]) => `${k}: ${v}`).join(' · ')
    : 'No data yet';

  const data = stats
    ? Object.entries(stats.bySchedule).map(([label, value]) => ({ label, value }))
    : [];

  return (
    <AnalyticsCard title="Delivery Schedule Breakdown" description={description}>
      <BarChart
        data={data}
        series={[{ key: 'value', label: 'Subscribers' }]}
        height={180}
        emptyMessage="No schedule data yet"
      />
    </AnalyticsCard>
  );
}

export function RegionalSubscriberWidget({ stats }: { stats: SubscriberStats | null }) {
  const description = stats
    ? `${Object.keys(stats.byRegion).length} regions`
    : 'No data yet';

  const data = stats
    ? Object.entries(stats.byRegion)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, value]) => ({ label, value }))
    : [];

  return (
    <AnalyticsCard title="Regional Subscriber Distribution" description={description}>
      <BarChart
        data={data}
        series={[{ key: 'value', label: 'Subscribers' }]}
        height={180}
        emptyMessage="No regional data yet"
      />
    </AnalyticsCard>
  );
}
