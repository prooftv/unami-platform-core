'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, TrendingUp, Building2 } from 'lucide-react';
import type { CommercialSummary } from '@unami/api';

// ── Commercial KPIs ───────────────────────────────────────────────────────────

export function CommercialKPIs({ summary }: { summary: CommercialSummary | null }) {
  const kpis = [
    { title: 'Total Projects',    value: summary?.projects.total ?? '—',        description: `${summary?.projects.byStatus.active ?? 0} active`,    icon: Briefcase },
    { title: 'Total Beneficiaries', value: summary?.projects.totalBeneficiaries ?? '—', description: 'across active projects',                       icon: Users },
    { title: 'Active Sponsors',   value: summary?.sponsors.active ?? '—',       description: `${summary?.sponsors.total ?? 0} total registered`,    icon: Building2 },
    { title: 'Projects at Risk',  value: summary?.projects.byHealth.red ?? '—', description: `${summary?.projects.byHealth.amber ?? 0} amber`,      icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map(({ title, value, description, icon: Icon }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Project Health Widget ─────────────────────────────────────────────────────

const HEALTH_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  green: 'default',
  amber: 'secondary',
  red:   'destructive',
};

export function ProjectHealthWidget({ summary }: { summary: CommercialSummary | null }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Project Health</CardTitle>
          <CardDescription className="text-xs mt-0.5">RAG status distribution</CardDescription>
        </div>
        <Briefcase className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {summary === null ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          Object.entries(summary.projects.byHealth).map(([health, count]) => (
            <div key={health} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground capitalize">{health}</span>
              <Badge variant={HEALTH_VARIANT[health] ?? 'outline'}>{count}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ── Project Status Widget ─────────────────────────────────────────────────────

export function ProjectStatusWidget({ summary }: { summary: CommercialSummary | null }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Projects by Status</CardTitle>
          <CardDescription className="text-xs mt-0.5">Lifecycle stage distribution</CardDescription>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {summary === null ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          Object.entries(summary.projects.byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground capitalize">{status}</span>
              <Badge variant="outline">{count}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ── Recent Commercial Activity ────────────────────────────────────────────────

export function RecentCommercialActivityWidget({ summary }: { summary: CommercialSummary | null }) {
  const items = summary?.recentActivity ?? [];
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          <CardDescription className="text-xs mt-0.5">Latest project updates</CardDescription>
        </div>
        <Briefcase className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <ul className="space-y-2 pt-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex flex-col min-w-0 mr-2">
                  <span className="truncate font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.health && (
                    <Badge variant={HEALTH_VARIANT[item.health] ?? 'outline'}>{item.health}</Badge>
                  )}
                  <Badge variant="outline">{item.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
