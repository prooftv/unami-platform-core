'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AnalyticsCard,
  KPIGrid,
  MetricCard,
  LineChart,
  BarChart,
} from '@unami/ui';
import type { CampaignBudgetEntry, SponsorStats, RevenueAnalytics } from '@unami/api';
import { DollarSign, Target, Users, TrendingUp } from 'lucide-react';

export function CommercialKPIs({ revenue, sponsorStats, campaigns }: {
  revenue: RevenueAnalytics | null;
  sponsorStats: SponsorStats | null;
  campaigns: CampaignBudgetEntry[];
}) {
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const kpis = [
    { title: 'Active Campaigns', value: activeCampaigns, description: `${campaigns.length} total`, icon: Target },
    { title: 'Active Sponsors', value: sponsorStats ? sponsorStats.active : '—', description: sponsorStats ? `${sponsorStats.total} total` : 'No data', icon: Users },
    { title: '30-day Revenue', value: revenue ? `R${revenue.totalRevenue30Days.toLocaleString()}` : '—', description: revenue ? `${revenue.budgetUtilization} utilised` : 'No data', icon: DollarSign },
    { title: 'Avg Cost/Broadcast', value: revenue ? `R${revenue.avgCostPerBroadcast.toFixed(2)}` : '—', description: 'Per broadcast', icon: TrendingUp },
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

export function CampaignPerformanceWidget({ campaigns }: { campaigns: CampaignBudgetEntry[] }) {
  const active = campaigns.filter((c) => c.status === 'active');
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Campaign Performance</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No active campaigns</p>
        ) : (
          <ul className="space-y-3">
            {active.map((c) => {
              const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
              return (
                <li key={c.campaignId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2 font-medium">{c.title}</span>
                    <Badge variant="outline">{pct}%</Badge>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    R{c.spent.toLocaleString()} / R{c.budget.toLocaleString()} · {c.broadcastsSent} broadcasts
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function SponsorOverviewWidget({ stats }: { stats: SponsorStats | null }) {
  const tiers = ['platinum', 'gold', 'silver', 'bronze'] as const;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sponsor Overview</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tiers.map((tier) => (
          <div key={tier} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground capitalize">{tier}</span>
            <Badge variant="outline">{stats ? (stats.byTier[tier] ?? 0) : '—'}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RevenueAnalyticsWidget({ revenue }: { revenue: RevenueAnalytics | null }) {
  const description = revenue
    ? `R${revenue.totalRevenue30Days.toLocaleString()} allocated · R${revenue.totalSpent.toLocaleString()} spent`
    : 'No data yet';

  const data = revenue ? [
    { label: 'Allocated', value: revenue.totalBudgetAllocated },
    { label: 'Spent', value: revenue.totalSpent },
    { label: '30-day Revenue', value: revenue.totalRevenue30Days },
  ] : [];

  return (
    <AnalyticsCard title="Revenue Analytics" description={description}>
      <BarChart
        data={data}
        series={[{ key: 'value', label: 'ZAR (R)' }]}
        height={180}
        emptyMessage="No revenue data yet"
      />
    </AnalyticsCard>
  );
}

export function BudgetUtilisationWidget({ revenue }: { revenue: RevenueAnalytics | null }) {
  const description = revenue
    ? `${revenue.budgetUtilization} utilised · ${revenue.roi} ROI`
    : 'No data yet';

  const utilPct = revenue
    ? parseFloat(revenue.budgetUtilization.replace('%', '')) || 0
    : 0;
  const remaining = Math.max(0, 100 - utilPct);

  const data = revenue ? [
    { label: 'Utilised', value: utilPct },
    { label: 'Remaining', value: remaining },
  ] : [];

  return (
    <AnalyticsCard title="Budget Utilisation" description={description}>
      <BarChart
        data={data}
        series={[{ key: 'value', label: '%' }]}
        height={180}
        emptyMessage="No budget data yet"
      />
    </AnalyticsCard>
  );
}
