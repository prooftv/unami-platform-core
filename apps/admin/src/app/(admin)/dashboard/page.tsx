import { PageHeader } from '@moments/ui';
import { EmptyDashboard } from '@moments/ui';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        description="Moments v2 admin overview"
      />
      <EmptyDashboard />
    </div>
  );
}
