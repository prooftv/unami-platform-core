'use client';

import {
  AnalyticsCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  LineChart,
} from '@moments/ui';
import { Send, AlertTriangle, Cpu } from 'lucide-react';

export function DeliverySuccessWidget() {
  return (
    <AnalyticsCard
      title="Delivery Success Rate"
      description="Rolling 30-day broadcast success percentage"
    >
      <LineChart height={180} />
    </AnalyticsCard>
  );
}

export function FailedBroadcastsWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Failed Broadcasts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-6">No failed broadcasts</p>
      </CardContent>
    </Card>
  );
}

export function AutomationStatusWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Automation Status</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[
          { label: 'Pending intents', value: '—' },
          { label: 'Processing', value: '—' },
          { label: 'Failed intents', value: '—' },
          { label: 'Last processed', value: '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function OperationsBroadcastQueueWidget() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Publishing Pipeline</CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {[
          { label: 'Draft', variant: 'outline' as const },
          { label: 'Scheduled', variant: 'warning' as const },
          { label: 'Processing', variant: 'info' as const },
        ].map(({ label, variant }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <Badge variant={variant}>0</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
