import { PageHeader } from '@unami/ui';
import { fetchSpatialSources, fetchRecentImports } from '@/lib/gis/spatial-sources-fetcher';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const permissionColour: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-800',
  confirmed:  'bg-green-100 text-green-800',
  restricted: 'bg-red-100 text-red-800',
  denied:     'bg-red-200 text-red-900',
  reference:  'bg-blue-100 text-blue-800',
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

export default async function SpatialSourcesPage() {
  const [sources, imports] = await Promise.all([
    fetchSpatialSources(),
    fetchRecentImports(10),
  ]);

  const pending    = sources.filter((s) => s.permission_status === 'pending').length;
  const confirmed  = sources.filter((s) => s.permission_status === 'confirmed').length;
  const restricted = sources.filter((s) => s.permission_status === 'restricted' || s.permission_status === 'denied').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spatial Data Sources"
        description="Institutional GIS sources, connection status and import history for Amajuba District."
      />

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{sources.length}</p>
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
          <CardTitle>Registered Sources</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {sources.map((source) => (
              <div key={source.id} className="px-6 py-4 space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{source.name}</p>
                    <p className="text-xs text-muted-foreground">{source.institution}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${permissionColour[source.permission_status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {source.permission_status}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {sourceTypeLabel[source.source_type] ?? source.source_type}
                    </Badge>
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
                  {source.last_successful_import_at && (
                    <span>Last import: {new Date(source.last_successful_import_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
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
