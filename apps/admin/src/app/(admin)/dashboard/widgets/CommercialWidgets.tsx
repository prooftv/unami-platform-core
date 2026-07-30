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
import { DollarSign, Target, Users, TrendingUp } from 'lucide-react';

export function CommercialKPIs() {
  return (
    <KPIGrid columns={4}>
      <MetricCard title="Active Campaigns" value="—" description="Running now" icon={Target} />
      <MetricCard title="Active Sponsors" value="—" description="All tiers" icon={Users} />
      <MetricCard title="30-day Revenue" value="—" description="Budget allocated" icon={DollarSign} />
      <MetricCard title="Avg Cost/Broadcast" value="—" description="Per recipient" icon={TrendingUp} />
    </KPIGrid>
  );
}

export function CampaignPerformanceWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Campaign Performance</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-6">No active campaigns</p>
      </CardContent>
    </Card>
  );
}

export function SponsorOverviewWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sponsor Overview</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {(['platinum', 'gold', 'silver', 'bronze'] as const).map((tier) => (
          <div key={tier} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground capitalize">{tier}</span>
            <Badge variant="outline">0</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RevenueAnalyticsWidget() {
  return (
    <AnalyticsCard title="Revenue Analytics" description="30-day budget allocated vs spent">
      <LineChart height={180} />
    </AnalyticsCard>
  );
}

export function BudgetUtilisationWidget() {
  return (
    <AnalyticsCard title="Budget Utilisation" description="Monthly budget burn rate">
      <BarChart height={180} />
    </AnalyticsCard>
  );
}
