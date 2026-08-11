import { getUNCIPSession } from '@/lib/auth/operator';
import { PageHeader, KPIGrid, MetricCard, ActivityFeed } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Baby, CheckCircle, Users } from 'lucide-react';
import {
  FIXTURE_CHILDREN,
  FIXTURE_ALERTS,
  FIXTURE_USERS,
  getSchool,
  getAlertsForChild,
  getActiveAlerts,
} from '@/fixtures/uncip';
import { buildUsersMap } from '@/lib/fixtures/users-map';
import { AlertSummaryCard } from '@/components/uncip/alert/AlertSummaryCard';
import { ChildSummaryCard } from '@/components/uncip/child/ChildSummaryCard';

export default async function DashboardPage() {
  const session = await getUNCIPSession();

  const activeAlerts = getActiveAlerts();
  const resolvedCount = FIXTURE_ALERTS.filter((a) => a.status === 'resolved').length;
  const usersMap = buildUsersMap(FIXTURE_USERS);

  // Recent children — last 4 by createdAt
  const recentChildren = [...FIXTURE_CHILDREN]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const activityItems = FIXTURE_ALERTS.flatMap((alert) =>
    alert.timeline.map((entry) => ({ entry, actorName: usersMap[entry.actorId]?.name ?? entry.actorId }))
  )
    .sort((a, b) => new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime())
    .slice(0, 8)
    .map(({ entry, actorName }) => ({
      id: entry.id,
      label: `${actorName} — ${entry.action.replace(/_/g, ' ')}`,
      description: entry.note ?? undefined,
      timestamp: new Date(entry.timestamp).toLocaleString(),
    }));

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
        <MetricCard title="Registered Children" value={String(FIXTURE_CHILDREN.length)} icon={Baby} compact />
        <MetricCard title="Active Alerts" value={String(activeAlerts.length)} icon={AlertTriangle} compact />
        <MetricCard title="Resolved This Month" value={String(resolvedCount)} icon={CheckCircle} compact />
        <MetricCard title="Registered Users" value={String(FIXTURE_USERS.length)} icon={Users} compact />
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
            {activeAlerts.map((alert) => {
              const child = FIXTURE_CHILDREN.find((c) => c.id === alert.childId) ?? null;
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
            {recentChildren.map((child) => {
              const school = getSchool(child.schoolId ?? '') ?? null;
              const hasActiveAlert = getAlertsForChild(child.id).some((a) => a.status === 'active');
              return (
                <ChildSummaryCard
                  key={child.id}
                  child={child}
                  school={school}
                  hasActiveAlert={hasActiveAlert}
                />
              );
            })}
          </CardContent>
        </Card>
      </div>

      <ActivityFeed items={activityItems} title="Recent Activity" />
    </div>
  );
}
