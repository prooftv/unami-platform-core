'use client';

import { Skeleton } from '@moments/ui';
import {
  TodayKPIs,
  BroadcastQueueWidget,
  ModerationQueueWidget,
  RecentActivityWidget,
  QuickActionsWidget,
  OperationalHealthWidget,
  RecentMomentsWidget,
  UpcomingScheduledWidget,
  RecentBroadcastsWidget,
  PlatformStatusBanner,
  TodaysOperationsPanel,
} from './widgets/OverviewWidgets';
import {
  DeliverySuccessWidget,
  FailedBroadcastsWidget,
  AutomationStatusWidget,
  OperationsBroadcastQueueWidget,
} from './widgets/OperationsWidgets';
import {
  ContentSourceWidget,
  CategoryDistributionWidget,
  RegionalDistributionWidget,
  PublishingRecentMomentsWidget,
} from './widgets/PublishingWidgets';
import {
  SubscriberGrowthWidget,
  AudienceKPIs,
  DeliveryScheduleWidget,
  RegionalSubscriberWidget,
} from './widgets/AudienceWidgets';
import {
  GovernanceModerationWidget,
  AuthorityActivityWidget,
  AdvisoryConfidenceWidget,
  GovernanceKPIs,
} from './widgets/GovernanceWidgets';
import {
  CommercialKPIs,
  CampaignPerformanceWidget,
  SponsorOverviewWidget,
  RevenueAnalyticsWidget,
  BudgetUtilisationWidget,
} from './widgets/CommercialWidgets';
import {
  SystemHealthWidget,
  StorageUsageWidget,
  ApiHealthWidget,
  FeatureFlagsWidget,
  ErrorSummaryWidget,
} from './widgets/PlatformWidgets';
import type {
  DashboardMetrics,
  MomentWithSponsor,
  BroadcastWithMoment,
  ModerationStats,
  DailyStats,
  CategoryStats,
  RegionalStats,
  SubscriberStats,
  AuthorityAuditEntry,
  AuthorityStats,
  CampaignBudgetEntry,
  SponsorStats,
  RevenueAnalytics,
  IntentStats,
} from '@moments/api';

// ── Shared grid primitives ────────────────────────────────────────────────────

function WidgetGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">{children}</div>;
}

// ── Skeleton states ───────────────────────────────────────────────────────────

