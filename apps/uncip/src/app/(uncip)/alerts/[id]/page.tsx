import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { AlertDetailPanel } from '@/components/uncip/alert/AlertDetailPanel';
import { AlertActionPanel } from '@/components/uncip/alert/AlertActionPanel';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlertDetailPage({ params }: Props) {
  const { id } = await params;
  const [session, client] = await Promise.all([getUNCIPSession(), getUNCIPClient()]);

  const alertRes = await client?.alerts.get(id).catch(() => null);
  if (!alertRes?.data) notFound();

  const alert = alertRes.data;
  const child = await client?.children.get(alert.childId).then((r) => r.data).catch(() => null) ?? null;
  const childName = child ? `${child.firstName} ${child.lastName}` : 'Unknown child';

  async function handleAction(formData: FormData) {
    'use server';
    const c = await getUNCIPClient();
    if (!c) return;

    const action    = String(formData.get('action') ?? '');
    const alertId   = String(formData.get('alertId') ?? '');
    const note      = String(formData.get('note') ?? '').trim() || null;

    if (action === 'change_status') {
      const newStatus = formData.get('newStatus') as 'resolved' | 'cancelled' | 'false_alarm';
      const statusNote = String(formData.get('statusNote') ?? '').trim() || null;
      await c.alerts.changeStatus(alertId, { status: newStatus, note: statusNote }).catch(() => null);
    } else {
      await c.timeline.add({ alertId, action: action as never, note }).catch(() => null);
    }

    redirect(`/alerts/${alertId}`);
  }

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

      <div className="max-w-3xl space-y-4">
        <AlertDetailPanel alert={alert} child={child} users={{}} />
        {session && (
          <AlertActionPanel
            alertId={alert.id}
            currentStatus={alert.status}
            role={session.role}
            onAction={handleAction}
          />
        )}
      </div>
    </div>
  );
}
