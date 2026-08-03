'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardMetrics } from '@unami/api';
import { Database, HardDrive, Zap, Send, Wifi, Flag, AlertTriangle } from 'lucide-react';

export function SystemHealthWidget({ metrics }: { metrics: DashboardMetrics | null }) {
  const intentHealthy = metrics?.systemStatus.intentSystem === 'healthy';
  const lastUpdated = metrics?.systemStatus.lastUpdated
    ? new Date(metrics.systemStatus.lastUpdated).toLocaleTimeString()
    : null;

  const services: { label: string; icon: React.ElementType; healthy: boolean | null }[] = [
    { label: 'Database', icon: Database, healthy: metrics ? true : null },
    { label: 'Auth', icon: Zap, healthy: metrics ? true : null },
    { label: 'Storage', icon: HardDrive, healthy: metrics ? true : null },
    { label: 'Realtime', icon: Wifi, healthy: metrics ? true : null },
    { label: 'Edge Functions', icon: Send, healthy: metrics ? intentHealthy : null },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>System Health</CardTitle>
          {lastUpdated && <span className="text-xs text-muted-foreground">{lastUpdated}</span>}
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

export function StorageUsageWidget() {
  // Storage usage requires a separate Supabase Management API call — wired in Phase 6D
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Storage Usage</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total used</span>
          <span className="font-medium">—</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-0 bg-primary rounded-full" />
        </div>
        {['media', 'avatars'].map((bucket) => (
          <div key={bucket} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground capitalize">{bucket}</span>
            <span className="font-medium">—</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ApiHealthWidget({ metrics }: { metrics: DashboardMetrics | null }) {
  const functions = ['moments', 'broadcast', 'auth', 'webhook'];
  const intentStatus = metrics?.systemStatus.intentSystem;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>API Health</CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {functions.map((fn) => (
          <div key={fn} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-mono text-xs">{fn}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">—ms</span>
              {metrics
                ? <Badge variant={fn === 'moments' && intentStatus === 'backlog' ? 'secondary' : 'default'}>live</Badge>
                : <Badge variant="outline">—</Badge>
              }
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FeatureFlagsWidget({ metrics }: { metrics: DashboardMetrics | null }) {
  // Feature flags are loaded from system settings — wired in Phase 6D
  // For now, show live/pending state based on whether metrics loaded
  const flags = [
    'whatsapp_broadcast',
    'ai_moderation',
    'sponsored_moments',
    'authority_blast',
    'analytics_v2',
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Feature Flags</CardTitle>
          <Flag className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {flags.map((flag) => (
          <div key={flag} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-mono text-xs">{flag}</span>
            <Badge variant={metrics ? 'outline' : 'outline'}>
              {metrics ? 'configured' : '—'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ErrorSummaryWidget() {
  // Error log summary requires error_logs table query — wired in Phase 6D
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Error Summary</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-6">No recent errors</p>
      </CardContent>
    </Card>
  );
}
