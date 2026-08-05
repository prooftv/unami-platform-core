import { PageHeader } from '@unami/ui';
import { fetchAggregatedLineage, fetchAggregatedTcrs } from '@/lib/nodes/fetcher';
import { MemoryKPIs, TcrsSummaryWidget, Layer5OutputsWidget, LineageCoverageWidget } from '@/app/(umkhandlu)/dashboard/widgets/MemoryWidgets';

export default async function AuditIntelligencePage() {
  const [lineage, tcrs] = await Promise.all([
    fetchAggregatedLineage(),
    fetchAggregatedTcrs(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit & Institutional Memory"
        description="Lineage integrity, TCRS conflict resolution, and Layer 5 outputs"
      />
      <MemoryKPIs lineage={lineage} tcrs={tcrs} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TcrsSummaryWidget summary={tcrs} />
        <Layer5OutputsWidget summary={lineage} />
      </div>
      <LineageCoverageWidget summary={lineage} />
    </div>
  );
}
