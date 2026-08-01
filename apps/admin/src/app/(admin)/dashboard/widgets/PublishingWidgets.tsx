'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AnalyticsCard,
  BarChart,
  PieChart,
} from '@moments/ui';
import type { MomentWithSponsor, CategoryStats, RegionalStats } from '@moments/api';
import { Radio } from 'lucide-react';

export function ContentSourceWidget({ moments }: { moments: MomentWithSponsor[] }) {
  const counts: Record<string, number> = {};
  for (const m of moments) {
    counts[m.contentSource] = (counts[m.contentSource] ?? 0) + 1;
  }
  const data = Object.entries(counts).map(([label, value]) => ({ label, value }));
  const description = data.map(({ label, value }) => `${label}: ${value}`).join(' · ') || 'No data yet';

  return (
    <AnalyticsCard title="Content Source Breakdown" description={description}>
      <PieChart data={data} height={180} emptyMessage="No content data yet" />
    </AnalyticsCard>
  );
}

export function CategoryDistributionWidget({ stats }: { stats: CategoryStats[] }) {
  const description = stats.length > 0
    ? `${stats.length} categories · ${stats.reduce((s, c) => s + c.momentCount, 0)} total`
    : 'No data yet';

  const data = stats.map((c) => ({ label: c.category, value: c.momentCount }));

  return (
    <AnalyticsCard title="Category Distribution" description={description}>
      <BarChart
        data={data}
        series={[{ key: 'value', label: 'Moments' }]}
        height={180}
        emptyMessage="No category data yet"
      />
    </AnalyticsCard>
  );
}

export function RegionalDistributionWidget({ stats }: { stats: RegionalStats[] }) {
  const description = stats.length > 0
    ? `${stats.length} regions · ${stats.reduce((s, r) => s + r.momentCount, 0)} total`
    : 'No data yet';

  const data = stats.map((r) => ({ label: r.region, value: r.momentCount }));

  return (
    <AnalyticsCard title="Regional Distribution" description={description}>
      <BarChart
        data={data}
        series={[{ key: 'value', label: 'Moments' }]}
        height={180}
        emptyMessage="No regional data yet"
      />
    </AnalyticsCard>
  );
}

export function PublishingRecentMomentsWidget({ moments }: { moments: MomentWithSponsor[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Moments</CardTitle>
          <Radio className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {moments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No moments yet</p>
        ) : (
          <ul className="space-y-2">
            {moments.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1 mr-2">{m.title}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline">{m.region}</Badge>
                  <Badge variant="secondary">{m.category}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
