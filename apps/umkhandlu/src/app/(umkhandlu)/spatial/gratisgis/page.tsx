import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createServiceClient } from '@/lib/supabase/server';
import { getConfiguredGratisGisOgcApiUrl, discoverGratisGisCollections } from '@/lib/gis/gratisgis-client';
import { GratisGisDiscoverButton } from './_components/GratisGisDiscoverButton';
import { CheckCircle, XCircle, AlertTriangle, Zap, Database, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function probeGratisGis(): Promise<{
  configured: boolean;
  reachable: boolean;
  collectionCount: number;
  responseMs: number;
  error: string | null;
  url: string | null;
}> {
  let url: string | null = null;
  try {
    url = getConfiguredGratisGisOgcApiUrl();
  } catch {
    return { configured: false, reachable: false, collectionCount: 0, responseMs: 0, error: 'GRATISGIS_OGC_API_URL is not configured.', url: null };
  }

  const start = Date.now();
  try {
    const collections = await discoverGratisGisCollections(url);
    return {
      configured: true,
      reachable: true,
      collectionCount: collections.length,
      responseMs: Date.now() - start,
      error: null,
      url,
    };
  } catch (err) {
    return {
      configured: true,
      reachable: false,
      collectionCount: 0,
      responseMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      url,
    };
  }
}

export default async function GratisGisPage() {
  const supabase = createServiceClient();

  const [status, { data: gratisSources }, { data: gratisDatasets }, { data: recentRuns }] = await Promise.all([
    probeGratisGis(),
    supabase
      .from('spatial_sources')
      .select('id, name, institution, active, last_checked_at, permission_classification')
      .eq('source_type', 'gratisgis-ogc')
      .order('name'),
    supabase
      .from('spatial_datasets')
      .select('id, name, status, feature_count, layer_id, published_at, permission_classification, source_id')
      .in('source_id',
        (await supabase.from('spatial_sources').select('id').eq('source_type', 'gratisgis-ogc')).data?.map((s) => s.id) ?? []
      )
      .order('name'),
    supabase
      .from('spatial_pipeline_runs')
      .select('id, pipeline_type, status, started_at, completed_at, features_fetched, features_processed, error_message')
      .eq('pipeline_type', 'gratisgis-fetch')
      .order('started_at', { ascending: false })
      .limit(20),
  ]);

  const sources = gratisSources ?? [];
  const datasets = gratisDatasets ?? [];
  const runs = recentRuns ?? [];

  const publishedCount = datasets.filter((d) => d.status === 'published').length;
  const stagedCount = datasets.filter((d) => d.status === 'staged').length;
  const pendingCount = datasets.filter((d) => d.status === 'pending').length;

  const lastSuccessfulRun = runs.find((r) => r.status === 'success');
  const lastFailedRun = runs.find((r) => r.status === 'failed');

  return (
    <div className="space-y-6">
      <PageHeader
        title="GratisGIS Integration"
        description="OGC API Features connection status, collection catalogue and ingestion history."
      />

      {/* Connection status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-start gap-3">
            {status.configured ? (
              status.reachable ? (
                <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              )
            ) : (
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium">
                {status.configured
                  ? status.reachable
                    ? 'Connected'
                    : 'Unreachable'
                  : 'Not configured'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status.configured
                  ? status.reachable
                    ? `${status.responseMs}ms · ${status.collectionCount} collections`
                    : status.error ?? 'Connection failed'
                  : 'Set GRATISGIS_OGC_API_URL in environment'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">{datasets.length} registered datasets</p>
            </div>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              <span className="text-green-600">{publishedCount} published</span>
              <span className="text-amber-600">{stagedCount} staged</span>
              <span>{pendingCount} pending</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">Last fetch</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastSuccessfulRun
                ? `${new Date(lastSuccessfulRun.started_at).toLocaleString()} · ${lastSuccessfulRun.features_processed} features`
                : 'No successful fetch recorded'}
            </p>
            {lastFailedRun && new Date(lastFailedRun.started_at) > new Date(lastSuccessfulRun?.started_at ?? 0) && (
              <p className="text-xs text-destructive mt-0.5">
                Last run failed: {lastFailedRun.error_message ?? 'Unknown error'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuration status */}
      {!status.configured && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            <strong>GratisGIS is not configured.</strong> Set the{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">GRATISGIS_OGC_API_URL</code>{' '}
            environment variable to the OGC API Features base URL. The system currently serves
            approved geometry directly from Supabase JSONB — this remains fully functional.
            GratisGIS is the intended final serving layer once configured.
          </AlertDescription>
        </Alert>
      )}

      {status.configured && !status.reachable && (
        <Alert>
          <XCircle className="size-4" />
          <AlertDescription>
            <strong>GratisGIS endpoint is unreachable.</strong> {status.error}
            {status.url && (
              <span className="block text-xs mt-1 font-mono text-muted-foreground">{status.url}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Registered GratisGIS sources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registered GratisGIS Sources</CardTitle>
            {status.configured && status.reachable && sources.length > 0 && (
              <GratisGisDiscoverButton sourceId={sources[0].id} />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sources.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No GratisGIS OGC sources registered. Add a source with type{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">gratisgis-ogc</code>{' '}
              in Data Sources.
            </div>
          ) : (
            <div className="divide-y">
              {sources.map((source) => (
                <div key={source.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{source.name}</p>
                    <p className="text-xs text-muted-foreground">{source.institution}</p>
                    {source.last_checked_at && (
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date(source.last_checked_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={source.active ? 'default' : 'secondary'}>
                      {source.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{source.permission_classification}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GratisGIS datasets */}
      {datasets.length > 0 && (
        <Card>
          <CardHeader><CardTitle>GratisGIS Datasets</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {datasets.map((d) => (
                <div key={d.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium truncate">{d.name}</p>
                    {d.layer_id && (
                      <p className="text-xs text-muted-foreground font-mono truncate">{d.layer_id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    {d.feature_count != null && (
                      <span className="text-muted-foreground">{d.feature_count.toLocaleString()} features</span>
                    )}
                    <Badge variant="outline">{d.permission_classification}</Badge>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      d.status === 'published' ? 'bg-green-100 text-green-800' :
                      d.status === 'staged' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-700'
                    }`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fetch history */}
      {runs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Fetch History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {runs.map((run) => {
                const duration = run.completed_at
                  ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                  : null;
                return (
                  <div key={run.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                    <div className="min-w-0 space-y-0.5">
                      <p>GratisGIS Fetch</p>
                      {run.features_processed > 0 && (
                        <p className="text-xs text-muted-foreground">{run.features_processed} features staged</p>
                      )}
                      {run.error_message && (
                        <p className="text-xs text-destructive">{run.error_message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                      {duration != null && <span>{duration}s</span>}
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        run.status === 'success' ? 'bg-green-100 text-green-800' :
                        run.status === 'failed' ? 'bg-red-100 text-red-800' :
                        run.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>{run.status}</span>
                      <span>{new Date(run.started_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground text-sm flex items-center gap-1.5">
            <Zap className="size-3.5" />
            About GratisGIS
          </p>
          <p>
            GratisGIS is the adopted spatial engine for Umkhandlu. It provides an OGC API Features
            endpoint for serving approved geometry. The system currently serves geometry directly
            from Supabase JSONB — this is the valid interim state while GratisGIS is being configured.
          </p>
          <p>
            GratisGIS is a read-only integration. Features are fetched from GratisGIS collections,
            staged for operator review, approved, and then published. The system does not write
            to GratisGIS — it reads from it.
          </p>
          <p>
            Do not upload private or restricted datasets to GratisGIS. Only datasets with confirmed
            redistribution permission should be published through GratisGIS.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
