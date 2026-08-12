import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { getUNCIPClient } from '@/lib/auth/operator';
import { ChildDetailPanel } from '@/components/uncip/child/ChildDetailPanel';
import { AlertSummaryCard } from '@/components/uncip/alert/AlertSummaryCard';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await getUNCIPClient();

  const [childResult, alertsResult] = await Promise.allSettled([
    client?.children.get(id),
    client?.alerts.list({ childId: id, limit: 50 }),
  ]);

  const childRes = childResult.status === 'fulfilled' ? childResult.value : null;
  if (!childRes?.data) notFound();

  const child  = childRes.data;
  const alerts = alertsResult.status === 'fulfilled' ? (alertsResult.value?.data ?? []) : [];
  const school = child.schoolId
    ? await client?.schools.get(child.schoolId).then((r) => r.data).catch(() => null) ?? null
    : null;

  const hasActiveAlert = alerts.some((a) => a.status === 'active');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${child.firstName} ${child.lastName}`}
        description={school?.name ?? 'No school assigned'}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/alerts/new?childId=${child.id}`}>Raise Alert</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/children">← Back to Children</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-6">
        <ChildDetailPanel
          child={child}
          school={school}
          hasActiveAlert={hasActiveAlert}
          users={{}}
        />

        {alerts.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Alert History</p>
            {alerts.map((alert) => (
              <a key={alert.id} href={`/alerts/${alert.id}`} className="block">
                <AlertSummaryCard alert={alert} child={child} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
