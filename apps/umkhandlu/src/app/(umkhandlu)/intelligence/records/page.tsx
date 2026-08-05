import { PageHeader } from '@unami/ui';
import { fetchAggregatedRecords } from '@/lib/nodes/fetcher';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2 } from 'lucide-react';

function decodeEntities(str: string): string {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export default async function RecordAnalyticsPage() {
  const summary = await fetchAggregatedRecords();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Analytics"
        description="Governance record intelligence aggregated across all nodes"
      />

      <div className="grid grid-cols-2 gap-4 max-w-2xl sm:grid-cols-4">
        {[
          { label: 'Total Records', value: summary?.total ?? 0 },
          { label: 'Adopted',       value: summary?.byStatus.adopted ?? 0 },
          { label: 'Pending',       value: summary?.byStatus.pending ?? 0 },
          { label: 'Resolved',      value: summary?.byStatus.resolved ?? 0 },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
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
            <CardDescription className="text-xs mt-0.5">Record distribution by lifecycle status</CardDescription>
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
            <CardTitle className="text-sm font-semibold">By Type</CardTitle>
            <CardDescription className="text-xs mt-0.5">Record distribution by governance type</CardDescription>
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
                <CardDescription className="text-xs mt-0.5">10 most recently updated records</CardDescription>
              </div>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
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
                        {item.type.replace(/-/g, ' ')} · {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge variant="outline">{item.status ?? '—'}</Badge>
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
