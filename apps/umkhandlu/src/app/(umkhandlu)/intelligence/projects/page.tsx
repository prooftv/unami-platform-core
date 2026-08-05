import { PageHeader } from '@unami/ui';
import { fetchAggregatedCommercial } from '@/lib/nodes/fetcher';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, Building2, TrendingUp } from 'lucide-react';

function decodeEntities(str: string): string {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

const HEALTH_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  green: 'default',
  amber: 'secondary',
  red:   'destructive',
};

export default async function ProjectsPage() {
  const summary = await fetchAggregatedCommercial();

  const budget = summary
    ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(summary.projects.totalBudget)
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Commercial intelligence aggregated across all governance nodes"
      />

      <div className="grid grid-cols-2 gap-4 max-w-2xl sm:grid-cols-4">
        {[
          { label: 'Total Projects',    value: summary?.projects.total ?? 0,             icon: Briefcase },
          { label: 'Active',            value: summary?.projects.byStatus.active ?? 0,   icon: TrendingUp },
          { label: 'Beneficiaries',     value: summary?.projects.totalBeneficiaries ?? 0, icon: Users },
          { label: 'Active Sponsors',   value: summary?.sponsors.active ?? 0,            icon: Building2 },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary && (
        <div className="max-w-3xl">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold">Total Budget</CardTitle>
              <CardDescription className="text-xs mt-0.5">Combined budget across all active projects</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-2xl font-semibold">{budget}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-3xl grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-semibold">By Status</CardTitle>
            <CardDescription className="text-xs mt-0.5">Project lifecycle distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {summary === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              Object.entries(summary.projects.byStatus)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{status}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-semibold">RAG Health</CardTitle>
            <CardDescription className="text-xs mt-0.5">Project health distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {summary === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              Object.entries(summary.projects.byHealth)
                .map(([health, count]) => (
                  <div key={health} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{health}</span>
                    <Badge variant={HEALTH_VARIANT[health] ?? 'outline'}>{count}</Badge>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="max-w-3xl">
        <Card>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
                <CardDescription className="text-xs mt-0.5">Latest project updates</CardDescription>
              </div>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {!summary?.recent.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
            ) : (
              <ul className="divide-y">
                {summary.recent.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-3 text-sm gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{decodeEntities(item.title)}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {item.type} · {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.health && (
                        <Badge variant={HEALTH_VARIANT[item.health] ?? 'outline'}>{item.health}</Badge>
                      )}
                      {item.status && <Badge variant="outline">{item.status}</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
