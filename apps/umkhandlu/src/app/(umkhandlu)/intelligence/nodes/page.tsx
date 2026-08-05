import { PageHeader } from '@unami/ui';
import { getRegisteredNodes } from '@/lib/nodes/fetcher';
import { getNodeClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';
import type { NodeHealth, RecordsSummary, NoticesSummary, CommercialSummary } from '@unami/api';

type NodeSnapshot = {
  id: string;
  name: string;
  authority: string;
  health: NodeHealth | null;
  records: RecordsSummary | null;
  notices: NoticesSummary | null;
  commercial: CommercialSummary | null;
};

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

const STATUS_ICON = {
  healthy:     <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  degraded:    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  unreachable: <WifiOff className="h-3.5 w-3.5 text-destructive" />,
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  healthy:     'default',
  degraded:    'secondary',
  unreachable: 'destructive',
};

export default async function CrossNodePage() {
  const nodes = await getRegisteredNodes();

  const snapshots: NodeSnapshot[] = await Promise.all(
    nodes.map(async (node) => {
      const client = getNodeClient(node.url, node.api_key);
      const [health, records, notices, commercial] = await Promise.all([
        safe(() => client.health()),
        safe(() => client.recordsSummary()),
        safe(() => client.noticesSummary()),
        safe(() => client.commercialSummary()),
      ]);
      return { id: node.id, name: node.name, authority: node.authority, health, records, notices, commercial };
    }),
  );

  // Aggregated totals
  const totals = {
    records:      snapshots.reduce((s, n) => s + (n.records?.total ?? 0), 0),
    adopted:      snapshots.reduce((s, n) => s + (n.records?.byStatus.adopted ?? 0), 0),
    notices:      snapshots.reduce((s, n) => s + (n.notices?.total ?? 0), 0),
    statutory:    snapshots.reduce((s, n) => s + (n.notices?.statutory.total ?? 0), 0),
    projects:     snapshots.reduce((s, n) => s + (n.commercial?.projects.total ?? 0), 0),
    beneficiaries: snapshots.reduce((s, n) => s + (n.commercial?.projects.totalBeneficiaries ?? 0), 0),
    budget:       snapshots.reduce((s, n) => s + (n.commercial?.projects.totalBudget ?? 0), 0),
  };

  const budgetFormatted = new Intl.NumberFormat('en-ZA', {
    style: 'currency', currency: 'ZAR', maximumFractionDigits: 0,
  }).format(totals.budget);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cross-Node Intelligence"
        description="Aggregated and comparative intelligence across all registered governance nodes"
      />

      {/* Aggregated KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl">
        {[
          { label: 'Total Records',      value: totals.records },
          { label: 'Total Notices',      value: totals.notices },
          { label: 'Total Projects',     value: totals.projects },
          { label: 'Total Beneficiaries', value: totals.beneficiaries },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-node comparison table */}
      <div className="max-w-5xl">
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-semibold">Node Comparison</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {snapshots.length} node{snapshots.length !== 1 ? 's' : ''} · combined budget {budgetFormatted}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Node</th>
                    <th className="text-center font-medium text-muted-foreground px-3 py-3">Status</th>
                    <th className="text-center font-medium text-muted-foreground px-3 py-3">Records</th>
                    <th className="text-center font-medium text-muted-foreground px-3 py-3">Adopted</th>
                    <th className="text-center font-medium text-muted-foreground px-3 py-3">Notices</th>
                    <th className="text-center font-medium text-muted-foreground px-3 py-3">Statutory</th>
                    <th className="text-center font-medium text-muted-foreground px-3 py-3">Projects</th>
                    <th className="text-center font-medium text-muted-foreground px-3 py-3">Beneficiaries</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {snapshots.map((node) => (
                    <tr key={node.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{node.name}</div>
                        <div className="text-xs text-muted-foreground">{node.authority}</div>
                      </td>
                      <td className="text-center px-3 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {STATUS_ICON[node.health?.status ?? 'unreachable']}
                          <Badge variant={STATUS_VARIANT[node.health?.status ?? 'unreachable']} className="text-xs">
                            {node.health?.status ?? 'unreachable'}
                          </Badge>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3 font-medium">{node.records?.total ?? '—'}</td>
                      <td className="text-center px-3 py-3">{node.records?.byStatus.adopted ?? '—'}</td>
                      <td className="text-center px-3 py-3 font-medium">{node.notices?.total ?? '—'}</td>
                      <td className="text-center px-3 py-3">{node.notices?.statutory.total ?? '—'}</td>
                      <td className="text-center px-3 py-3 font-medium">{node.commercial?.projects.total ?? '—'}</td>
                      <td className="text-center px-3 py-3">{node.commercial?.projects.totalBeneficiaries ?? '—'}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-muted/40 font-semibold">
                    <td className="px-4 py-3 text-muted-foreground">Total ({snapshots.length} nodes)</td>
                    <td className="px-3 py-3" />
                    <td className="text-center px-3 py-3">{totals.records}</td>
                    <td className="text-center px-3 py-3">{totals.adopted}</td>
                    <td className="text-center px-3 py-3">{totals.notices}</td>
                    <td className="text-center px-3 py-3">{totals.statutory}</td>
                    <td className="text-center px-3 py-3">{totals.projects}</td>
                    <td className="text-center px-3 py-3">{totals.beneficiaries}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-node governance breakdown */}
      {snapshots.length > 0 && (
        <div className="max-w-5xl space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Per-Node Breakdown</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {snapshots.map((node) => (
              <Card key={node.id}>
                <CardHeader className="border-b pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold">{node.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{node.authority}</CardDescription>
                    </div>
                    <Badge variant={STATUS_VARIANT[node.health?.status ?? 'unreachable']}>
                      {node.health?.status ?? 'unreachable'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-1.5">
                  {[
                    { label: 'Records',       value: node.records?.total ?? 0 },
                    { label: 'Adopted',       value: node.records?.byStatus.adopted ?? 0 },
                    { label: 'Notices',       value: node.notices?.total ?? 0 },
                    { label: 'Open notices',  value: node.notices?.byStatus.open ?? 0 },
                    { label: 'Projects',      value: node.commercial?.projects.total ?? 0 },
                    { label: 'Budget',        value: node.commercial
                        ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(node.commercial.projects.totalBudget)
                        : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
