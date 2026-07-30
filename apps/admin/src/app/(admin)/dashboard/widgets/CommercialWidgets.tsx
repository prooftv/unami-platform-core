'use client';

import {
  AnalyticsCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  KPIGrid,
  MetricCard,
  LineChart,
  BarChart,
} from '@moments/ui';
import type { CampaignBudgetEntry, SponsorStats, RevenueAnalytics } from '@moments/api';
import { DollarSign, Target, Users, TrendingUp } from 'lucide-react';

export function CommercialKPIs({ revenue, sponsorStats, campaigns }: {
  revenue: RevenueAnalytics | null;
  sponsorStats: SponsorStats | null;
  campaigns: CampaignBudgetEntry[];
}) {
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

  return (
    <KPIGrid columns={4}>
      <MetricCard
        title="Active Campaigns"
        value={activeCampaigns}
        description={`${campaigns.length} total`}
        icon={Target}
      />
      <MetricCard
        title="Active Sponsors"
        value={sponsorStats ? sponsorStats.active : '—'}
        description={sponsorStats ? `${sponsorStats.total} total` : 'No data'}
        icon={Users}
      />
      <MetricCard
        title="30-day Revenue"
        value={revenue ? `R${revenue.totalRevenue30Days.toLocaleString()}` : '—'}
        description={revenue ? `${revenue.budgetUtilization} utilised` : 'No data'}
        icon={DollarSign}
      />
      <MetricCard
        title="Avg Cost/Broadcast"
        value={revenue ? `R${revenue.avgCostPerBroadcast.toFixed(2)}` : '—'}
        description="Per broadcast"
        icon={TrendingUp}
      />
    </KPIGrid>
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

  return (
    <AnalyticsCard title="Revenue Analytics" description={description}>
      <LineChart height={180} />
    </AnalyticsCard>
  );
}

export function BudgetUtilisationWidget({ revenue }: { revenue: RevenueAnalytics | null }) {
  const description = revenue
    ? `${revenue.budgetUtilization} utilised · ${revenue.roi} ROI`
    : 'No data yet';

  return (
    <AnalyticsCard title="Budget Utilisation" description={description}>
      <BarChart height={180} />
    </AnalyticsCard>
  );
}
