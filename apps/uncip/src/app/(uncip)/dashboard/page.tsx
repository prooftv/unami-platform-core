import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { PageHeader, KPIGrid, MetricCard, EmptyState, ErrorState } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Baby, CheckCircle, Shield, Users } from 'lucide-react';
import { AlertSummaryCard } from '@/components/uncip/alert/AlertSummaryCard';
import { ChildSummaryCard } from '@/components/uncip/child/ChildSummaryCard';
import type { UNCIPChild, UNCIPAlert, UNCIPStation } from '@unami/api';

export default async function DashboardPage() {
  const [session, client] = await Promise.all([getUNCIPSession(), getUNCIPClient()]);

  const [childrenResult, alertsResult, stationsResult] = await Promise.allSettled([
    client?.children.list({ limit: 100 }),
    client?.alerts.list({ limit: 100 }),
    client?.stations.list(),
  ]);

  // Log failures without swallowing them
  if (childrenResult.status === 'rejected') {
    console.error('[UNCIP/dashboard] children fetch failed:', childrenResult.reason);
  }
  if (alertsResult.status === 'rejected') {
    console.error('[UNCIP/dashboard] alerts fetch failed:', alertsResult.reason);
  }
  if (stationsResult.status === 'rejected') {
    console.error('[UNCIP/dashboard] stations fetch failed:', stationsResult.reason);
  }

  const children: UNCIPChild[] = childrenResult.status === 'fulfilled' ? (childrenResult.value?.data ?? []) : [];
  const alerts: UNCIPAlert[]   = alertsResult.status === 'fulfilled'   ? (alertsResult.value?.data ?? [])   : [];
  const stations: UNCIPStation[] = stationsResult.status === 'fulfilled' ? (stationsResult.value?.data ?? []) : [];

  const childrenFailed  = childrenResult.status === 'rejected';
  const alertsFailed    = alertsResult.status === 'rejected';
  const stationsFailed  = stationsResult.status === 'rejected';

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
        <MetricCard title="Registered Children"  value={childrenFailed ? '—' : String(children.length)}      icon={Baby}          compact />
        <MetricCard title="Active Alerts"         value={alertsFailed   ? '—' : String(activeAlerts.length)}  icon={AlertTriangle} compact />
        <MetricCard title="Resolved This Month"   value={alertsFailed   ? '—' : String(resolvedCount)}        icon={CheckCircle}   compact />
        <MetricCard title="Stations Configured"   value={stationsFailed ? '—' : String(stations.length)}      icon={Users}         compact />
      </KPIGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Alerts module */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertsFailed ? (
              <ErrorState
                title="Unable to load alerts"
                description="The alerts service could not be reached."
                className="py-8"
              />
            ) : activeAlerts.length === 0 ? (
              <EmptyState
                title="No active alerts"
                description="Active missing-child alerts will appear here."
                icon={AlertTriangle}
                className="py-8"
              />
            ) : (
              activeAlerts.slice(0, 5).map((alert) => {
                const child = children.find((c) => c.id === alert.childId) ?? null;
                return <AlertSummaryCard key={alert.id} alert={alert} child={child} />;
              })
            )}
          </CardContent>
        </Card>

        {/* Children module */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Baby className="h-4 w-4" />
              Recently Registered Children
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {childrenFailed ? (
              <ErrorState
                title="Unable to load children"
                description="The children service could not be reached."
                className="py-8"
              />
            ) : recentChildren.length === 0 ? (
              <EmptyState
                title="No children registered yet"
                description="Children registered by parents will appear here."
                icon={Baby}
                className="py-8"
              />
            ) : (
              recentChildren.map((child) => (
                <ChildSummaryCard
                  key={child.id}
                  child={child}
                  school={null}
                  hasActiveAlert={alerts.some((a) => a.childId === child.id && a.status === 'active')}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* SAPS Stations module */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            SAPS Stations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stationsFailed ? (
            <ErrorState
              title="Unable to load SAPS stations"
              description="The stations service could not be reached."
              className="py-8"
            />
          ) : stations.length === 0 ? (
            <EmptyState
              title="No SAPS stations configured"
              description="Station areas will appear here once configured."
              icon={Shield}
              className="py-8"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stations.map((s) => (
                <div key={s.id} className="rounded-md border px-4 py-3 text-sm">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-muted-foreground capitalize">{s.province.replace(/_/g, ' ')}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
