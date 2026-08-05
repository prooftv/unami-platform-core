import { PageHeader } from '@unami/ui';
import { fetchAggregatedCommercial } from '@/lib/nodes/fetcher';
import { CommercialKPIs, ProjectHealthWidget, ProjectStatusWidget, RecentCommercialActivityWidget } from '@/app/(umkhandlu)/dashboard/widgets/CommercialWidgets';

export default async function CommercialIntelligencePage() {
  const commercial = await fetchAggregatedCommercial();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commercial Intelligence"
        description="Projects, sponsors, and beneficiary tracking across all nodes"
      />
      <CommercialKPIs summary={commercial} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProjectHealthWidget summary={commercial} />
        <ProjectStatusWidget summary={commercial} />
      </div>
      <RecentCommercialActivityWidget summary={commercial} />
    </div>
  );
}
