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
import type { BroadcastWithMoment, IntentStats } from '@moments/api';
import { Send, AlertTriangle, Cpu } from 'lucide-react';

export function DeliverySuccessWidget({ broadcasts }: { broadcasts: BroadcastWithMoment[] }) {
  const completed = broadcasts.filter((b) => b.status === 'completed');
  const avgRate = completed.length > 0
    ? Math.round(
        completed.reduce((sum, b) =>
          sum + (b.recipientCount > 0 ? b.successCount / b.recipientCount : 0), 0
        ) / completed.length * 100
      )
    : null;

  const data = completed.map((b) => ({
    label: new Date(b.broadcastStartedAt ?? b.createdAt).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
    rate: b.recipientCount > 0 ? Math.round((b.successCount / b.recipientCount) * 100) : 0,
  }));

  return (
    <AnalyticsCard
      title="Delivery Success Rate"
      description={avgRate !== null ? `${avgRate}% avg over last ${broadcasts.length} broadcasts` : 'No broadcast data yet'}
    >
      <LineChart
        data={data}
        series={[{ key: 'rate', label: 'Success %' }]}
        height={180}
        emptyMessage="No broadcast data yet"
      />
    </AnalyticsCard>
  );
}

export function FailedBroadcastsWidget({ broadcasts }: { broadcasts: BroadcastWithMoment[] }) {
  const failed = broadcasts.filter((b) => b.failureCount > 0 || b.status === 'failed');
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Failed Broadcasts</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${failed.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent>
        {failed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No failed broadcasts</p>
        ) : (
          <ul className="space-y-2">
            {failed.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1 mr-2">{b.moment.title}</span>
                <Badge variant="destructive">{b.failureCount} failed</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function AutomationStatusWidget({ stats }: { stats: IntentStats | null }) {
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
          { label: 'Pending intents', value: stats ? String(stats.pending) : '—', alert: stats ? stats.pending > 10 : false },
          { label: 'Processing', value: stats ? String(stats.processing) : '—', alert: false },
          { label: 'Failed intents', value: stats ? String(stats.failed) : '—', alert: stats ? stats.failed > 0 : false },
          { label: 'Last processed', value: stats?.lastProcessedAt ? new Date(stats.lastProcessedAt).toLocaleTimeString() : '—', alert: false },
        ].map(({ label, value, alert }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-medium ${alert ? 'text-destructive' : ''}`}>{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function OperationsBroadcastQueueWidget({ broadcasts }: { broadcasts: BroadcastWithMoment[] }) {
  const pending = broadcasts.filter((b) => b.status === 'pending').length;
  const processing = broadcasts.filter((b) => b.status === 'processing').length;
  const completed = broadcasts.filter((b) => b.status === 'completed').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Publishing Pipeline</CardTitle>
          <Send className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pending</span>
          <Badge variant="outline">{pending}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Processing</span>
          <Badge variant="info">{processing}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Completed</span>
          <Badge variant="success">{completed}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
