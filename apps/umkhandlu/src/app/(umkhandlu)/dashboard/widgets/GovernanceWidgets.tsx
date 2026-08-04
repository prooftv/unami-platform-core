'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Bell, Scale, CheckCircle2 } from 'lucide-react';
import type { RecordsSummary, NoticesSummary } from '@unami/api';

// ── Governance KPIs ───────────────────────────────────────────────────────────

export function GovernanceKPIs({
  records,
  notices,
}: {
  records: RecordsSummary | null;
  notices: NoticesSummary | null;
}) {
  const kpis = [
    { title: 'Total Records',    value: records?.total ?? '—',                    description: `${records?.byStatus.pending ?? 0} pending`,          icon: FileText },
    { title: 'Adopted Records',  value: records?.byStatus.adopted ?? '—',         description: 'formally adopted',                                    icon: CheckCircle2 },
    { title: 'Total Notices',    value: notices?.total ?? '—',                    description: `${notices?.statutory.open ?? 0} open for comment`,    icon: Bell },
    { title: 'Statutory Open',   value: notices?.statutory.open ?? '—',           description: 'accepting public comments',                           icon: Scale },
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

// ── Records Summary Widget ────────────────────────────────────────────────────

export function RecordsSummaryWidget({ summary }: { summary: RecordsSummary | null }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Records by Status</CardTitle>
          <CardDescription className="text-xs mt-0.5">Governance record distribution</CardDescription>
        </div>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {summary === null ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          Object.entries(summary.byStatus).map(([status, count]) => (
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

// ── Notices Summary Widget ────────────────────────────────────────────────────

export function NoticesSummaryWidget({ summary }: { summary: NoticesSummary | null }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Notices by Status</CardTitle>
          <CardDescription className="text-xs mt-0.5">Public notice distribution</CardDescription>
        </div>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {summary === null ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          Object.entries(summary.byStatus).map(([status, count]) => (
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

// ── Recent Records Activity ───────────────────────────────────────────────────

export function RecentRecordsWidget({ summary }: { summary: RecordsSummary | null }) {
  const items = summary?.recentActivity ?? [];
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Recent Record Activity</CardTitle>
          <CardDescription className="text-xs mt-0.5">10 most recently updated records</CardDescription>
        </div>
        <FileText className="h-4 w-4 text-muted-foreground" />
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
                <Badge variant="outline">{item.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Recent Notices Activity ───────────────────────────────────────────────────

export function RecentNoticesWidget({ summary }: { summary: NoticesSummary | null }) {
  const items = summary?.recentActivity ?? [];
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Recent Notice Activity</CardTitle>
          <CardDescription className="text-xs mt-0.5">10 most recently updated notices</CardDescription>
        </div>
        <Bell className="h-4 w-4 text-muted-foreground" />
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
                  {item.isStatutory && <Badge variant="secondary">statutory</Badge>}
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
