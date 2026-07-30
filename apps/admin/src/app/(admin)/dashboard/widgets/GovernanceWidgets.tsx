'use client';

import {
  ActivityFeed,
  AnalyticsCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  BarChart,
  KPIGrid,
  MetricCard,
} from '@moments/ui';
import type { ActivityItem } from '@moments/ui';
import { ShieldCheck, Scale, AlertTriangle, Users } from 'lucide-react';

const PLACEHOLDER_AUTHORITY: ActivityItem[] = [];

export function GovernanceModerationWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Moderation Overview</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[
          { label: 'Approved (7d)', value: '—' },
          { label: 'Rejected (7d)', value: '—' },
          { label: 'Escalated', value: '—' },
          { label: 'Avg review time', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AuthorityActivityWidget() {
  return (
    <ActivityFeed
      title="Authority Activity"
      items={PLACEHOLDER_AUTHORITY}
    />
  );
}

export function AdvisoryConfidenceWidget() {
  return (
    <AnalyticsCard
      title="Advisory Confidence Distribution"
      description="AI risk score histogram"
    >
      <BarChart height={180} />
    </AnalyticsCard>
  );
}

export function GovernanceKPIs() {
  return (
    <KPIGrid columns={4}>
      <MetricCard title="Compliance Score" value="—" description="Rolling average" icon={Scale} />
      <MetricCard title="Pending Review" value="—" description="Awaiting moderation" icon={AlertTriangle} />
      <MetricCard title="Authority Actions" value="—" description="Last 7 days" icon={Users} />
      <MetricCard title="POPIA Status" value="—" description="Data retention" icon={ShieldCheck} />
    </KPIGrid>
  );
}
