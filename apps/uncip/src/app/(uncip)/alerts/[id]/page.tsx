import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { getUNCIPClient } from '@/lib/auth/operator';
import { AlertDetailPanel } from '@/components/uncip/alert/AlertDetailPanel';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlertDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await getUNCIPClient();

  const alertRes = await client?.alerts.get(id).catch(() => null);
  if (!alertRes?.data) notFound();

  const alert = alertRes.data;
  const child = await client?.children.get(alert.childId).then((r) => r.data).catch(() => null);
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
        <AlertDetailPanel alert={alert as never} child={child as never} users={{}} />
      </div>
    </div>
  );
}
