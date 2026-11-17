import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/server';
import { LayerConfigEditor } from './_components/LayerConfigEditor';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, string> = {
  administrative: 'Administrative',
  infrastructure: 'Infrastructure',
  education:      'Education',
  health:         'Health',
  cultural:       'Cultural',
  environment:    'Environment',
  'land-use':     'Land Use',
  transport:      'Transport',
  general:        'General',
};

export default async function LayerConfigPage() {
  const supabase = createServiceClient();

  const { data: datasets } = await supabase
    .from('spatial_datasets')
    .select(`
      id, name, status, feature_count, permission_classification,
      spatial_sources(institution),
      spatial_layer_config(
        id, display_name, category, colour, fill_opacity, stroke_weight,
        stroke_opacity, point_radius, visible_default, display_order,
        min_zoom, max_zoom, attribution_override, legend_label, active
      )
    `)
    .eq('status', 'published')
    .eq('active', true)
    .order('name');

  const rows = (datasets ?? []).map((d) => {
    const src = Array.isArray(d.spatial_sources) ? d.spatial_sources[0] : d.spatial_sources;
    const cfg = Array.isArray(d.spatial_layer_config) ? d.spatial_layer_config[0] : d.spatial_layer_config;
    return {
      datasetId: d.id,
      datasetName: d.name,
      institution: (src as { institution?: string } | null)?.institution ?? '',
      featureCount: d.feature_count,
      permissionClassification: d.permission_classification,
      config: cfg ?? null,
    };
  });

  // Group by category
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const cat = (row.config?.category as string | undefined) ?? 'general';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(row);
  }

  // Datasets without config
  const unconfigured = rows.filter((r) => !r.config);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Layer Configuration"
        description="Manage display names, categories, colours and visibility for published spatial layers."
      />

      {rows.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No published datasets. Publish a dataset to configure its layer display settings.
          </CardContent>
        </Card>
      )}

      {unconfigured.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-sm text-amber-800">
              {unconfigured.length} dataset{unconfigured.length !== 1 ? 's' : ''} without layer configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {unconfigured.map((row) => (
                <div key={row.datasetId} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{row.datasetName}</p>
                    <p className="text-xs text-muted-foreground">{row.institution}</p>
                  </div>
                  <LayerConfigEditor
                    datasetId={row.datasetId}
                    datasetName={row.datasetName}
                    config={null}
                    compact
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {Array.from(grouped.entries()).map(([category, categoryRows]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{CATEGORY_LABELS[category] ?? category}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {categoryRows.map((row) => (
                <div key={row.datasetId} className="px-6 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {row.config?.colour && (
                          <span
                            className="inline-block size-3 rounded-sm shrink-0 border border-black/10"
                            style={{ backgroundColor: row.config.colour }}
                          />
                        )}
                        <p className="text-sm font-medium">{row.config?.display_name ?? row.datasetName}</p>
                        {row.config && !row.config.active && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Hidden</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {row.institution}
                        {row.featureCount != null ? ` · ${row.featureCount.toLocaleString()} features` : ''}
                        {row.config?.display_order != null ? ` · Order: ${row.config.display_order}` : ''}
                      </p>
                    </div>
                    <LayerConfigEditor
                      datasetId={row.datasetId}
                      datasetName={row.datasetName}
                      config={row.config}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
