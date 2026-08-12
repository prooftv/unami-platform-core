import Link from 'next/link';
import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@unami/ui';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StationSummaryCard } from '@/components/uncip/station/StationSummaryCard';

export default async function StationsPage() {
  const [session, client] = await Promise.all([getUNCIPSession(), getUNCIPClient()]);
  const res = await client?.stations.list();
  const stations = res?.data ?? [];
  const isAdmin = session?.role === 'admin';

  const actions = isAdmin ? (
    <Button asChild><Link href="/stations/new">Add Station</Link></Button>
  ) : undefined;

  if (stations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="SAPS Stations" description="Station areas used to scope alerts and user assignments." actions={actions} />
        <EmptyState title="No stations configured" description="SAPS station records will appear here once configured." icon={Shield} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="SAPS Stations" description={`${stations.length} station areas configured.`} actions={actions} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stations.map((station) => (
          <StationSummaryCard key={station.id} station={station} />
        ))}
      </div>
    </div>
  );
}
