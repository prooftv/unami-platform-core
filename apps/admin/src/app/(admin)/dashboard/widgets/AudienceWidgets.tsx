'use client';

import {
  AnalyticsCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  AreaChart,
  BarChart,
  KPIGrid,
  MetricCard,
} from '@moments/ui';
import { Users, TrendingDown, MapPin, Tag } from 'lucide-react';

export function SubscriberGrowthWidget() {
  return (
    <AnalyticsCard
      title="Subscriber Growth"
      description="Daily new subscribers — last 30 days"
    >
      <AreaChart height={200} />
    </AnalyticsCard>
  );
}

export function AudienceKPIs() {
  return (
    <KPIGrid columns={4}>
      <MetricCard title="Active Subscribers" value="—" description="Opted in" icon={Users} />
      <MetricCard title="Opt-out Rate" value="—" description="Rolling 7 days" icon={TrendingDown} />
      <MetricCard title="Regions Covered" value="—" description="Active regions" icon={MapPin} />
      <MetricCard title="Top Category" value="—" description="Most subscribed" icon={Tag} />
    </KPIGrid>
  );
}

export function DeliveryScheduleWidget() {
  return (
    <AnalyticsCard
      title="Delivery Schedule Breakdown"
      description="Instant vs morning vs evening vs weekly"
    >
      <BarChart height={180} />
    </AnalyticsCard>
  );
}

export function RegionalSubscriberWidget() {
  return (
    <AnalyticsCard title="Regional Subscriber Distribution" description="Subscribers by region preference">
      <BarChart height={180} />
    </AnalyticsCard>
  );
}
