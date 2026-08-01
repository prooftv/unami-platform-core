'use client';

import { useRouter } from 'next/navigation';
import { useRealtimeTable } from '@/lib/realtime/useRealtimeTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  MessageSquareWarning,
} from 'lucide-react';

// ── Platform Status Banner ───────────────────────────────────────────────────

type PlatformState = 'operational' | 'degraded' | 'attention';

function derivePlatformState(
  metrics: DashboardMetrics | null,
  queueMoments: MomentWithSponsor[],
  moderationStats: ModerationStats | null,
  scheduledMoments: MomentWithSponsor[],
): { state: PlatformState; attentionItems: string[] } {
  const items: string[] = [];

  if (queueMoments.length > 0)
    items.push(`${queueMoments.length} moment${queueMoments.length > 1 ? 's' : ''} awaiting broadcast`);

  if (moderationStats && moderationStats.escalatedAdvisories > 0)
    items.push(`${moderationStats.escalatedAdvisories} escalated advisor${moderationStats.escalatedAdvisories > 1 ? 'ies' : 'y'}`);

  if (moderationStats && moderationStats.pendingMessages > 0)
    items.push(`${moderationStats.pendingMessages} message${moderationStats.pendingMessages > 1 ? 's' : ''} pending moderation`);

  const imminent = scheduledMoments.filter((m) => {
    if (!m.scheduledAt) return false;
    const diff = new Date(m.scheduledAt).getTime() - Date.now();
    return diff > 0 && diff < 30 * 60 * 1000;
  });
  if (imminent.length > 0)
    items.push(`Broadcast scheduled in ${Math.round((new Date(imminent[0].scheduledAt!).getTime() - Date.now()) / 60000)} minutes`);

  const state: PlatformState =
    metrics === null ? 'degraded' :
    items.length > 0 ? 'attention' :
    'operational';

  return { state, attentionItems: items };
}

