import { getUNCIPSession } from '@/lib/auth/operator';
import { PageHeader, KPIGrid, MetricCard, EmptyState, ActivityFeed } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Baby, CheckCircle, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Synthetic mock data — foundation phase only ──────────────────────────────
// These numbers are illustrative. They do not represent real children or alerts.
const MOCK_KPIS: { title: string; value: string; icon: LucideIcon }[] = [
  { title: 'Registered Children', value: '0', icon: Baby },
  { title: 'Active Alerts', value: '0', icon: AlertTriangle },
  { title: 'Resolved This Month', value: '0', icon: CheckCircle },
  { title: 'Community Members', value: '0', icon: Clock },
];

const MOCK_RECENT_ALERTS: { id: string; type: string; status: string; age: string }[] = [];
// ─────────────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getUNCIPSession();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back${session?.name ? `, ${session.name}` : ''}. Here is your UNCIP overview.`}
        actions={
          <Badge variant="outline" className="capitalize">
            {session?.role ?? 'unknown'}
          </Badge>
        }
      />

      <KPIGrid>
        {MOCK_KPIS.map((kpi) => (
          <MetricCard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} compact />
        ))}
      </KPIGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {MOCK_RECENT_ALERTS.length === 0 ? (
              <EmptyState
                title="No active alerts"
                description="Active missing child alerts will appear here."
                icon={CheckCircle}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Baby className="h-4 w-4" />
              Recently Registered Children
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No children registered"
              description="Children registered by parents will appear here."
              icon={Clock}
            />
          </CardContent>
        </Card>
      </div>

      <ActivityFeed items={[]} title="Recent Activity" />
    </div>
  );
}
