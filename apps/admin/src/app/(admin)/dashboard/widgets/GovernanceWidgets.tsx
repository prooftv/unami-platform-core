'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ActivityFeed,
  AnalyticsCard,
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
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Authority Activity</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recent actions.</p>
        ) : entries.map((e) => (
          <div key={e.id} className="flex items-start gap-2 text-xs">
            <div>
              <p className="font-medium">{e.actionType}</p>
              <p className="text-muted-foreground">Level {e.authorityLevel} · {e.scope} · blast radius {e.blastRadiusApplied}</p>
              <p className="text-muted-foreground">{new Date(e.performedAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
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
  const kpis = [
    { title: 'Pending Review', value: modStats ? modStats.pendingMessages : '—', description: 'Awaiting moderation', icon: AlertTriangle },
    { title: 'Escalated', value: modStats ? modStats.escalatedAdvisories : '—', description: 'High confidence advisories', icon: ShieldCheck },
    { title: 'Authority Actions', value: authStats ? authStats.actionsLast7d : '—', description: 'Last 7 days', icon: Users },
    { title: 'Active Authorities', value: authStats ? authStats.active : '—', description: authStats ? `${authStats.total} total` : 'No data', icon: Scale },
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
