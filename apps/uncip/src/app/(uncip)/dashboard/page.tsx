import Link from 'next/link';
import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { PageHeader, KPIGrid, MetricCard, EmptyState } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Baby, MapPin, Eye } from 'lucide-react';
import { AlertSummaryCard } from '@/components/uncip/alert/AlertSummaryCard';
import { ChildSummaryCard } from '@/components/uncip/child/ChildSummaryCard';
import type { UNCIPAlert, UNCIPChild, UNCIPAlertTimelineEntry } from '@unami/api';

// ─── Work queue helpers ───────────────────────────────────────────────────────

function awaitingSchoolConfirmation(alert: UNCIPAlert): boolean {
  const tl = alert.uncipAlertTimeline ?? [];
  return !tl.some((e) => e.action === 'school_confirmed_last_seen');
}

function awaitingAuthorityAction(alert: UNCIPAlert): boolean {
  const tl = alert.uncipAlertTimeline ?? [];
  return !tl.some((e) => e.action === 'authority_assigned_case');
}

function recentSightings(alerts: UNCIPAlert[]): UNCIPAlertTimelineEntry[] {
  return alerts
    .flatMap((a) => (a.uncipAlertTimeline ?? []).filter((e) => e.action === 'community_sighting_reported'))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);
}

function recentTimeline(alerts: UNCIPAlert[]): UNCIPAlertTimelineEntry[] {
  return alerts
    .flatMap((a) => a.uncipAlertTimeline ?? [])
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SightingRow({ entry }: { entry: UNCIPAlertTimelineEntry }) {
  const ago = Math.round((Date.now() - new Date(entry.timestamp).getTime()) / 60000);
  const label = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`;
  return (
    <div className="flex items-start gap-2 text-sm py-1">
      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-purple-500" />
      <div className="min-w-0">
        <p className="truncate">{entry.sightingLocation ?? 'Location not recorded'}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function TimelineRow({ entry }: { entry: UNCIPAlertTimelineEntry }) {
  const ACTION_LABELS: Record<string, string> = {
    alert_raised: 'Alert raised',
    school_confirmed_last_seen: 'School confirmed last seen',
    authority_assigned_case: 'Case assigned',
    community_sighting_reported: 'Sighting reported',
    status_changed: 'Status changed',
    note_added: 'Note added',
  };
  return (
    <div className="flex items-start gap-2 text-sm py-1">
      <Eye className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="truncate">{ACTION_LABELS[entry.action] ?? entry.action}</p>
        <p className="text-xs text-muted-foreground">
          {entry.actorName ?? entry.actorRole} · {new Date(entry.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ─── Role dashboards ──────────────────────────────────────────────────────────

function AdminDashboard({ alerts, children }: { alerts: UNCIPAlert[]; children: UNCIPChild[] }) {
  const active = alerts.filter((a) => a.status === 'active');
  const needAttention = active.filter(awaitingAuthorityAction);
  const sightings = recentSightings(active);
  const recent = recentTimeline(alerts);

  return (
    <div className="space-y-6">
      <KPIGrid>
        <MetricCard title="Active incidents"    value={String(active.length)}    icon={AlertTriangle} compact />
        <MetricCard title="Awaiting action"     value={String(needAttention.length)} icon={AlertTriangle} compact />
        <MetricCard title="Registered children" value={String(children.length)}  icon={Baby}          compact />
        <MetricCard title="Recent sightings"    value={String(sightings.length)} icon={MapPin}        compact />
      </KPIGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Active incidents</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/alerts">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {active.length === 0
              ? <EmptyState title="No active incidents" icon={AlertTriangle} className="py-6" />
              : active.slice(0, 5).map((a) => {
                  const child = children.find((c) => c.id === a.childId) ?? null;
                  return <Link key={a.id} href={`/alerts/${a.id}`} className="block"><AlertSummaryCard alert={a} child={child} /></Link>;
                })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent institutional activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0
              ? <EmptyState title="No recent activity" icon={Eye} className="py-6" />
              : recent.map((e) => <TimelineRow key={e.id} entry={e} />)}
          </CardContent>
        </Card>
      </div>

      {sightings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent community sightings</CardTitle>
          </CardHeader>
          <CardContent>
            {sightings.map((e) => <SightingRow key={e.id} entry={e} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AuthorityDashboard({ alerts, children }: { alerts: UNCIPAlert[]; children: UNCIPChild[] }) {
  const active = alerts.filter((a) => a.status === 'active');
  const needCase = active.filter(awaitingAuthorityAction);
  const sightings = recentSightings(active);

  return (
    <div className="space-y-6">
      <KPIGrid>
        <MetricCard title="Active in jurisdiction" value={String(active.length)}    icon={AlertTriangle} compact />
        <MetricCard title="Awaiting case number"   value={String(needCase.length)}  icon={AlertTriangle} compact />
        <MetricCard title="Recent sightings"       value={String(sightings.length)} icon={MapPin}        compact />
      </KPIGrid>

      {needCase.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Awaiting case number assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {needCase.map((a) => {
              const child = children.find((c) => c.id === a.childId) ?? null;
              return <Link key={a.id} href={`/alerts/${a.id}`} className="block"><AlertSummaryCard alert={a} child={child} /></Link>;
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">All active incidents</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/alerts">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {active.length === 0
              ? <EmptyState title="No active incidents in jurisdiction" icon={AlertTriangle} className="py-6" />
              : active.map((a) => {
                  const child = children.find((c) => c.id === a.childId) ?? null;
                  return <Link key={a.id} href={`/alerts/${a.id}`} className="block"><AlertSummaryCard alert={a} child={child} /></Link>;
                })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent sightings</CardTitle>
          </CardHeader>
          <CardContent>
            {sightings.length === 0
              ? <EmptyState title="No sightings reported" icon={MapPin} className="py-6" />
              : sightings.map((e) => <SightingRow key={e.id} entry={e} />)}
            <div className="mt-3">
              <Button variant="outline" size="sm" asChild><Link href="/map">View on map</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SchoolDashboard({ alerts, children }: { alerts: UNCIPAlert[]; children: UNCIPChild[] }) {
  const active = alerts.filter((a) => a.status === 'active');
  const needConfirmation = active.filter(awaitingSchoolConfirmation);
  const recent = recentTimeline(active);

  return (
    <div className="space-y-6">
      <KPIGrid>
        <MetricCard title="Active alerts"          value={String(active.length)}           icon={AlertTriangle} compact />
        <MetricCard title="Awaiting confirmation"  value={String(needConfirmation.length)}  icon={AlertTriangle} compact />
        <MetricCard title="Linked children"        value={String(children.length)}          icon={Baby}          compact />
      </KPIGrid>

      {needConfirmation.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Awaiting school confirmation of last seen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {needConfirmation.map((a) => {
              const child = children.find((c) => c.id === a.childId) ?? null;
              return <Link key={a.id} href={`/alerts/${a.id}`} className="block"><AlertSummaryCard alert={a} child={child} /></Link>;
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Linked children</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/children">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {children.length === 0
              ? <EmptyState title="No children linked to this school" icon={Baby} className="py-6" />
              : children.slice(0, 4).map((c) => (
                  <Link key={c.id} href={`/children/${c.id}`} className="block">
                    <ChildSummaryCard child={c} school={null} hasActiveAlert={active.some((a) => a.childId === c.id)} />
                  </Link>
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent incident activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0
              ? <EmptyState title="No recent activity" icon={Eye} className="py-6" />
              : recent.map((e) => <TimelineRow key={e.id} entry={e} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ParentDashboard({ alerts, children }: { alerts: UNCIPAlert[]; children: UNCIPChild[] }) {
  const active = alerts.filter((a) => a.status === 'active');
  const sightings = recentSightings(active);
  const recent = recentTimeline(active);
  // Prompt: active alert with no school confirmation yet
  const pendingSchool = active.filter(awaitingSchoolConfirmation);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button asChild size="sm"><Link href="/children/new">Register child</Link></Button>
        {children.length > 0 && (
          <Button variant="outline" asChild size="sm"><Link href="/alerts/new">Raise alert</Link></Button>
        )}
      </div>

      {pendingSchool.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="pt-4 text-sm space-y-2">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              {pendingSchool.length === 1 ? 'School confirmation pending' : `${pendingSchool.length} alerts awaiting school confirmation`}
            </p>
            <p className="text-muted-foreground text-xs">The school has not yet confirmed when the child was last seen.</p>
            {pendingSchool.map((a) => (
              <Link key={a.id} href={`/alerts/${a.id}`} className="block text-xs underline underline-offset-2">
                View incident →
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">My children</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/children">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {children.length === 0
              ? <EmptyState title="No children registered" description="Register your children to use UNCIP." icon={Baby} className="py-6" />
              : children.map((c) => (
                  <Link key={c.id} href={`/children/${c.id}`} className="block">
                    <ChildSummaryCard child={c} school={null} hasActiveAlert={active.some((a) => a.childId === c.id)} />
                  </Link>
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Active alerts</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/alerts">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {active.length === 0
              ? <EmptyState title="No active alerts" icon={AlertTriangle} className="py-6" />
              : active.map((a) => {
                  const child = children.find((c) => c.id === a.childId) ?? null;
                  return <Link key={a.id} href={`/alerts/${a.id}`} className="block"><AlertSummaryCard alert={a} child={child} /></Link>;
                })}
          </CardContent>
        </Card>
      </div>

      {(recent.length > 0 || sightings.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {recent.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Latest activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recent.map((e) => <TimelineRow key={e.id} entry={e} />)}
              </CardContent>
            </Card>
          )}
          {sightings.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Recent sightings</CardTitle>
              </CardHeader>
              <CardContent>
                {sightings.map((e) => <SightingRow key={e.id} entry={e} />)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function CommunityDashboard({ alerts }: { alerts: UNCIPAlert[] }) {
  // Community: RLS returns active only, child_id stripped
  const sightings = recentSightings(alerts);

  return (
    <div className="space-y-6">
      <KPIGrid>
        <MetricCard title="Active incidents in area" value={String(alerts.length)} icon={AlertTriangle} compact />
        <MetricCard title="Recent sightings"         value={String(sightings.length)} icon={MapPin} compact />
      </KPIGrid>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">Active incidents</CardTitle>
          <Button variant="ghost" size="sm" asChild><Link href="/alerts">View all</Link></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0
            ? <EmptyState title="No active incidents in your area" icon={AlertTriangle} className="py-6" />
            : alerts.map((a) => (
                <Link key={a.id} href={`/alerts/${a.id}`} className="block">
                  {/* F5: community sees no child identity */}
                  <AlertSummaryCard alert={a} child={null} isCommunity />
                </Link>
              ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sightings.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recent sightings</CardTitle>
            </CardHeader>
            <CardContent>
              {sightings.map((e) => <SightingRow key={e.id} entry={e} />)}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Contribute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>If you have seen a missing child, report a sighting on the incident page.</p>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" asChild><Link href="/alerts">View incidents</Link></Button>
              <Button variant="outline" size="sm" asChild><Link href="/map">View map</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [session, client] = await Promise.all([getUNCIPSession(), getUNCIPClient()]);

  const [alertsResult, childrenResult] = await Promise.allSettled([
    client?.alerts.list({ limit: 100 }),
    client?.children.list({ limit: 100 }),
  ]);

  const alertsRaw: UNCIPAlert[]   = alertsResult.status   === 'fulfilled' ? (alertsResult.value?.data   ?? []) : [];
  const children:  UNCIPChild[]   = childrenResult.status === 'fulfilled' ? (childrenResult.value?.data ?? []) : [];

  // Fetch detail (with timeline) for active alerts — needed for work queue derivation.
  // Acceptable for pilot dataset size.
  const activeRaw = alertsRaw.filter((a) => a.status === 'active');
  const alertsWithTimeline: UNCIPAlert[] = await Promise.all(
    activeRaw.map((a) =>
      client?.alerts.get(a.id).then((r) => r.data).catch(() => a) ?? Promise.resolve(a)
    )
  );
  // Merge: active alerts have timeline, closed alerts remain as-is
  const alerts: UNCIPAlert[] = [
    ...alertsWithTimeline,
    ...alertsRaw.filter((a) => a.status !== 'active'),
  ];

  const role = session?.role ?? 'admin';

  const roleLabel: Record<string, string> = {
    admin: 'Administrator',
    parent: 'Parent / Guardian',
    school: 'School Staff',
    authority: 'Authority',
    community: 'Community Member',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={session?.name ? `Welcome back, ${session.name}.` : 'Welcome back.'}
        actions={
          <Badge variant="outline">{roleLabel[role] ?? role}</Badge>
        }
      />

      {role === 'admin'      && <AdminDashboard     alerts={alerts} children={children} />}
      {role === 'authority'  && <AuthorityDashboard alerts={alerts} children={children} />}
      {role === 'school'     && <SchoolDashboard    alerts={alerts} children={children} />}
      {role === 'parent'     && <ParentDashboard    alerts={alerts} children={children} />}
      {role === 'community'  && <CommunityDashboard alerts={alerts} />}
    </div>
  );
}
