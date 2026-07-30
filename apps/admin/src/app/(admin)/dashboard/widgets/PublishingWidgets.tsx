'use client';

import {
  AnalyticsCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  BarChart,
  PieChart,
} from '@moments/ui';
import { Radio } from 'lucide-react';

export function ContentSourceWidget() {
  return (
    <AnalyticsCard
      title="Content Source Breakdown"
      description="Admin vs community vs WhatsApp vs campaign"
    >
      <PieChart height={180} />
    </AnalyticsCard>
  );
}

export function CategoryDistributionWidget() {
  return (
    <AnalyticsCard title="Category Distribution" description="Moments by category">
      <BarChart height={180} />
    </AnalyticsCard>
  );
}

export function RegionalDistributionWidget() {
  return (
    <AnalyticsCard title="Regional Distribution" description="Moments by region">
      <BarChart height={180} />
    </AnalyticsCard>
  );
}

export function PublishingRecentMomentsWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Moments</CardTitle>
          <Radio className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-6">No moments yet</p>
      </CardContent>
    </Card>
  );
}
