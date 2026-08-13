import { PageHeader } from '@unami/ui';
import { getUNCIPClient, getUNCIPSession } from '@/lib/auth/operator';
import { redirect } from 'next/navigation';
import { UNCIPMap } from '@/components/uncip/map/UNCIPMap';

export default async function MapPage() {
  const session = await getUNCIPSession();
  if (!session) redirect('/login');

  const client = await getUNCIPClient();

  // Fetch active alerts with timeline (for sighting pins on internal roles)
  const alertsRes = await client?.alerts.list({ limit: 200, status: 'active' }).catch(() => null);
  const alerts = alertsRes?.data ?? [];

  // For internal roles, fetch full alert detail to get timeline sighting coordinates
  // Community role gets list-level data only (no timeline, no child_id)
  const enriched = session.role !== 'community'
    ? await Promise.all(
        alerts.map((a) =>
          client?.alerts.get(a.id).then((r) => r.data).catch(() => a) ?? Promise.resolve(a),
        ),
      )
    : alerts;

  const description = session.role === 'community'
    ? 'Active alerts in your area. Child identity is not shown.'
    : `${alerts.length} active alert${alerts.length !== 1 ? 's' : ''} with location data.`;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader className="shrink-0" title="Map" description={description} />
      <div className="min-h-0" style={{ height: 'calc(100svh - 3rem - 7rem)' }}>
        <UNCIPMap alerts={enriched} role={session.role} />
      </div>
    </div>
  );
}