export function KPIGridSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-4`}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function WidgetGridSkeleton({ cols = 2 }: { cols?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="col-span-1 md:col-span-1 lg:col-span-6 rounded-lg border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}
function Col12({ children }: { children: React.ReactNode }) {
  return <div className="col-span-1 md:col-span-2 lg:col-span-12">{children}</div>;
}
function Col6({ children }: { children: React.ReactNode }) {
  return <div className="col-span-1 md:col-span-1 lg:col-span-6">{children}</div>;
}
function Col4({ children }: { children: React.ReactNode }) {
  return <div className="col-span-1 md:col-span-1 lg:col-span-4">{children}</div>;
}
function Col8({ children }: { children: React.ReactNode }) {
  return <div className="col-span-1 md:col-span-2 lg:col-span-8">{children}</div>;
}

// ── Section prop types ────────────────────────────────────────────────────────

export type OverviewProps = {
  metrics: DashboardMetrics | null;
  queueMoments: MomentWithSponsor[];
  moderationStats: ModerationStats | null;
  recentMoments: MomentWithSponsor[];
  scheduledMoments: MomentWithSponsor[];
  recentBroadcasts: BroadcastWithMoment[];
};

export type OperationsProps = {
  broadcasts: BroadcastWithMoment[];
  intentStats: IntentStats | null;
};

export type PublishingProps = {
  moments: MomentWithSponsor[];
  categoryStats: CategoryStats[];
  regionalStats: RegionalStats[];
};

export type AudienceProps = {
  subscriberStats: SubscriberStats | null;
  dailyStats: DailyStats[];
};

export type GovernanceProps = {
  modStats: ModerationStats | null;
  authorityEntries: AuthorityAuditEntry[];
  authorityStats: AuthorityStats | null;
};

export type CommercialProps = {
  campaigns: CampaignBudgetEntry[];
  sponsorStats: SponsorStats | null;
  revenue: RevenueAnalytics | null;
};

export type PlatformProps = {
  metrics: DashboardMetrics | null;
};

// ── Section components ────────────────────────────────────────────────────────

export function OverviewSection({ metrics, queueMoments, moderationStats, recentMoments, scheduledMoments, recentBroadcasts }: OverviewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* 1 — Platform status: what is the state of the platform right now? */}
      <PlatformStatusBanner
        metrics={metrics}
        queueMoments={queueMoments}
        moderationStats={moderationStats}
        scheduledMoments={scheduledMoments}
      />

      {/* 2 — Today's operations: what needs action today? */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Today’s Operations</h2>
        <TodaysOperationsPanel
          queueMoments={queueMoments}
          moderationStats={moderationStats}
          scheduledMoments={scheduledMoments}
        />
      </div>

      {/* 3 — Recent activity: what just happened? */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Recent Activity</h2>
        <WidgetGrid>
          <Col8><RecentActivityWidget moments={recentMoments} broadcasts={recentBroadcasts} /></Col8>
          <Col4><QuickActionsWidget /></Col4>
        </WidgetGrid>
      </div>

      {/* 4 — Platform snapshot: KPIs and health (context, not urgency) */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Platform Snapshot</h2>
        <TodayKPIs metrics={metrics} />
        <div className="mt-4">
          <WidgetGrid>
            <Col4><OperationalHealthWidget metrics={metrics} /></Col4>
            <Col4><RecentMomentsWidget moments={recentMoments} /></Col4>
            <Col4><RecentBroadcastsWidget broadcasts={recentBroadcasts} /></Col4>
          </WidgetGrid>
        </div>
      </div>

    </div>
  );
}

export function OperationsSection({ broadcasts, intentStats }: OperationsProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <WidgetGrid>
        <Col6><OperationsBroadcastQueueWidget broadcasts={broadcasts} /></Col6>
        <Col6><FailedBroadcastsWidget broadcasts={broadcasts} /></Col6>
      </WidgetGrid>
      <WidgetGrid>
        <Col8><DeliverySuccessWidget broadcasts={broadcasts} /></Col8>
        <Col4><AutomationStatusWidget stats={intentStats} /></Col4>
      </WidgetGrid>
    </div>
  );
}

export function PublishingSection({ moments, categoryStats, regionalStats }: PublishingProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <WidgetGrid>
        <Col12><PublishingRecentMomentsWidget moments={moments} /></Col12>
      </WidgetGrid>
      <WidgetGrid>
        <Col4><ContentSourceWidget moments={moments} /></Col4>
        <Col4><CategoryDistributionWidget stats={categoryStats} /></Col4>
        <Col4><RegionalDistributionWidget stats={regionalStats} /></Col4>
      </WidgetGrid>
    </div>
  );
}

export function AudienceSection({ subscriberStats, dailyStats }: AudienceProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <AudienceKPIs stats={subscriberStats} />
      <WidgetGrid>
        <Col12><SubscriberGrowthWidget dailyStats={dailyStats} /></Col12>
      </WidgetGrid>
      <WidgetGrid>
        <Col6><DeliveryScheduleWidget stats={subscriberStats} /></Col6>
        <Col6><RegionalSubscriberWidget stats={subscriberStats} /></Col6>
      </WidgetGrid>
    </div>
  );
}

export function GovernanceSection({ modStats, authorityEntries, authorityStats }: GovernanceProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <GovernanceKPIs modStats={modStats} authStats={authorityStats} />
      <WidgetGrid>
        <Col6><GovernanceModerationWidget stats={modStats} /></Col6>
        <Col6><AuthorityActivityWidget entries={authorityEntries} /></Col6>
      </WidgetGrid>
      <WidgetGrid>
        <Col12><AdvisoryConfidenceWidget stats={modStats} /></Col12>
      </WidgetGrid>
    </div>
  );
}

export function CommercialSection({ campaigns, sponsorStats, revenue }: CommercialProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <CommercialKPIs revenue={revenue} sponsorStats={sponsorStats} campaigns={campaigns} />
      <WidgetGrid>
        <Col6><CampaignPerformanceWidget campaigns={campaigns} /></Col6>
        <Col6><SponsorOverviewWidget stats={sponsorStats} /></Col6>
      </WidgetGrid>
      <WidgetGrid>
        <Col6><RevenueAnalyticsWidget revenue={revenue} /></Col6>
        <Col6><BudgetUtilisationWidget revenue={revenue} /></Col6>
      </WidgetGrid>
    </div>
  );
}

export function PlatformSection({ metrics }: PlatformProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <WidgetGrid>
        <Col6><SystemHealthWidget metrics={metrics} /></Col6>
        <Col6><ApiHealthWidget metrics={metrics} /></Col6>
      </WidgetGrid>
      <WidgetGrid>
        <Col4><StorageUsageWidget /></Col4>
        <Col4><FeatureFlagsWidget metrics={metrics} /></Col4>
        <Col4><ErrorSummaryWidget /></Col4>
      </WidgetGrid>
    </div>
  );
}
