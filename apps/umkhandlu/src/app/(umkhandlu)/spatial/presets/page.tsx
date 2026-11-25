import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createServiceClient } from '@/lib/supabase/server';
import { CheckCircle, Circle, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const NOTICE_TYPE_LABELS: Record<string, string> = {
  liquor: 'Liquor Licence',
  eia: 'EIA / Environmental Authorisation',
  mining: 'Mining Rights',
  rezoning: 'Rezoning',
  'land-use': 'Land Use',
  township: 'Township Establishment',
  building: 'Building Plans',
  telecom: 'Telecommunications',
  infrastructure: 'Infrastructure / Development',
};

export default async function PresetsPage() {
  const supabase = createServiceClient();
  const { data: presets } = await supabase
    .from('notice_presets')
    .select('*')
    .eq('active', true)
    .order('notice_type');

  const { data: runs } = await supabase
    .from('notice_workflow_runs')
    .select('notice_type, stage')
    .not('stage', 'in', '("rejected","published")');

  const activeByType = (runs ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.notice_type] = (acc[r.notice_type] ?? 0) + 1;
    return acc;
  }, {});

  const rows = presets ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Presets"
        description="Workflow configuration for each statutory notice type. Defines required datasets, GeoLibre tools, validation rules and publication requirements."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{rows.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Active presets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{rows.filter((p) => p.gn_publication_required).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Require GN publication</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{Object.values(activeByType).reduce((a, b) => a + b, 0)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Active workflow runs</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {rows.map((preset) => {
          const params = preset.processing_parameters as Record<string, unknown> ?? {};
          const layers = (params.layers as string[] | undefined) ?? [];
          const proximityMetres = preset.proximity_radius_metres;
          const proximityBasis = typeof params.proximityBasis === 'string' ? params.proximityBasis : undefined;
          const watercourseSetback = typeof params.watercourseSetbackMetres === 'number' ? params.watercourseSetbackMetres : undefined;
          const validationRules = (preset.validation_rules as Array<{rule: string; description: string}> | undefined) ?? [];
          const provFields = (preset.required_provenance_fields as string[] | undefined) ?? [];
          const tools = preset.geolibre_tools as string[] ?? [];
          const activeRuns = activeByType[preset.notice_type] ?? 0;

          return (
            <Card key={preset.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{preset.label}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{preset.notice_type}</Badge>
                    <Badge variant="secondary">v{preset.version}</Badge>
                    {activeRuns > 0 && (
                      <Badge>{activeRuns} active</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">

                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground uppercase tracking-wide">Proximity</p>
                    {proximityMetres ? (
                      <div>
                        <p className="font-medium">{proximityMetres}m screening zone</p>
                        {proximityBasis && <p className="text-muted-foreground">{proximityBasis}</p>}
                      </div>
                    ) : watercourseSetback ? (
                      <div>
                        <p className="font-medium">{watercourseSetback}m watercourse setback</p>
                        {typeof params.setbackBasis === 'string' && <p className="text-muted-foreground">{params.setbackBasis}</p>}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No statutory radius — case-by-case</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground uppercase tracking-wide">Spatial layers ({layers.length})</p>
                    <div className="space-y-0.5">
                      {layers.slice(0, 6).map((l) => (
                        <p key={l} className="text-muted-foreground">{l}</p>
                      ))}
                      {layers.length > 6 && <p className="text-muted-foreground">+{layers.length - 6} more</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground uppercase tracking-wide">GeoLibre tools</p>
                    <div className="space-y-0.5">
                      {tools.map((t) => <p key={t} className="text-muted-foreground">{t}</p>)}
                      {tools.length === 0 && <p className="text-muted-foreground">None configured</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium text-muted-foreground uppercase tracking-wide">Publication</p>
                    <div className="flex items-center gap-1.5">
                      {preset.gn_publication_required
                        ? <CheckCircle className="size-3.5 text-green-600" />
                        : <Circle className="size-3.5 text-muted-foreground" />}
                      <span>{preset.gn_publication_required ? 'GN publication required' : 'Internal only'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {preset.subject_geometry_required
                        ? <CheckCircle className="size-3.5 text-green-600" />
                        : <Circle className="size-3.5 text-muted-foreground" />}
                      <span>{preset.subject_geometry_required ? 'Site geometry required' : 'Geometry optional'}</span>
                    </div>
                  </div>
                </div>

                {validationRules.length > 0 && (
                  <div className="border-t pt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Validation rules</p>
                    <div className="flex flex-wrap gap-2">
                      {validationRules.map((r) => (
                        <span key={r.rule} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded">
                          <AlertTriangle className="size-3 text-amber-500" />
                          {r.description}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {provFields.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Required provenance</p>
                    <div className="flex flex-wrap gap-1.5">
                      {provFields.map((f) => (
                        <span key={f} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
