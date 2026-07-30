'use client';

import {
  AnalyticsCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  KPIGrid,
  MetricCard,
  AreaChart,
  BarChart,
} from '@moments/ui';
import type { SubscriberStats, DailyStats } from '@moments/api';
import { Users, TrendingDown, MapPin, Tag } from 'lucide-react';

export function SubscriberGrowthWidget({ dailyStats }: { dailyStats: DailyStats[] }) {
  const totalNew = dailyStats.reduce((s, d) => s + d.newSubscribers, 0);
  const description = dailyStats.length > 0
    ? `${totalNew} new over last ${dailyStats.length} days`
    : 'No data yet';

  return (
    <AnalyticsCard title="Subscriber Growth" description={description}>
      <AreaChart height={200} />
    </AnalyticsCard>
  );
}

export function AudienceKPIs({ stats }: { stats: SubscriberStats | null }) {
  const topRegion = stats
    ? Object.entries(stats.byRegion).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    : '—';

  return (
    <KPIGrid columns={4}>
      <MetricCard
        title="Active Subscribers"
        value={stats ? stats.active : '—'}
        description={stats ? `${stats.total} total` : 'No data'}
        icon={Users}
      />
      <MetricCard
        title="Opt-out Rate"
        value={stats ? `${stats.optOutRate7d.toFixed(1)}%` : '—'}
        description="Rolling 7 days"
        icon={TrendingDown}
      />
      <MetricCard
        title="New Today"
        value={stats ? stats.newToday : '—'}
        description="Joined today"
        icon={MapPin}
      />
      <MetricCard
        title="Top Region"
        value={topRegion}
        description="Most subscribers"
        icon={Tag}
      />
    </KPIGrid>
  );
}

export function DeliveryScheduleWidget({ stats }: { stats: SubscriberStats | null }) {
  const description = stats
    ? Object.entries(stats.bySchedule).map(([k, v]) => `${k}: ${v}`).join(' · ')
    : 'No data yet';

  return (
    <AnalyticsCard title="Delivery Schedule Breakdown" description={description}>
      <BarChart height={180} />
    </AnalyticsCard>
  );
}

export function RegionalSubscriberWidget({ stats }: { stats: SubscriberStats | null }) {
  const description = stats
    ? `${Object.keys(stats.byRegion).length} regions`
    : 'No data yet';

  return (
    <AnalyticsCard title="Regional Subscriber Distribution" description={description}>
      <BarChart height={180} />
    </AnalyticsCard>
  );
}
