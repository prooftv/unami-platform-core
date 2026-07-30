'use client';

import { useRouter } from 'next/navigation';
import {
  KPIGrid,
  MetricCard,
  ActivityFeed,
  QuickActions,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  StatusBadge,
} from '@moments/ui';
import type { ActivityItem, QuickAction } from '@moments/ui';
import type {
  DashboardMetrics,
  MomentWithSponsor,
  BroadcastWithMoment,
  ModerationStats,
} from '@moments/api';
import {
  Radio,
  Megaphone,
  Users,
  TrendingUp,
  PlusCircle,
  Send,
  ShieldAlert,
  Settings,
  Clock,
  Database,
  Zap,
  HardDrive,
  Wifi,
} from 'lucide-react';

// ── Today's KPIs ──────────────────────────────────────────────────────────────

export function TodayKPIs({ metrics }: { metrics: DashboardMetrics | null }) {
  const broadcastRate = metrics && metrics.totalBroadcasts > 0
    ? Math.round((metrics.successfulBroadcasts / metrics.totalBroadcasts) * 100) - 100
    : undefined;
  const subscriberRate = metrics && metrics.totalSubscribers > 0
    ? Math.round(((metrics.activeSubscribers - metrics.totalSubscribers) / metrics.totalSubscribers) * 100)
    : undefined;

  return (
    <KPIGrid columns={4}>
      <MetricCard
        title="Total Moments"
        value={metrics ? metrics.totalMoments : '—'}
        description={metrics ? `${metrics.broadcastedMoments} broadcasted` : 'No data'}
        icon={Radio}
        trend={metrics ? { value: metrics.broadcastedMoments > 0 ? Math.round((metrics.broadcastedMoments / metrics.totalMoments) * 100) - 100 : 0 } : undefined}
      />
      <MetricCard
        title="Broadcasts Sent"
        value={metrics ? metrics.totalBroadcasts : '—'}
        description={metrics ? `${metrics.failedBroadcasts} failed` : 'No data'}
        icon={Megaphone}
        trend={broadcastRate !== undefined ? { value: broadcastRate } : undefined}
      />
      <MetricCard
        title="Active Subscribers"
        value={metrics ? metrics.activeSubscribers : '—'}
        description={metrics ? `${metrics.totalSubscribers} total` : 'No data'}
        icon={Users}
        trend={subscriberRate !== undefined ? { value: subscriberRate } : undefined}
      />
      <MetricCard
        title="Delivery Rate"
        value={metrics ? metrics.successRate : '—'}
        description={metrics ? `${metrics.successfulBroadcasts} successful` : 'No data'}
        icon={TrendingUp}
      />
    </KPIGrid>
  );
}

// ── Broadcast Queue ───────────────────────────────────────────────────────────