export function PlatformStatusBanner({
  metrics,
  queueMoments,
  moderationStats,
  scheduledMoments,
}: {
  metrics: DashboardMetrics | null;
  queueMoments: MomentWithSponsor[];
  moderationStats: ModerationStats | null;
  scheduledMoments: MomentWithSponsor[];
}) {
  const { state, attentionItems } = derivePlatformState(metrics, queueMoments, moderationStats, scheduledMoments);

  if (state === 'operational') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
        <span className="text-sm font-medium text-green-800 dark:text-green-300">Platform operational — no items require attention</span>
      </div>
    );
  }

  if (state === 'degraded') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
        <span className="text-sm font-medium text-red-800 dark:text-red-300">Platform status unavailable — check connectivity</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Needs attention ({attentionItems.length})
        </span>
      </div>
      <ul className="ml-7 space-y-1">
        {attentionItems.map((item) => (
          <li key={item} className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Today's Operations Panel ──────────────────────────────────────────────────

export function TodaysOperationsPanel({
  queueMoments,
  moderationStats,
  scheduledMoments,
}: {
  queueMoments: MomentWithSponsor[];
  moderationStats: ModerationStats | null;
  scheduledMoments: MomentWithSponsor[];
}) {
  const router = useRouter();
  useRealtimeTable('moments', () => router.refresh());
  useRealtimeTable('messages', () => router.refresh());

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Broadcast Queue */}
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">Broadcast Queue</CardTitle>
            <CardDescription className="text-xs mt-0.5">Moments awaiting transmission</CardDescription>
          </div>
          <Badge variant={queueMoments.length > 0 ? 'secondary' : 'outline'}>
            {queueMoments.length} pending
          </Badge>
        </CardHeader>
        <CardContent>
          {queueMoments.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">Queue clear</p>
          ) : (
            <ul className="space-y-1.5">
              {queueMoments.slice(0, 4).map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-accent rounded px-1.5 py-1 transition-colors"
                  onClick={() => router.push(`/moments/${m.id}`)}
                >
                  <span className="truncate flex-1 mr-2">{m.title}</span>
                  <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => router.push('/moments?status=draft')}
            className="mt-3 w-full text-xs text-primary hover:underline text-left"
          >
            View all →
          </button>
        </CardContent>
      </Card>

      {/* Moderation Queue */}
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">Moderation</CardTitle>
            <CardDescription className="text-xs mt-0.5">Inbound messages pending review</CardDescription>
          </div>
          <Badge variant={moderationStats && moderationStats.pendingMessages > 0 ? 'secondary' : 'outline'}>
            {moderationStats?.pendingMessages ?? 0} pending
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pending review</span>
            <span className="font-medium">{moderationStats?.pendingMessages ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Escalated</span>
            <span className={moderationStats && moderationStats.escalatedAdvisories > 0 ? 'font-medium text-destructive' : 'font-medium'}>
              {moderationStats?.escalatedAdvisories ?? '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Oldest pending</span>
            <span className="text-muted-foreground">
              {moderationStats?.oldestPendingAge != null ? `${moderationStats.oldestPendingAge}m ago` : '—'}
            </span>
          </div>
          <button
            onClick={() => router.push('/moderation')}
            className="mt-2 w-full text-xs text-primary hover:underline text-left"
          >
            Review queue →
          </button>
        </CardContent>
      </Card>

      {/* Scheduled Publications */}
      <Card>
        <CardHeader className="flex-row items-center justify-between border-b pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">Scheduled</CardTitle>
            <CardDescription className="text-xs mt-0.5">Upcoming publications</CardDescription>
          </div>
          <Badge variant="outline">
            {scheduledMoments.length} upcoming
          </Badge>
        </CardHeader>
        <CardContent>
          {scheduledMoments.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">Nothing scheduled</p>
          ) : (
            <ul className="space-y-1.5">
              {scheduledMoments.slice(0, 4).map((m) => (
                <li key={m.id} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1 mr-2">{m.title}</span>
                  <span className="text-muted-foreground shrink-0">
                    {m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => router.push('/moments?status=scheduled')}
            className="mt-3 w-full text-xs text-primary hover:underline text-left"
          >
            View all →
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Today's KPIs ──────────────────────────────────────────────────────────────

export function TodayKPIs({ metrics }: { metrics: DashboardMetrics | null }) {
  const kpis = [
    { title: 'Total Moments', value: metrics ? metrics.totalMoments : '—', description: metrics ? `${metrics.broadcastedMoments} broadcasted` : 'No data', icon: Radio },
    { title: 'Broadcasts Sent', value: metrics ? metrics.totalBroadcasts : '—', description: metrics ? `${metrics.failedBroadcasts} failed` : 'No data', icon: Megaphone },
    { title: 'Active Subscribers', value: metrics ? metrics.activeSubscribers : '—', description: metrics ? `${metrics.totalSubscribers} total` : 'No data', icon: Users },
    { title: 'Delivery Rate', value: metrics ? metrics.successRate : '—', description: metrics ? `${metrics.successfulBroadcasts} successful` : 'No data', icon: TrendingUp },
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

// ── Broadcast Queue ───────────────────────────────────────────────────────────

export function BroadcastQueueWidget({ moments }: { moments: MomentWithSponsor[] }) {
  const router = useRouter();
  useRealtimeTable('moments', () => router.refresh());
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Broadcast Queue</CardTitle>
          <Badge variant={moments.length > 0 ? 'secondary' : 'outline'}>
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
  useRealtimeTable('messages', () => router.refresh());
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
          <Badge variant={hasPending ? 'secondary' : 'outline'}>
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
  const items = [
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

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Recent Activity</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No recent activity.</p>
        ) : items.map(({ id, label, description, timestamp, icon: Icon }) => (
          <div key={id} className="flex items-start gap-2 text-xs">
            <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-muted-foreground">{description}</p>
              <p className="text-muted-foreground">{timestamp}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────

export function QuickActionsWidget() {
  const router = useRouter();
  const actions = [
    { id: 'new-moment', label: 'New Moment', description: 'Create a draft', icon: PlusCircle, href: '/moments/new' },
    { id: 'broadcast-queue', label: 'Broadcast Queue', description: 'View drafts', icon: Send, href: '/moments?status=draft' },
    { id: 'moderation', label: 'Review Moderation', description: 'Pending items', icon: ShieldAlert, href: '/moderation' },
    { id: 'subscribers', label: 'Subscribers', description: 'View audience', icon: Users, href: '/subscribers' },
    { id: 'campaigns', label: 'Campaigns', description: 'Active campaigns', icon: TrendingUp, href: '/campaigns' },
    { id: 'settings', label: 'Platform Settings', description: 'System config', icon: Settings, href: '/settings' },
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {actions.map(({ id, label, description, icon: Icon, href }) => (
          <button key={id} onClick={() => router.push(href)} className="flex items-start gap-2 rounded-md border p-2 text-left text-xs hover:bg-accent transition-colors">
            <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
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
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm font-semibold">Platform Health</CardTitle>
        <CardDescription className="text-xs">Service status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {services.map(({ label, icon: Icon, healthy }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </div>
            {healthy === null
              ? <Badge variant="secondary">Checking…</Badge>
              : healthy
              ? <Badge variant="default">Healthy</Badge>
              : <Badge variant="destructive">Degraded</Badge>
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
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Recent Moments</CardTitle>
          <CardDescription className="text-xs mt-0.5">Latest community content</CardDescription>
        </div>
        <Radio className="h-4 w-4 text-muted-foreground" />
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
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Recent Broadcasts</CardTitle>
          <CardDescription className="text-xs mt-0.5">WhatsApp delivery history</CardDescription>
        </div>
        <Megaphone className="h-4 w-4 text-muted-foreground" />
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
                    <Badge variant={b.status === 'completed' ? 'default' : b.status === 'failed' ? 'destructive' : 'outline'}>
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
