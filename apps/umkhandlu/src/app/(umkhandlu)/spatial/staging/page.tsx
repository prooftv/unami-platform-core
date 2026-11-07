import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/server';
import { StagingReviewClient } from './_components/StagingReviewClient';

export const dynamic = 'force-dynamic';

export default async function StagingPage() {
  const supabase = createServiceClient();

  const { data: datasets } = await supabase
    .from('spatial_datasets')
    .select('id, name, spatial_sources(institution)')
    .eq('status', 'staged');

  const stagedDatasets = datasets ?? [];

  // Fetch pending features for each staged dataset
  const datasetIds = stagedDatasets.map((d) => d.id);
  const { data: features } = datasetIds.length
    ? await supabase
        .from('spatial_staged_features')
        .select('id, dataset_id, geometry_valid, geometry_issues, feature_properties, operator_status')
        .in('dataset_id', datasetIds)
        .eq('operator_status', 'pending')
        .order('created_at', { ascending: true })
    : { data: [] };

  const pendingFeatures = features ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staging Review"
        description="Review and approve or reject staged spatial features before publication."
      />

      {stagedDatasets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No datasets awaiting review. Staged features appear here after a pipeline run.
          </CardContent>
        </Card>
      ) : (
        stagedDatasets.map((dataset) => {
          const srcRaw = dataset.spatial_sources;
          const src = Array.isArray(srcRaw) ? (srcRaw[0] as { institution: string } | undefined) : (srcRaw as { institution: string } | null);
          const datasetFeatures = pendingFeatures.filter((f) => f.dataset_id === dataset.id);
          return (
            <Card key={dataset.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {dataset.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {src?.institution} · {datasetFeatures.length} features pending
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StagingReviewClient
                  datasetId={dataset.id}
                  features={datasetFeatures}
                />
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
