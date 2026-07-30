'use client';

import { useRouter } from 'next/navigation';
import {
  PageHeader,
  KPIGrid,
  MetricCard,
  ActivityFeed,
  QuickActions,
} from '@moments/ui';
import type { ActivityItem, QuickAction } from '@moments/ui';
import type { AdminSession } from '@moments/api';
import {
  Radio,
  Megaphone,
  Users,
  TrendingUp,
  PlusCircle,
  Send,
  BarChart2,
  Settings,
} from 'lucide-react';

const ROLE_LABELS: Record<AdminSession['role'], string> = {
  superadmin:    'Super Admin',
  content_admin: 'Content Admin',
  moderator:     'Moderator',
  viewer:        'Viewer',
};

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    label: 'Platform ready',
    description: 'Database schema applied — 26 tables live',
    timestamp: 'Just now',
    icon: TrendingUp,
  },
  {
    id: '2',
    label: 'Edge Functions deployed',
    description: 'auth · moments · broadcast · webhook',
    timestamp: 'Today',
    icon: Send,
  },
];

export function DashboardClient({ session }: { session: AdminSession }) {
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
      id: 'moments',
      label: 'All Moments',
      description: 'View & manage',
      icon: Radio,
      onClick: () => router.push('/moments'),
    },
    {
      id: 'broadcasts',
      label: 'Broadcasts',
      description: 'Delivery history',
      icon: Megaphone,
      onClick: () => router.push('/broadcasts'),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Engagement data',
      icon: BarChart2,
      onClick: () => router.push('/analytics'),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${session.name ?? session.email} · ${ROLE_LABELS[session.role]}`}
      />

      <KPIGrid columns={4}>
        <MetricCard
          title="Total Moments"
          value="—"
          description="No moments yet"
          icon={Radio}
        />
        <MetricCard
          title="Broadcasts Sent"
          value="—"
          description="No broadcasts yet"
          icon={Megaphone}
        />
        <MetricCard
          title="Subscribers"
          value="—"
          description="No subscribers yet"
          icon={Users}
        />
        <MetricCard
          title="Delivery Rate"
          value="—"
          description="No data yet"
          icon={TrendingUp}
        />
      </KPIGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions actions={actions} />
        <ActivityFeed items={RECENT_ACTIVITY} />
      </div>
    </div>
  );
}
