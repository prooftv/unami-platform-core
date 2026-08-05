import { PageHeader } from '@unami/ui';
import { fetchAggregatedNotices } from '@/lib/nodes/fetcher';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Scale } from 'lucide-react';

export default async function NoticeAnalyticsPage() {
  const summary = await fetchAggregatedNotices();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Analytics"
        description="Public notice intelligence aggregated across all nodes"
      />

      <div className="grid grid-cols-2 gap-4 max-w-2xl sm:grid-cols-4">
        {[
          { label: 'Total Notices',    value: summary?.total ?? 0 },
          { label: 'Published',        value: summary?.byStatus.published ?? 0 },
          { label: 'Open for Comment', value: summary?.byStatus.open ?? 0 },
          { label: 'Statutory',        value: summary?.statutory.total ?? 0 },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-3xl grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-semibold">By Status</CardTitle>
            <CardDescription className="text-xs mt-0.5">Notice distribution by lifecycle status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {summary === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              Object.entries(summary.byStatus)
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Statutory Notices</CardTitle>
                <CardDescription className="text-xs mt-0.5">Legally required public participation</CardDescription>
              </div>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {summary === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              [
                { label: 'Total statutory',    value: summary.statutory.total },
                { label: 'Open for comment',   value: summary.statutory.open },
                { label: 'Pending proof',      value: summary.statutory.pendingProof },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <Badge variant="outline">{value}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-semibold">By Type</CardTitle>
            <CardDescription className="text-xs mt-0.5">Notice distribution by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {summary === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              Object.entries(summary.byType)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{type.replace(/-/g, ' ')}</span>
                    <Badge variant="outline">{count}</Badge>
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
                <CardDescription className="text-xs mt-0.5">10 most recently updated notices</CardDescription>
              </div>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {!summary?.recentActivity.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
            ) : (
              <ul className="divide-y">
                {summary.recentActivity.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-3 text-sm gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{item.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {item.type.replace(/-/g, ' ')} · {new Date(item.createdAt).toLocaleDateString()}
                        {item.commentDeadline && ` · deadline ${new Date(item.commentDeadline).toLocaleDateString()}`}
                      </span>
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
      </div>
    </div>
  );
}
