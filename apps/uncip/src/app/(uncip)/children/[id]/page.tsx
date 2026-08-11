import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import {
  FIXTURE_CHILDREN,
  FIXTURE_USERS,
  getSchool,
  getAlertsForChild,
} from '@/fixtures/uncip';
import { buildUsersMap } from '@/lib/fixtures/users-map';
import { ChildDetailPanel } from '@/components/uncip/child/ChildDetailPanel';
import { AlertSummaryCard } from '@/components/uncip/alert/AlertSummaryCard';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildDetailPage({ params }: Props) {
  const { id } = await params;
  const child = FIXTURE_CHILDREN.find((c) => c.id === id);
  if (!child) notFound();

  const school = getSchool(child.schoolId ?? '') ?? null;
  const alerts = getAlertsForChild(child.id);
  const hasActiveAlert = alerts.some((a) => a.status === 'active');
  const usersMap = buildUsersMap(FIXTURE_USERS);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${child.firstName} ${child.lastName}`}
        description={school?.name ?? 'No school assigned'}
        actions={
          <Button variant="outline" asChild>
            <Link href="/children">← Back to Children</Link>
          </Button>
        }
      />

      <div className="max-w-3xl space-y-6">
        <ChildDetailPanel
          child={child}
          school={school}
          hasActiveAlert={hasActiveAlert}
          users={usersMap}
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
