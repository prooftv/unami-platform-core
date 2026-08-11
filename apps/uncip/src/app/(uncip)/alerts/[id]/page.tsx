import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { FIXTURE_ALERTS, FIXTURE_CHILDREN, FIXTURE_USERS } from '@/fixtures/uncip';
import { buildUsersMap } from '@/lib/fixtures/users-map';
import { AlertDetailPanel } from '@/components/uncip/alert/AlertDetailPanel';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlertDetailPage({ params }: Props) {
  const { id } = await params;
  const alert = FIXTURE_ALERTS.find((a) => a.id === id);
  if (!alert) notFound();

  const child = FIXTURE_CHILDREN.find((c) => c.id === alert.childId) ?? null;
  const usersMap = buildUsersMap(FIXTURE_USERS);
  const childName = child ? `${child.firstName} ${child.lastName}` : 'Unknown child';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Alert — ${childName}`}
        description={`Raised ${new Date(alert.createdAt).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-2">
            {child && (
              <Button variant="outline" asChild>
                <Link href={`/children/${child.id}`}>View Child Record</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/alerts">← Back to Alerts</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl">
        <AlertDetailPanel alert={alert} child={child} users={usersMap} />
      </div>
    </div>
  );
}
