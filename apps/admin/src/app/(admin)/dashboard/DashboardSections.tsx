'use client';

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

// Shared grid wrapper
function WidgetGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">{children}</div>;
}

// Column span helpers
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

// ── Overview ──────────────────────────────────────────────────────────────────

export function OverviewSection() {
  return (
    <div className="space-y-4">
      {/* P0: KPIs full width */}
      <TodayKPIs />

      {/* P0: Broadcast Queue + Moderation Queue */}
      <WidgetGrid>
        <Col6>
          <BroadcastQueueWidget />
        </Col6>
        <Col6>
          <ModerationQueueWidget />
        </Col6>
      </WidgetGrid>

      {/* P0: Quick Actions + Recent Activity */}
      <WidgetGrid>
        <Col6>
          <QuickActionsWidget />
        </Col6>
        <Col6>
          <RecentActivityWidget />
        </Col6>
      </WidgetGrid>

      {/* P1: Platform Health full width */}
      <WidgetGrid>
        <Col4>
          <OperationalHealthWidget />
        </Col4>
        <Col4>
          <RecentMomentsWidget />
        </Col4>
        <Col4>
          <UpcomingScheduledWidget />
        </Col4>
      </WidgetGrid>

      {/* P1: Recent Broadcasts full width */}
      <WidgetGrid>
        <Col12>
          <RecentBroadcastsWidget />
        </Col12>
      </WidgetGrid>
    </div>
  );
}

// ── Operations ────────────────────────────────────────────────────────────────

export function OperationsSection() {
  return (
    <div className="space-y-4">
      <WidgetGrid>
        <Col6>
          <OperationsBroadcastQueueWidget />
        </Col6>
        <Col6>
          <FailedBroadcastsWidget />
        </Col6>
      </WidgetGrid>

      <WidgetGrid>
        <Col8>
          <DeliverySuccessWidget />
        </Col8>
        <Col4>
          <AutomationStatusWidget />
        </Col4>
      </WidgetGrid>
    </div>
  );
}

// ── Publishing ────────────────────────────────────────────────────────────────

export function PublishingSection() {
  return (
    <div className="space-y-4">
      <WidgetGrid>
        <Col12>
          <PublishingRecentMomentsWidget />
        </Col12>
      </WidgetGrid>

      <WidgetGrid>
        <Col4>
          <ContentSourceWidget />
        </Col4>
        <Col4>
          <CategoryDistributionWidget />
        </Col4>
        <Col4>
          <RegionalDistributionWidget />
        </Col4>
      </WidgetGrid>
    </div>
  );
}

// ── Audience ──────────────────────────────────────────────────────────────────

export function AudienceSection() {
  return (
    <div className="space-y-4">
      <AudienceKPIs />

      <WidgetGrid>
        <Col12>
          <SubscriberGrowthWidget />
        </Col12>
      </WidgetGrid>

      <WidgetGrid>
        <Col6>
          <DeliveryScheduleWidget />
        </Col6>
        <Col6>
          <RegionalSubscriberWidget />
        </Col6>
      </WidgetGrid>
    </div>
  );
}

// ── Governance ────────────────────────────────────────────────────────────────

export function GovernanceSection() {
  return (
    <div className="space-y-4">
      <GovernanceKPIs />

      <WidgetGrid>
        <Col6>
          <GovernanceModerationWidget />
        </Col6>
        <Col6>
          <AuthorityActivityWidget />
        </Col6>
      </WidgetGrid>

      <WidgetGrid>
        <Col12>
          <AdvisoryConfidenceWidget />
        </Col12>
      </WidgetGrid>
    </div>
  );
}

// ── Commercial ────────────────────────────────────────────────────────────────

export function CommercialSection() {
  return (
    <div className="space-y-4">
      <CommercialKPIs />

      <WidgetGrid>
        <Col6>
          <CampaignPerformanceWidget />
        </Col6>
        <Col6>
          <SponsorOverviewWidget />
        </Col6>
      </WidgetGrid>

      <WidgetGrid>
        <Col6>
          <RevenueAnalyticsWidget />
        </Col6>
        <Col6>
          <BudgetUtilisationWidget />
        </Col6>
      </WidgetGrid>
    </div>
  );
}

// ── Platform ──────────────────────────────────────────────────────────────────

export function PlatformSection() {
  return (
    <div className="space-y-4">
      <WidgetGrid>
        <Col6>
          <SystemHealthWidget />
        </Col6>
        <Col6>
          <ApiHealthWidget />
        </Col6>
      </WidgetGrid>

      <WidgetGrid>
        <Col4>
          <StorageUsageWidget />
        </Col4>
        <Col4>
          <FeatureFlagsWidget />
        </Col4>
        <Col4>
          <ErrorSummaryWidget />
        </Col4>
      </WidgetGrid>
    </div>
  );
}
