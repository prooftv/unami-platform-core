import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { PageHeader, KPIGrid, MetricCard, ActivityFeed } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Baby, CheckCircle, Users } from 'lucide-react';
import { AlertSummaryCard } from '@/components/uncip/alert/AlertSummaryCard';
import { ChildSummaryCard } from '@/components/uncip/child/ChildSummaryCard';

export default async function DashboardPage() {
  const [session, client] = await Promise.all([getUNCIPSession(), getUNCIPClient()]);

  const [childrenRes, alertsRes, stationsRes] = await Promise.all([
    client?.children.list({ limit: 100 }),
    client?.alerts.list({ limit: 100 }),
    client?.stations.list(),
  ]);

  const children = childrenRes?.data ?? [];
  const alerts   = alertsRes?.data ?? [];
  const stations = stationsRes?.data ?? [];

  const activeAlerts  = alerts.filter((a) => a.status === 'active');
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  const recentChildren = [...children]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

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
        <MetricCard title="Registered Children"  value={String(children.length)}  icon={Baby}          compact />
        <MetricCard title="Active Alerts"         value={String(activeAlerts.length)} icon={AlertTriangle} compact />
        <MetricCard title="Resolved This Month"   value={String(resolvedCount)}    icon={CheckCircle}   compact />
        <MetricCard title="Stations Configured"   value={String(stations.length)}  icon={Users}         compact />
      </KPIGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.slice(0, 5).map((alert) => {
              const child = children.find((c) => c.id === alert.childId) ?? null;
              return <AlertSummaryCard key={alert.id} alert={alert} child={child} />;
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Baby className="h-4 w-4" />
              Recently Registered Children
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentChildren.map((child) => (
              <ChildSummaryCard
                key={child.id}
                child={child}
                school={null}
                hasActiveAlert={alerts.some((a) => a.childId === child.id && a.status === 'active')}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
