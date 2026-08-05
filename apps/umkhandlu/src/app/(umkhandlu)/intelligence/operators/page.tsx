import { PageHeader } from '@unami/ui';
import { fetchAllNodeOperators } from '@/lib/nodes/fetcher';
import { OperatorKPIs, NodeOperatorsWidget, OperatorRoleDistributionWidget } from '@/app/(umkhandlu)/dashboard/widgets/OperatorWidgets';

export default async function OperatorsIntelligencePage() {
  const nodeOperators = await fetchAllNodeOperators();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operator Registry"
        description="Institution custodians across all connected governance nodes"
      />
      <OperatorKPIs nodes={nodeOperators} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {nodeOperators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No operator data available — check node connectivity</p>
          ) : (
            nodeOperators.map((n) => (
              <NodeOperatorsWidget key={n.nodeId} {...n} />
            ))
          )}
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <OperatorRoleDistributionWidget nodes={nodeOperators} />
          </div>
        </div>
      </div>
    </div>
  );
}
