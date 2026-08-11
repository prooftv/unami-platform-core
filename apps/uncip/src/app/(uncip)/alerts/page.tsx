import { PageHeader, EmptyState } from '@unami/ui';
import { AlertTriangle } from 'lucide-react';

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Active and resolved missing child alerts."
      />
      <EmptyState
        title="No alerts"
        description="Missing child alerts will appear here once the backend is connected."
        icon={AlertTriangle}
      />
    </div>
  );
}
