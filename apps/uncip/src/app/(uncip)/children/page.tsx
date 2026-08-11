import { getUNCIPClient } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@unami/ui';
import { Baby } from 'lucide-react';
import { ChildSummaryCard } from '@/components/uncip/child/ChildSummaryCard';

export default async function ChildrenPage() {
  const client = await getUNCIPClient();
  const [childrenRes, alertsRes] = await Promise.all([
    client?.children.list({ limit: 100 }),
    client?.alerts.list({ status: 'active', limit: 100 }),
  ]);

  const children = childrenRes?.data ?? [];
  const activeAlerts = alertsRes?.data ?? [];

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Children" description="Registered children in the UNCIP system." />
        <EmptyState
          title="No children registered"
          description="Children registered by parents will appear here."
          icon={Baby}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Children"
        description={`${children.length} children registered in the UNCIP system.`}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => {
          const hasActiveAlert = activeAlerts.some((a) => a.childId === child.id);
          return (
            <a key={child.id} href={`/children/${child.id}`} className="block">
              <ChildSummaryCard child={child as never} school={null} hasActiveAlert={hasActiveAlert} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
