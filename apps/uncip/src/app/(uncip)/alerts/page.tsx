import Link from 'next/link';
import { getUNCIPClient } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@unami/ui';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertSummaryCard } from '@/components/uncip/alert/AlertSummaryCard';

export default async function AlertsPage() {
  const client = await getUNCIPClient();
  const [alertsRes, childrenRes] = await Promise.all([
    client?.alerts.list({ limit: 100 }),
    client?.children.list({ limit: 100 }),
  ]);

  const alerts   = alertsRes?.data ?? [];
  const children = childrenRes?.data ?? [];

  const sorted = [...alerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const actions = <Button asChild><Link href="/alerts/new">Raise Alert</Link></Button>;
  const activeCount = alerts.filter((a) => a.status === 'active').length;

  if (sorted.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Alerts" description="Missing child and emergency alerts." actions={actions} />
        <EmptyState title="No alerts" description="Missing child alerts will appear here when raised." icon={AlertTriangle} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" description={`${alerts.length} alerts — ${activeCount} active.`} actions={actions} />
      <div className="space-y-3">
        {sorted.map((alert) => {
          const child = children.find((c) => c.id === alert.childId) ?? null;
          return (
            <a key={alert.id} href={`/alerts/${alert.id}`} className="block">
              <AlertSummaryCard alert={alert} child={child} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
