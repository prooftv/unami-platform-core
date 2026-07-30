'use client';

import {
  ActivityFeed,
  AnalyticsCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  KPIGrid,
  MetricCard,
  BarChart,
} from '@moments/ui';
import type { ActivityItem } from '@moments/ui';
import type { ModerationStats, AuthorityAuditEntry, AuthorityStats } from '@moments/api';
import { ShieldCheck, Scale, AlertTriangle, Users } from 'lucide-react';

export function GovernanceModerationWidget({ stats }: { stats: ModerationStats | null }) {
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
          { label: 'Approved today', value: stats ? String(stats.approvedToday) : '—' },
          { label: 'Rejected today', value: stats ? String(stats.rejectedToday) : '—' },
          { label: 'Escalated', value: stats ? String(stats.escalatedAdvisories) : '—' },
          { label: 'Avg review time', value: stats?.avgReviewTime7d != null ? `${stats.avgReviewTime7d}m` : '—' },
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

export function AuthorityActivityWidget({ entries }: { entries: AuthorityAuditEntry[] }) {
  const items: ActivityItem[] = entries.map((e) => ({
    id: e.id,
    label: e.actionType,
    description: `Level ${e.authorityLevel} · ${e.scope} · blast radius ${e.blastRadiusApplied}`,
    timestamp: new Date(e.performedAt).toLocaleDateString(),
  }));

  return <ActivityFeed title="Authority Activity" items={items} />;
}

export function AdvisoryConfidenceWidget({ stats }: { stats: ModerationStats | null }) {
  const description = stats
    ? `${stats.pendingMessages} pending · ${stats.escalatedAdvisories} escalated`
    : 'No data yet';

  const data = stats ? [
    { label: 'Pending', value: stats.pendingMessages },
    { label: 'Approved today', value: stats.approvedToday },
    { label: 'Rejected today', value: stats.rejectedToday },
    { label: 'Escalated', value: stats.escalatedAdvisories },
  ] : [];

  return (
    <AnalyticsCard title="Advisory Confidence Distribution" description={description}>
      <BarChart
        data={data}
        series={[{ key: 'value', label: 'Count' }]}
        height={180}
        emptyMessage="No moderation data yet"
      />
    </AnalyticsCard>
  );
}

export function GovernanceKPIs({ modStats, authStats }: {
  modStats: ModerationStats | null;
  authStats: AuthorityStats | null;
}) {
  return (
    <KPIGrid columns={4}>
      <MetricCard
        title="Pending Review"
        value={modStats ? modStats.pendingMessages : '—'}
        description="Awaiting moderation"
        icon={AlertTriangle}
      />
      <MetricCard
        title="Escalated"
        value={modStats ? modStats.escalatedAdvisories : '—'}
        description="High confidence advisories"
        icon={ShieldCheck}
      />
      <MetricCard
        title="Authority Actions"
        value={authStats ? authStats.actionsLast7d : '—'}
        description="Last 7 days"
        icon={Users}
      />
      <MetricCard
        title="Active Authorities"
        value={authStats ? authStats.active : '—'}
        description={authStats ? `${authStats.total} total` : 'No data'}
        icon={Scale}
      />
    </KPIGrid>
  );
}