export function BroadcastQueueWidget({ moments }: { moments: MomentWithSponsor[] }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Broadcast Queue</CardTitle>
          <Badge variant={moments.length > 0 ? 'warning' : 'outline'}>
            {moments.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {moments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No moments awaiting broadcast
          </p>
        ) : (
          <ul className="space-y-2">
            {moments.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-accent rounded-md px-2 py-1 transition-colors"
                onClick={() => router.push(`/moments/${m.id}`)}
              >
                <span className="truncate flex-1 mr-2">{m.title}</span>
                <Badge variant="outline">{m.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Moderation Queue ──────────────────────────────────────────────────────────

export function ModerationQueueWidget({ stats }: { stats: ModerationStats | null }) {
  const router = useRouter();
  const hasPending = stats && stats.pendingMessages > 0;
  const hasEscalated = stats && stats.escalatedAdvisories > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Moderation Queue</CardTitle>
          <ShieldAlert className={`h-4 w-4 ${hasPending || hasEscalated ? 'text-yellow-500' : 'text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pending messages</span>
          <Badge variant={hasPending ? 'warning' : 'outline'}>
            {stats ? stats.pendingMessages : '—'}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Escalated advisories</span>
          <Badge variant={hasEscalated ? 'destructive' : 'outline'}>
            {stats ? stats.escalatedAdvisories : '—'}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Oldest pending</span>
          <span className="text-muted-foreground">
            {stats?.oldestPendingAge != null ? `${stats.oldestPendingAge}m ago` : '—'}
          </span>
        </div>
        <button
          onClick={() => router.push('/moderation')}
          className="w-full mt-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
        >
          Review Queue
        </button>
      </CardContent>
    </Card>
  );
}

// ── Recent Activity ───────────────────────────────────────────────────────────

export function RecentActivityWidget({ moments, broadcasts }: {
  moments: MomentWithSponsor[];
  broadcasts: BroadcastWithMoment[];
}) {
  const items: ActivityItem[] = [
    ...moments.slice(0, 3).map((m) => ({
      id: `moment-${m.id}`,
      label: m.title,
      description: `${m.status} · ${m.region} · ${m.category}`,
      timestamp: new Date(m.createdAt).toLocaleDateString(),
      icon: Radio,
    })),
    ...broadcasts.slice(0, 3).map((b) => ({
      id: `broadcast-${b.id}`,
      label: b.moment.title,
      description: `${b.successCount}/${b.recipientCount} delivered · ${b.status}`,
      timestamp: new Date(b.broadcastStartedAt).toLocaleDateString(),
      icon: Megaphone,
    })),
  ].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, 8);

  return <ActivityFeed title="Recent Activity" items={items} />;
}

// ── Quick Actions ─────────────────────────────────────────────────────────────

export function QuickActionsWidget() {
  const router = useRouter();

  const actions: QuickAction[] = [
    { id: 'new-moment', label: 'New Moment', description: 'Create a draft', icon: PlusCircle, onClick: () => router.push('/moments/new') },
    { id: 'broadcast-queue', label: 'Broadcast Queue', description: 'View drafts', icon: Send, onClick: () => router.push('/moments?status=draft') },
    { id: 'moderation', label: 'Review Moderation', description: 'Pending items', icon: ShieldAlert, onClick: () => router.push('/moderation') },
    { id: 'subscribers', label: 'Subscribers', description: 'View audience', icon: Users, onClick: () => router.push('/subscribers') },
    { id: 'campaigns', label: 'Campaigns', description: 'Active campaigns', icon: TrendingUp, onClick: () => router.push('/campaigns') },
    { id: 'settings', label: 'Platform Settings', description: 'System config', icon: Settings, onClick: () => router.push('/settings') },
  ];

  return <QuickActions title="Quick Actions" actions={actions} />;
}

// ── Operational Health ────────────────────────────────────────────────────────

export function OperationalHealthWidget({ metrics }: { metrics: DashboardMetrics | null }) {
  const intentStatus = metrics?.systemStatus.intentSystem;

  const services: { label: string; icon: React.ElementType; healthy: boolean | null }[] = [
    { label: 'Database', icon: Database, healthy: metrics ? true : null },
    { label: 'Auth Service', icon: Zap, healthy: metrics ? true : null },
    { label: 'Edge Functions', icon: Send, healthy: metrics ? intentStatus === 'healthy' : null },
    { label: 'Storage', icon: HardDrive, healthy: metrics ? true : null },
    { label: 'Realtime', icon: Wifi, healthy: metrics ? true : null },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {services.map(({ label, icon: Icon, healthy }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </div>
            {healthy === null
              ? <StatusBadge status="pending" label="Checking…" />
              : healthy
              ? <StatusBadge status="active" label="Healthy" />
              : <StatusBadge status="error" label="Degraded" />
            }
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Recent Moments ────────────────────────────────────────────────────────────

export function RecentMomentsWidget({ moments }: { moments: MomentWithSponsor[] }) {
  const router = useRouter();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Moments</CardTitle>
          <Radio className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {moments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No moments yet</p>
        ) : (
          <ul className="space-y-2">
            {moments.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-accent rounded-md px-2 py-1 transition-colors"
                onClick={() => router.push(`/moments/${m.id}`)}
              >
                <span className="truncate flex-1 mr-2">{m.title}</span>
                <Badge variant="outline">{m.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Upcoming Scheduled ────────────────────────────────────────────────────────

export function UpcomingScheduledWidget({ moments }: { moments: MomentWithSponsor[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Scheduled</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {moments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No scheduled moments</p>
        ) : (
          <ul className="space-y-2">
            {moments.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1 mr-2">{m.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString() : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Recent Broadcasts ─────────────────────────────────────────────────────────

export function RecentBroadcastsWidget({ broadcasts }: { broadcasts: BroadcastWithMoment[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Broadcasts</CardTitle>
          <Megaphone className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {broadcasts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No broadcasts yet</p>
        ) : (
          <ul className="space-y-2">
            {broadcasts.map((b) => {
              const rate = b.recipientCount > 0
                ? Math.round((b.successCount / b.recipientCount) * 100)
                : 0;
              return (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{b.moment.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{rate}%</span>
                    <Badge variant={b.status === 'completed' ? 'success' : b.status === 'failed' ? 'destructive' : 'outline'}>
                      {b.status}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
