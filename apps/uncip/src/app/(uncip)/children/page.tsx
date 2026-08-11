import { PageHeader, EmptyState } from '@unami/ui';
import { Baby } from 'lucide-react';
import { FIXTURE_CHILDREN, getSchool, getAlertsForChild } from '@/fixtures/uncip';
import { ChildSummaryCard } from '@/components/uncip/child/ChildSummaryCard';

export default function ChildrenPage() {
  if (FIXTURE_CHILDREN.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Children" description="Registered children in the UNCIP system." />
        <EmptyState
          title="No children registered"
          description="Children registered by parents will appear here."
          icon={Baby}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Children"
        description={`${FIXTURE_CHILDREN.length} children registered in the UNCIP system.`}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FIXTURE_CHILDREN.map((child) => {
          const school = getSchool(child.schoolId ?? '') ?? null;
          const hasActiveAlert = getAlertsForChild(child.id).some((a) => a.status === 'active');
          return (
            <a key={child.id} href={`/children/${child.id}`} className="block">
              <ChildSummaryCard child={child} school={school} hasActiveAlert={hasActiveAlert} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
