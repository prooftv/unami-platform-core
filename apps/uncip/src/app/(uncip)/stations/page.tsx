import { PageHeader, EmptyState } from '@unami/ui';
import { Shield } from 'lucide-react';
import { FIXTURE_STATIONS } from '@/fixtures/uncip';
import { StationSummaryCard } from '@/components/uncip/station/StationSummaryCard';

export default function StationsPage() {
  if (FIXTURE_STATIONS.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="SAPS Stations" description="Station areas used to scope alerts and user assignments." />
        <EmptyState
          title="No stations configured"
          description="SAPS station records will appear here once configured."
          icon={Shield}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SAPS Stations"
        description={`${FIXTURE_STATIONS.length} station areas configured.`}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIXTURE_STATIONS.map((station) => (
          <StationSummaryCard key={station.id} station={station} />
        ))}
      </div>
    </div>
  );
}
