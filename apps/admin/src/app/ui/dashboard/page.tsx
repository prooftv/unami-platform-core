"use client";

import { Users, Activity, TrendingUp, Package } from "lucide-react";
import {
  ContentLayout,
  PageHeader,
  KPIGrid,
  MetricCard,
  AnalyticsCard,
  ActivityFeed,
  QuickActions,
  EmptyDashboard,
  SectionTitle,
} from "@moments/ui";
import type { ActivityItem, QuickAction } from "@moments/ui";

const ACTIVITY: ActivityItem[] = [
  { id: "1", label: "New user registered", description: "user@example.com", timestamp: "2m ago", icon: Users },
  { id: "2", label: "Report generated", description: "Monthly summary", timestamp: "1h ago", icon: Activity },
  { id: "3", label: "Settings updated", description: "Notification preferences", timestamp: "3h ago", icon: TrendingUp },
];

const ACTIONS: QuickAction[] = [
  { id: "1", label: "Add Record", description: "Create a new entry", icon: Package, onClick: () => {} },
  { id: "2", label: "Export Data", description: "Download as CSV", icon: TrendingUp, onClick: () => {} },
  { id: "3", label: "View Reports", description: "Analytics overview", icon: Activity, onClick: () => {} },
  { id: "4", label: "Manage Users", description: "User administration", icon: Users, onClick: () => {} },
];

export default function DashboardShowcase() {
  return (
    <ContentLayout>
      <div className="space-y-8">
        <PageHeader title="Dashboard Components" description="MetricCard, KPIGrid, ActivityFeed, QuickActions, EmptyDashboard" />

        <section className="space-y-4">
          <SectionTitle title="KPIGrid + MetricCard" description="Responsive metric grid with trend indicators" />
          <KPIGrid columns={4}>
            <MetricCard title="Total Users" value="12,483" description="from last month" trend={{ value: 12 }} icon={Users} />
            <MetricCard title="Active Sessions" value="1,429" description="from last week" trend={{ value: -3 }} icon={Activity} />
            <MetricCard title="Revenue" value="$48,290" description="from last month" trend={{ value: 8 }} icon={TrendingUp} />
            <MetricCard title="Items" value="3,842" description="total in system" icon={Package} />
          </KPIGrid>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-4">
            <SectionTitle title="ActivityFeed" />
            <ActivityFeed items={ACTIVITY} />
          </section>
          <section className="space-y-4">
            <SectionTitle title="QuickActions" />
            <QuickActions actions={ACTIONS} />
          </section>
        </div>

        <section className="space-y-4">
          <SectionTitle title="AnalyticsCard" description="Card with header slot for chart content" />
          <AnalyticsCard title="Overview" description="Platform activity over time" actions={<span className="text-xs text-muted-foreground">Last 30 days</span>}>
            <div className="h-40 flex items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground">
              Chart area — connect packages/ui/charts
            </div>
          </AnalyticsCard>
        </section>

        <section className="space-y-4">
          <SectionTitle title="EmptyDashboard" description="First-run state" />
          <div className="border rounded-lg">
            <EmptyDashboard />
          </div>
        </section>
      </div>
    </ContentLayout>
  );
}
