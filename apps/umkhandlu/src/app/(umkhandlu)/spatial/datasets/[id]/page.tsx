import { notFound } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { GeoJSONUpload } from '../_components/GeoJSONUpload';
import { LiveFetchTrigger } from '../_components/LiveFetchTrigger';
import { DatasetActions } from '../_components/DatasetActions';
import { DatasetSourceUrlForm } from '../_components/DatasetSourceUrlForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const dynamic = 'force-dynamic';

const statusColour: Record<string, string> = {
  pending:    'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-800',
  staged:     'bg-amber-100 text-amber-800',
  published:  'bg-green-100 text-green-800',
  rejected:   'bg-red-100 text-red-800',
  archived:   'bg-gray-200 text-gray-600',
};

const runStatusColour: Record<string, string> = {
  running: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed:  'bg-red-100 text-red-800',
  partial: 'bg-amber-100 text-amber-800',
};

interface Props { params: Promise<{ id: string }> }

export default async function DatasetDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: dataset }, { data: runs }, { count: pendingCount }, { count: approvedCount }] = await Promise.all([
    supabase
      .from('spatial_datasets')
      .select('*, spatial_sources(name, institution, coordinate_system, source_type, permission_classification)')
      .eq('id', id)
      .single(),
    supabase
      .from('spatial_pipeline_runs')
      .select('id, pipeline_type, status, started_at, completed_at, features_fetched, features_processed, error_message, triggered_by')
      .eq('dataset_id', id)
      .order('started_at', { ascending: false })
      .limit(20),
    supabase
      .from('spatial_staged_features')
      .select('*', { count: 'exact', head: true })
      .eq('dataset_id', id)
      .eq('operator_status', 'pending'),
    supabase
      .from('spatial_staged_features')
      .select('*', { count: 'exact', head: true })
      .eq('dataset_id', id)
      .eq('operator_status', 'approved'),
  ]);

  if (!dataset) notFound();

  const src = Array.isArray(dataset.spatial_sources)
    ? (dataset.spatial_sources[0] as { name: string; institution: string; coordinate_system: string; source_type: string; permission_classification: string } | undefined)
    : (dataset.spatial_sources as { name: string; institution: string; coordinate_system: string; source_type: string; permission_classification: string } | null);

  return (
    <div className="space-y-6">
      <PageHeader
        title={dataset.name}
        description={src?.institution ?? ''}
        actions={<Button variant="outline" asChild><Link href="/spatial/datasets">Back</Link></Button>}
      />

      <div className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Source:</span> {src?.name ?? '—'}</p>
              <p><span className="text-muted-foreground">CRS:</span> {dataset.crs}</p>
              <p><span className="text-muted-foreground">Coverage:</span> {dataset.geographic_coverage}</p>
              {dataset.dataset_date && (
                <p><span className="text-muted-foreground">Data date:</span> {dataset.dataset_date}</p>
              )}
              {dataset.feature_count != null && (
                <p><span className="text-muted-foreground">Features:</span> {dataset.feature_count}</p>
              )}
              {dataset.custodian_name && (
                <p><span className="text-muted-foreground">Custodian:</span> {dataset.custodian_name}</p>
              )}
              <DatasetSourceUrlForm
                datasetId={dataset.id}
                sourceUrl={dataset.source_url}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex flex-col items-center gap-2">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColour[dataset.status] ?? ''}`}>
                  {dataset.status}
                </span>
                {dataset.published_at && (
                  <p className="text-xs text-muted-foreground">
                    Published {new Date(dataset.published_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <p className="text-lg font-semibold text-green-600">{approvedCount ?? 0}</p>
                  <p className="text-muted-foreground">Approved</p>
                </div>
                <div>
                  <p className={`text-lg font-semibold ${(pendingCount ?? 0) > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{pendingCount ?? 0}</p>
                  <p className="text-muted-foreground">Pending</p>
                </div>
              </div>
              <DatasetActions
                datasetId={dataset.id}
                status={dataset.status}
                pendingCount={pendingCount ?? 0}
                approvedCount={approvedCount ?? 0}
              />
            </CardContent>
          </Card>
        </div>

        {dataset.description && (
          <Card>
            <CardContent className="pt-6 text-sm">{dataset.description}</CardContent>
          </Card>
        )}

        {dataset.provenance && (
          <Card>
            <CardHeader><CardTitle>Provenance</CardTitle></CardHeader>
            <CardContent className="text-sm">{dataset.provenance}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Ingest Data</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue={src?.source_type?.startsWith('arcgis') ? 'live' : 'upload'}>
              <TabsList className="mb-4">
                {src?.source_type?.startsWith('arcgis') && (
                  <TabsTrigger value="live">Fetch from live service</TabsTrigger>
                )}
                <TabsTrigger value="upload">Upload GeoJSON</TabsTrigger>
              </TabsList>
              {src?.source_type?.startsWith('arcgis') && (
                <TabsContent value="live">
                  <LiveFetchTrigger
                    datasetId={dataset.id}
                    datasetStatus={dataset.status}
                    layerId={dataset.layer_id}
                    sourceType={src.source_type}
                    permissionClassification={src.permission_classification ?? dataset.permission_classification ?? 'pending'}
                    sourceName={src.name}
                  />
                </TabsContent>
              )}
              <TabsContent value="upload">
                <GeoJSONUpload datasetId={dataset.id} datasetStatus={dataset.status} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {runs && runs.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Pipeline History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {runs.map((run) => {
                  const duration = run.completed_at
                    ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                    : null;
                  return (
                    <div key={run.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                      <div className="min-w-0 space-y-0.5">
                        <p>{run.pipeline_type}</p>
                        {run.features_processed > 0 && (
                          <p className="text-xs text-muted-foreground">{run.features_processed} features processed</p>
                        )}
                        {run.error_message && (
                          <p className="text-xs text-destructive">{run.error_message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                        {duration != null && <span>{duration}s</span>}
                        <span className={`px-2 py-0.5 rounded-full font-medium ${runStatusColour[run.status] ?? ''}`}>
                          {run.status}
                        </span>
                        <span>{new Date(run.started_at).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
