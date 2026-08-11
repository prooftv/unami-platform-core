import { PageHeader, EmptyState } from '@unami/ui';
import { Shield } from 'lucide-react';

export default function StationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="SAPS Stations"
        description="Station areas used to scope alerts and user assignments."
      />
      <EmptyState
        title="No stations configured"
        description="SAPS station records will appear here once the backend is connected."
        icon={Shield}
      />
    </div>
  );
}
