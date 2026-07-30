'use client';

import {
  AnalyticsCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  StatusBadge,
} from '@moments/ui';
import { Database, HardDrive, Zap, Send, Wifi, Flag, AlertTriangle } from 'lucide-react';

export function SystemHealthWidget() {
  const services = [
    { label: 'Database', icon: Database },
    { label: 'Auth', icon: Zap },
    { label: 'Storage', icon: HardDrive },
    { label: 'Realtime', icon: Wifi },
    { label: 'Edge Functions', icon: Send },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {services.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">—ms</span>
              <StatusBadge status="pending" label="Checking…" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function StorageUsageWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Storage Usage</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total used</span>
            <span className="font-medium">—</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-0 bg-primary rounded-full transition-all" />
          </div>
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

export function ApiHealthWidget() {
  const functions = ['moments', 'broadcast', 'auth', 'webhook'];

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
              <Badge variant="outline">—%</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FeatureFlagsWidget() {
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
            <Badge variant="outline">—</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ErrorSummaryWidget() {
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
