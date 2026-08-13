import Link from 'next/link';
import { getUNCIPClient, getUNCIPSession } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@unami/ui';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertSummaryCard } from '@/components/uncip/alert/AlertSummaryCard';
import type { UNCIPAlert, UNCIPChild } from '@unami/api';

export default async function AlertsPage() {
  const [session, client] = await Promise.all([getUNCIPSession(), getUNCIPClient()]);
  const isCommunity = session?.role === 'community';

  const [alertsResult, childrenResult] = await Promise.allSettled([
    client?.alerts.list({ limit: 100 }),
    // Community: child list is not fetched — child_id is stripped from alert responses
    isCommunity ? Promise.resolve(null) : client?.children.list({ limit: 100 }),
  ]);

  const alerts: UNCIPAlert[]  = alertsResult.status   === 'fulfilled' ? (alertsResult.value?.data   ?? []) : [];
  const children: UNCIPChild[] = (!isCommunity && childrenResult.status === 'fulfilled')
    ? (childrenResult.value?.data ?? [])
    : [];

  // F4: separate active from closed
  const active = alerts.filter((a) => a.status === 'active')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const closed = alerts.filter((a) => a.status !== 'active')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const canRaise = session && ['admin', 'parent', 'school'].includes(session.role);
  const actions  = canRaise
    ? <Button asChild><Link href="/alerts/new">Raise Alert</Link></Button>
    : undefined;

  if (alerts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Alerts"
          description={isCommunity ? 'Active incidents in your area.' : 'Missing child and emergency alerts.'}
          actions={actions}
        />
        <EmptyState
          title="No active alerts"
          description={isCommunity
            ? 'There are no active incidents in your area right now.'
            : 'Active missing-child alerts will appear here when raised.'}
          icon={AlertTriangle}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description={isCommunity
          ? `${active.length} active incident${active.length !== 1 ? 's' : ''} in your area.`
          : `${alerts.length} alerts — ${active.length} active.`}
        actions={actions}
      />

      {/* Active alerts — always first */}
      {active.length > 0 && (
        <section className="space-y-3">
          {active.length > 0 && closed.length > 0 && (
            <h2 className="text-sm font-semibold text-foreground">Active</h2>
          )}
          {active.map((alert) => {
            const child = isCommunity ? null : (children.find((c) => c.id === alert.childId) ?? null);
            return (
              <Link key={alert.id} href={`/alerts/${alert.id}`} className="block">
                <AlertSummaryCard alert={alert} child={child} isCommunity={isCommunity} />
              </Link>
            );
          })}
        </section>
      )}

      {/* Closed alerts — only shown to non-community roles */}
      {!isCommunity && closed.length > 0 && (
        <section className="space-y-3">
          {active.length > 0 && (
            <h2 className="text-sm font-semibold text-muted-foreground">Closed</h2>
          )}
          {closed.map((alert) => {
            const child = children.find((c) => c.id === alert.childId) ?? null;
            return (
              <Link key={alert.id} href={`/alerts/${alert.id}`} className="block">
                <AlertSummaryCard alert={alert} child={child} isCommunity={false} />
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
