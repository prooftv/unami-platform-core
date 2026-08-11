import { PageHeader, EmptyState } from '@unami/ui';
import { AlertTriangle } from 'lucide-react';
import { FIXTURE_ALERTS, FIXTURE_CHILDREN } from '@/fixtures/uncip';
import { AlertSummaryCard } from '@/components/uncip/alert/AlertSummaryCard';

export default function AlertsPage() {
  const sorted = [...FIXTURE_ALERTS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Alerts" description="Missing child and emergency alerts." />
        <EmptyState
          title="No alerts"
          description="Missing child alerts will appear here when raised."
          icon={AlertTriangle}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description={`${FIXTURE_ALERTS.length} alerts — ${FIXTURE_ALERTS.filter((a) => a.status === 'active').length} active.`}
      />
      <div className="space-y-3">
        {sorted.map((alert) => {
          const child = FIXTURE_CHILDREN.find((c) => c.id === alert.childId) ?? null;
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
