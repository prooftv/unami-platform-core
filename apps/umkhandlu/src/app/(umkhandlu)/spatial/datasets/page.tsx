import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { Pagination, parsePage, PAGE_SIZE } from '@/components/ui/pagination';

export const dynamic = 'force-dynamic';

const statusColour: Record<string, string> = {
  pending:    'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-800',
  staged:     'bg-amber-100 text-amber-800',
  published:  'bg-green-100 text-green-800',
  rejected:   'bg-red-100 text-red-800',
  archived:   'bg-gray-200 text-gray-600',
};

const permColour: Record<string, string> = {
  pending:      'text-amber-600',
  download:     'text-green-600',
  redistribute: 'text-green-600',
  internal:     'text-green-600',
  display:      'text-blue-600',
  reference:    'text-blue-600',
  restricted:   'text-destructive',
  prohibited:   'text-destructive',
};

interface Props { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function DatasetsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = parsePage(sp);
  const supabase = createServiceClient();

  const [{ count }, { data: datasets }, { data: summary }] = await Promise.all([
    supabase.from('spatial_datasets').select('*', { count: 'exact', head: true }),
    supabase
      .from('spatial_datasets')
      .select('*, spatial_sources(name, institution)')
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase.from('spatial_datasets').select('status'),
  ]);

  const rows = datasets ?? [];
  const total = count ?? 0;
  const allRows = summary ?? [];
  const published = allRows.filter((d) => d.status === 'published').length;
  const staged    = allRows.filter((d) => d.status === 'staged').length;
  const pending   = allRows.filter((d) => d.status === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spatial Datasets"
        description="Individual layers and datasets registered against institutional sources."
        actions={
          <Button asChild>
            <Link href="/spatial/datasets/new">Register dataset</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold">{total}</p>
          <p className="text-sm text-muted-foreground">Total datasets</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-green-600">{published}</p>
          <p className="text-sm text-muted-foreground">Published</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-amber-600">{staged + pending}</p>
          <p className="text-sm text-muted-foreground">Awaiting review</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Registered Datasets</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No datasets registered yet. Register a dataset against a source to begin.
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((d) => {
                const src = d.spatial_sources as { name: string; institution: string } | null;
                return (
                  <div key={d.id} className="relative px-6 py-4 space-y-1 hover:bg-muted/30">
                    <Link href={`/spatial/datasets/${d.id}`} className="absolute inset-0" aria-label={d.name} />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{src?.institution ?? '—'} · {src?.name ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[d.status] ?? ''}`}>
                          {d.status}
                        </span>
                        <span className={`text-xs font-medium ${permColour[d.permission_classification] ?? ''}`}>
                          {d.permission_classification ?? '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>CRS: {d.crs}</span>
                      {d.feature_count != null && <span>{d.feature_count} features</span>}
                      {d.dataset_date && <span>Date: {d.dataset_date}</span>}
                      {d.published_at && <span>Published: {new Date(d.published_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-6 border-t">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseUrl="/spatial/datasets" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
