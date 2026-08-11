import { PageHeader, EmptyState, PageSkeleton } from '@unami/ui';
import { Baby } from 'lucide-react';

export default function ChildrenPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Children"
        description="Registered children in the UNCIP system."
      />
      <EmptyState
        title="No children registered"
        description="Children registered by parents will appear here once the backend is connected."
        icon={Baby}
      />
    </div>
  );
}
