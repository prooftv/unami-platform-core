'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalyticsCard, BarChart } from '@unami/ui';
import { Users, Paperclip, Activity, BarChart2 } from 'lucide-react';
import type { ParticipationStats, EvidenceStats, ProjectHealthSummary, ActivityEvent } from '@unami/api';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const HEALTH_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  green: 'default',
  amber: 'secondary',
  red: 'destructive',
  unset: 'outline',
};

const HEALTH_LABEL: Record<string, string> = {
  green: 'On Track',
  amber: 'At Risk',
  red: 'Critical',
  unset: 'Not Set',
};

export function IntelligenceKPIs({
  participation,
  evidence,
  projectHealth,
}: {
  participation: ParticipationStats | null;
  evidence: EvidenceStats | null;
  projectHealth: ProjectHealthSummary | null;
}) {
  const kpis = [
    {
      title: 'Participation Submissions',
      value: participation ? participation.total.toLocaleString() : '—',
      description: participation ? `${participation.consultationMoments} consultation moments` : 'No data',
      icon: Users,
    },
    {
      title: 'Avg Responses / Moment',
      value: participation ? participation.avgPerMoment.toString() : '—',
      description: 'Per consultation moment',
      icon: BarChart2,
    },
    {
      title: 'Evidence Attachments',
      value: evidence ? evidence.total.toLocaleString() : '—',
      description: evidence ? `${formatBytes(evidence.totalBytes)} · ${evidence.momentsWithEvidence} moments` : 'No data',
      icon: Paperclip,
    },
    {
      title: 'CSR Projects',
      value: projectHealth ? projectHealth.total.toLocaleString() : '—',
      description: projectHealth ? `${projectHealth.active} active · ${projectHealth.totalBeneficiaries.toLocaleString()} beneficiaries` : 'No data',
      icon: Activity,
    },
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

export function ParticipationBreakdownWidget({ stats }: { stats: ParticipationStats | null }) {
  const data = stats
    ? Object.entries(stats.byType).map(([label, value]) => ({ label, value }))
    : [];

  return (
    <AnalyticsCard
      title="Participation by Response Type"
      description={stats ? `${stats.total} total submissions` : 'No data yet'}
    >
      <BarChart
        data={data}
        series={[{ key: 'value', label: 'Submissions' }]}
        height={180}
        emptyMessage="No participation data yet"
      />
    </AnalyticsCard>
  );
}

export function EvidenceBreakdownWidget({ stats }: { stats: EvidenceStats | null }) {
  const data = stats
    ? Object.entries(stats.byType).map(([label, value]) => ({ label, value }))
    : [];

  return (
    <AnalyticsCard
      title="Evidence by File Type"
      description={stats ? `${stats.total} files · ${formatBytes(stats.totalBytes)}` : 'No data yet'}
    >
      <BarChart
        data={data}
        series={[{ key: 'value', label: 'Files' }]}
        height={180}
        emptyMessage="No evidence data yet"
      />
    </AnalyticsCard>
  );
}

export function ProjectHealthWidget({ summary }: { summary: ProjectHealthSummary | null }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>CSR Project Health</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!summary || summary.total === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-md px-4 py-3">No CSR projects yet.</p>
        ) : (
          <>
            <div className="space-y-2">
              {Object.entries(summary.byHealth).map(([health, count]) => (
                count > 0 && (
                  <div key={health} className="flex items-center justify-between text-sm">
                    <Badge variant={HEALTH_VARIANT[health]}>{HEALTH_LABEL[health] ?? health}</Badge>
                    <span className="font-medium">{count}</span>
                  </div>
                )
              ))}
            </div>
            {Object.keys(summary.byPhase).length > 0 && (
              <div className="pt-2 border-t space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">By Phase</p>
                {Object.entries(summary.byPhase).map(([phase, count]) => (
                  <div key={phase} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{phase}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2 border-t text-sm">
              <span className="text-muted-foreground">Total beneficiaries: </span>
              <span className="font-medium">{summary.totalBeneficiaries.toLocaleString()}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

const EVENT_LABELS: Record<string, string> = {
  moment: 'Moment',
  broadcast: 'Broadcast',
  participation: 'Participation',
  evidence: 'Evidence',
};

const EVENT_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  moment: 'default',
  broadcast: 'secondary',
  participation: 'outline',
  evidence: 'outline',
};

export function ActivityStreamWidget({ events }: { events: ActivityEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Stream</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-md px-4 py-3">No recent activity.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={`${event.type}-${event.id}`} className="flex items-start gap-3 text-sm">
                <Badge variant={EVENT_VARIANT[event.type]} className="mt-0.5 shrink-0 text-xs">
                  {EVENT_LABELS[event.type] ?? event.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{event.label}</p>
                  <p className="text-xs text-muted-foreground">{event.meta}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(event.timestamp).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
