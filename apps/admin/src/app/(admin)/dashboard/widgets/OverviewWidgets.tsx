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

export function TodayKPIs() {
  return (
    <KPIGrid columns={4}>
      <MetricCard title="Moments Published" value="—" description="No data yet" icon={Radio} />
      <MetricCard title="Broadcasts Sent" value="—" description="No data yet" icon={Megaphone} />
      <MetricCard title="New Subscribers" value="—" description="No data yet" icon={Users} />
      <MetricCard title="Delivery Rate" value="—" description="No data yet" icon={TrendingUp} />
    </KPIGrid>
  );
}

export function BroadcastQueueWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Broadcast Queue</CardTitle>
          <Badge variant="outline">0 pending</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-6">
          No moments awaiting broadcast
        </p>
      </CardContent>
    </Card>
  );
}

export function ModerationQueueWidget() {
  const router = useRouter();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Moderation Queue</CardTitle>
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pending messages</span>
          <Badge variant="outline">0</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Escalated advisories</span>
          <Badge variant="outline">0</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Oldest pending</span>
          <span className="text-muted-foreground">—</span>
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

const PLACEHOLDER_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    label: 'Dashboard ready',
    description: 'Operational command centre composed',
    timestamp: 'Just now',
    icon: TrendingUp,
  },
  {
    id: '2',
    label: 'Edge Functions live',
    description: 'auth · moments · broadcast · webhook',
    timestamp: 'Today',
    icon: Send,
  },
];

export function RecentActivityWidget() {
  return <ActivityFeed title="Recent Activity" items={PLACEHOLDER_ACTIVITY} />;
}

export function QuickActionsWidget() {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: 'new-moment',
      label: 'New Moment',
      description: 'Create a draft',
      icon: PlusCircle,
      onClick: () => router.push('/moments/new'),
    },
    {
      id: 'broadcast-queue',
      label: 'Broadcast Queue',
      description: 'View drafts',
      icon: Send,
      onClick: () => router.push('/moments?status=draft'),
    },
    {
      id: 'moderation',
      label: 'Review Moderation',
      description: 'Pending items',
      icon: ShieldAlert,
      onClick: () => router.push('/moderation'),
    },
    {
      id: 'subscribers',
      label: 'Subscribers',
      description: 'View audience',
      icon: Users,
      onClick: () => router.push('/subscribers'),
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      description: 'Active campaigns',
      icon: TrendingUp,
      onClick: () => router.push('/campaigns'),
    },
    {
      id: 'settings',
      label: 'Platform Settings',
      description: 'System config',
      icon: Settings,
      onClick: () => router.push('/settings'),
    },
  ];

  return <QuickActions title="Quick Actions" actions={actions} />;
}

const HEALTH_ITEMS: { label: string; icon: React.ElementType }[] = [
  { label: 'Database', icon: Database },
  { label: 'Auth Service', icon: Zap },
  { label: 'Edge Functions', icon: Send },
  { label: 'Storage', icon: HardDrive },
  { label: 'Realtime', icon: Wifi },
];

export function OperationalHealthWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {HEALTH_ITEMS.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </div>
            <StatusBadge status="pending" label="Checking…" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RecentMomentsWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Moments</CardTitle>
          <Radio className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-6">No moments yet</p>
      </CardContent>
    </Card>
  );
}

export function UpcomingScheduledWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Scheduled</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-6">No scheduled moments</p>
      </CardContent>
    </Card>
  );
}

export function RecentBroadcastsWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Broadcasts</CardTitle>
          <Megaphone className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-6">No broadcasts yet</p>
      </CardContent>
    </Card>
  );
}
