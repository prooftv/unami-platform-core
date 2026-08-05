import { PageHeader } from '@unami/ui';
import { fetchAggregatedParticipation } from '@/lib/nodes/fetcher';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare } from 'lucide-react';

export default async function ParticipationPage() {
  const summary = await fetchAggregatedParticipation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participation"
        description="Public participation intelligence aggregated across all nodes"
      />

      <div className="grid grid-cols-2 gap-4 max-w-2xl sm:grid-cols-3">
        {[
          { label: 'Total Submissions', value: summary?.total ?? 0 },
          { label: 'Active Notices',    value: summary?.activeNotices ?? 0 },
          { label: 'Comments',          value: summary?.byType.comment ?? 0 },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">By Submission Type</CardTitle>
                <CardDescription className="text-xs mt-0.5">How the community is engaging</CardDescription>
              </div>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {summary === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              Object.entries(summary.byType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{type}</span>
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
                <CardTitle className="text-sm font-semibold">By Relationship</CardTitle>
                <CardDescription className="text-xs mt-0.5">Who is participating</CardDescription>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-3">
            {summary === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            ) : (
              Object.entries(summary.byRelationship)
                .sort(([, a], [, b]) => b - a)
                .map(([rel, count]) => (
                  <div key={rel} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{rel}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
