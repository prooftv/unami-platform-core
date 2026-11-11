import { PageHeader } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination, parsePage, PAGE_SIZE } from '@/components/ui/pagination';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchRecentImports } from '@/lib/gis/spatial-sources-fetcher';
import type { SpatialSource } from '@/lib/gis/spatial-sources-fetcher';

export const dynamic = 'force-dynamic';

const permissionColour: Record<string, string> = {
  pending:      'bg-amber-100 text-amber-800',
  download:     'bg-green-100 text-green-800',
  redistribute: 'bg-green-100 text-green-800',
  internal:     'bg-green-100 text-green-800',
  display:      'bg-blue-100 text-blue-800',
  reference:    'bg-blue-100 text-blue-800',
  restricted:   'bg-red-100 text-red-800',
  prohibited:   'bg-red-200 text-red-900',
};

const sourceTypeLabel: Record<string, string> = {
  'arcgis-featureserver': 'ArcGIS FeatureServer',
  'arcgis-mapserver':     'ArcGIS MapServer',
  'wfs':                  'WFS',
  'download':             'Download',
  'static-map':           'Static Map',
};

const importStatusColour: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  failed:  'bg-red-100 text-red-800',
  partial: 'bg-amber-100 text-amber-800',
};

interface Props { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function SpatialSourcesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = parsePage(sp);
  const q = typeof sp.q === 'string' ? sp.q.trim() : '';
  const filterType = typeof sp.type === 'string' ? sp.type : '';
  const filterPerm = typeof sp.perm === 'string' ? sp.perm : '';
  const supabase = createServiceClient();

  let query = supabase.from('spatial_sources').select('*', { count: 'exact' });
  if (q) query = query.ilike('name', `%${q}%`);
  if (filterType) query = query.eq('source_type', filterType);
  if (filterPerm) query = query.eq('permission_classification', filterPerm);

  const [{ count, data: sourceRows }, imports] = await Promise.all([
    query.order('institution', { ascending: true }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    fetchRecentImports(10),
  ]);

  const sources = (sourceRows ?? []) as SpatialSource[];
  const total = count ?? 0;

  // Counts across all sources (not just current page) — fetch separately
  const { data: allSources } = await supabase
    .from('spatial_sources')
    .select('permission_classification');
  const allRows = allSources ?? [];
  const pending    = allRows.filter((s) => s.permission_classification === 'pending').length;
  const confirmed  = allRows.filter((s) => ['download','redistribute','internal','display'].includes(s.permission_classification)).length;
  const restricted = allRows.filter((s) => ['restricted','prohibited'].includes(s.permission_classification)).length;

  const searchUrl = (params: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (filterType) p.set('type', filterType);
    if (filterPerm) p.set('perm', filterPerm);
    Object.entries(params).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    p.delete('page');
    return `/spatial/sources?${p.toString()}`;
  };
  void searchUrl;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spatial Data Sources"
        description="Institutional GIS sources, connection status and import history for Amajuba District."
        actions={
          <Button asChild>
            <Link href="/spatial/sources/new">Add source</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{total}</p>
            <p className="text-sm text-muted-foreground">Registered sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold text-amber-600">{pending}</p>
            <p className="text-sm text-muted-foreground">Pending permission</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold text-green-600">{confirmed}</p>
            <p className="text-sm text-muted-foreground">Permission confirmed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Registered Sources</CardTitle>
            <form method="GET" action="/spatial/sources" className="flex items-center gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search sources…"
                className="h-8 rounded-md border border-input bg-background px-3 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <select
                name="type"
                defaultValue={filterType}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none"
              >
                <option value="">All types</option>
                <option value="arcgis-featureserver">ArcGIS FeatureServer</option>
                <option value="arcgis-mapserver">ArcGIS MapServer</option>
                <option value="wfs">WFS</option>
                <option value="download">Download</option>
                <option value="static-map">Static Map</option>
              </select>
              <select
                name="perm"
                defaultValue={filterPerm}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none"
              >
                <option value="">All permissions</option>
                <option value="pending">Pending</option>
                <option value="redistribute">Redistribute</option>
                <option value="download">Download</option>
                <option value="display">Display</option>
                <option value="reference">Reference</option>
                <option value="restricted">Restricted</option>
              </select>
              <button type="submit" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">Filter</button>
              {(q || filterType || filterPerm) && (
                <a href="/spatial/sources" className="h-8 px-3 rounded-md border text-sm flex items-center hover:bg-muted">Clear</a>
              )}
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {sources.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">No sources registered.</div>
            )}
            {sources.map((source) => (
              <div key={source.id} className="relative px-6 py-4 space-y-1 hover:bg-muted/30">
                <Link href={`/spatial/sources/${source.id}`} className="absolute inset-0" aria-label={source.name} />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{source.name}</p>
                    <p className="text-xs text-muted-foreground">{source.institution}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${permissionColour[source.permission_classification] ?? 'bg-gray-100 text-gray-700'}`}>
                      {source.permission_classification}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {sourceTypeLabel[source.source_type] ?? source.source_type}
                    </Badge>
                    {!source.active && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                </div>
                {source.description && (
                  <p className="text-xs text-muted-foreground">{source.description}</p>
                )}
                {source.notes && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">{source.notes}</p>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground pt-1">
                  <span>Coverage: {source.geographic_coverage}</span>
                  <span>CRS: {source.coordinate_system}</span>
                  {source.custodian_name && <span>Custodian: {source.custodian_name}</span>}
                  {source.last_checked_at && (
                    <span>Checked: {new Date(source.last_checked_at).toLocaleDateString()}</span>
                  )}
                  {source.last_successful_import_at && (
                    <span>Last import: {new Date(source.last_successful_import_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 border-t">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseUrl={`/spatial/sources${q || filterType || filterPerm ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(filterType ? { type: filterType } : {}), ...(filterPerm ? { perm: filterPerm } : {}) }).toString()}` : ''}`} />
          </div>
        </CardContent>
      </Card>

      {imports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Import Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {imports.map((imp) => (
                <div key={imp.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm">{imp.import_type ?? 'import'} → {imp.target_node_url ?? 'node'}</p>
                    {imp.error_message && (
                      <p className="text-xs text-destructive">{imp.error_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                    <span>{imp.features_imported} features</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${importStatusColour[imp.status] ?? ''}`}>
                      {imp.status}
                    </span>
                    <span>{new Date(imp.started_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {restricted > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-destructive">Restricted sources ({restricted})</p>
            <p className="text-xs text-muted-foreground mt-1">
              Water and sanitation data from Amajuba District is restricted by the GIS Manager.
              Direct requests to Ms Thubelihle Buthelezi, HoD Planning &amp; Development —
              thubelihleb@amajuba.gov.za
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
