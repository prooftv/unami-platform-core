'use client';

import {
  PageHeader, Card, CardContent, CardHeader, CardTitle,
  KPIGrid, MetricCard, Badge, StatusBadge,
} from '@moments/ui';
import type { AdminSession, DashboardMetrics } from '@moments/api';
import { Database, Zap, HardDrive, Wifi, Send, Users, Radio, Megaphone } from 'lucide-react';

interface Props {
  session: AdminSession;
  metrics: DashboardMetrics | null;
}

export function SettingsClient({ session, metrics }: Props) {
  const intentHealthy = metrics?.systemStatus.intentSystem === 'healthy';
  const lastUpdated = metrics?.systemStatus.lastUpdated
    ? new Date(metrics.systemStatus.lastUpdated).toLocaleString()
    : null;

  const services = [
    { label: 'Database', icon: Database, healthy: metrics ? true : null },
    { label: 'Auth Service', icon: Zap, healthy: metrics ? true : null },
    { label: 'Storage', icon: HardDrive, healthy: metrics ? true : null },
    { label: 'Realtime', icon: Wifi, healthy: metrics ? true : null },
    { label: 'Edge Functions', icon: Send, healthy: metrics ? intentHealthy : null },
  ];

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <PageHeader
        title="Settings"
        description="System status, platform configuration and session information"
      />

      <KPIGrid columns={4}>
        <MetricCard title="Total Moments" value={metrics ? metrics.totalMoments : '—'} description="In database" icon={Radio} />
        <MetricCard title="Total Broadcasts" value={metrics ? metrics.totalBroadcasts : '—'} description="All time" icon={Megaphone} />
        <MetricCard title="Active Subscribers" value={metrics ? metrics.activeSubscribers : '—'} description="Opted in" icon={Users} />
        <MetricCard title="Delivery Rate" value={metrics ? metrics.successRate : '—'} description="All time" icon={Zap} />
      </KPIGrid>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Health</CardTitle>
            {lastUpdated && <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>}
          </div>
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

      <Card>
        <CardHeader><CardTitle>Intent Processor</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            {metrics
              ? <Badge variant={intentHealthy ? 'success' : 'warning'}>{metrics.systemStatus.intentSystem}</Badge>
              : <Badge variant="outline">—</Badge>
            }
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pending intents</span>
            <span className="font-medium">{metrics ? metrics.recentActivity : '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current Session</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{session.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="default">{session.role}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-muted-foreground">{session.id}</span>
          </div>
          {session.authority_id && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Authority ID</span>
              <span className="font-mono text-xs text-muted-foreground">{session.authority_id}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Platform Configuration</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            System settings (monthly budget, message cost, daily limits) and feature flags are managed
            via the Supabase dashboard → <code className="font-mono text-xs">system_settings</code> and{' '}
            <code className="font-mono text-xs">feature_flags</code> tables.
            A live settings editor will be added in a future phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
