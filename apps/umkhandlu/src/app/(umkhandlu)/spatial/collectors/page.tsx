import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CollectorsPage() {
  const supabase = createServiceClient();

  const [{ data: collectors }, { data: submissionCounts }] = await Promise.all([
    supabase
      .from('field_collectors')
      .select('id, gratisgis_user_id, display_name, email, active, created_at, updated_at')
      .order('display_name'),
    supabase
      .from('field_submissions')
      .select('collector_id, status'),
  ]);

  const rows = collectors ?? [];
  const counts = (submissionCounts ?? []).reduce<Record<string, Record<string, number>>>(
    (acc, s) => {
      if (!s.collector_id) return acc;
      if (!acc[s.collector_id]) acc[s.collector_id] = {};
      acc[s.collector_id][s.status] = (acc[s.collector_id][s.status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const active = rows.filter((c) => c.active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Collectors"
        description="GratisGIS collector accounts and their submission history."
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold">{rows.length}</p>
          <p className="text-sm text-muted-foreground">Registered collectors</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-green-600">{active}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-amber-600">{rows.length - active}</p>
          <p className="text-sm text-muted-foreground">Inactive</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Collectors</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No collectors registered. Collectors are created automatically when a field submission is received.
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((c) => {
                const collectorCounts = counts[c.id] ?? {};
                const total = Object.values(collectorCounts).reduce((s, n) => s + n, 0);
                const pending = (collectorCounts.pending ?? 0) + (collectorCounts.under_review ?? 0);
                return (
                  <div key={c.id} className="relative px-6 py-4 hover:bg-muted/30">
                    <Link href={`/spatial/collectors/${c.id}`} className="absolute inset-0" aria-label={c.display_name} />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{c.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.email ?? 'No email'} · GratisGIS: {c.gratisgis_user_id}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {pending > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                            {pending} pending
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{total} submissions</span>
                        <Badge variant={c.active ? 'default' : 'secondary'}>
                          {c.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registered {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
