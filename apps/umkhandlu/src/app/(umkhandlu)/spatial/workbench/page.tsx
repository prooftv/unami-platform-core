import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createServiceClient } from '@/lib/supabase/server';
import { PROXIMITY_RADIUS } from '@/app/(umkhandlu)/notices/[id]/_components/notice-layer-config';
import { computeProximityFindings } from '@/lib/gis/proximity-findings';
import {
  Map,
  Layers,
  ExternalLink,
  Globe,
  FileSearch,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  MapPin,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const GEOLIBRE_URL = process.env.GEOLIBRE_URL ?? 'https://maps.gis.unamifoundation.org';

const STAGE_NEXT: Record<string, string> = {
  draft: 'Advance to Workbench Analysis',
  workbench: 'Complete analysis in GeoLibre, then advance to Review',
  review: 'Approve or reject in the workflow page',
  approved: 'Transfer to Governance Node',
  transferred: 'Confirm publication on Governance Node',
  published: 'Workflow complete',
  rejected: 'Restart workflow if required',
};

async function getWorkbenchContext() {
  const supabase = createServiceClient();
  const [{ count: datasetCount }, { count: noticeCount }, { count: qualityCount }] =
    await Promise.all([
      supabase
        .from('spatial_datasets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('active', true),
      supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .in('status', ['published', 'open'])
        .not('latitude', 'is', null),
      supabase
        .from('spatial_discrepancies')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open'),
    ]);
  return { datasetCount: datasetCount ?? 0, noticeCount: noticeCount ?? 0, qualityCount: qualityCount ?? 0 };
}

async function getNoticeContext(noticeId: string) {
  const supabase = createServiceClient();
  const { data: notice } = await supabase
    .from('notices')
    .select('id, title, type, status, is_statutory, latitude, longitude, ward_ref')
    .eq('id', noticeId)
    .maybeSingle();
  if (!notice) return null;

  const { data: run } = await supabase
    .from('notice_workflow_runs')
    .select('id, stage, preset_id, geolibre_project_url, gn_notice_ref, approved_at, transferred_at')
    .eq('notice_id', noticeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: preset } = run?.preset_id
    ? await supabase
        .from('notice_presets')
        .select('id, label, proximity_radius_metres, validation_rules, gn_publication_required')
        .eq('id', (run as Record<string, unknown>).preset_id as string)
        .maybeSingle()
    : { data: null };

  // Fetch layers (no features — just availability checklist)
  let layers: Array<{
    id: string;
    label: string;
    role: string;
    availability: 'available' | 'pending-permission' | 'not-available';
    permissionNote: string | null;
    attribution: string | null;
    statutoryRelevance: string;
    features: { type: 'FeatureCollection'; features: unknown[] } | null;
  }> = [];

  let proximityFindingCount = 0;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
    const qp = new URLSearchParams({ noticeType: notice.type, features: 'true' });
    if (notice.ward_ref) {
      const m = String(notice.ward_ref).match(/(\d+)/);
      if (m) qp.set('wardNumber', m[1]);
    }
    const res = await fetch(`${baseUrl}/api/spatial/notice-layers?${qp}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const body = await res.json() as { layers: typeof layers };
      layers = body.layers ?? [];

      // Compute proximity findings count if we have coordinates
      const radiusConfig = PROXIMITY_RADIUS[notice.type];
      if (radiusConfig && notice.latitude && notice.longitude) {
        const proxyLayers = layers.map((l) => ({
          id: l.id,
          label: l.label,
          role: l.role,
          availability: l.availability,
          permissionNote: l.permissionNote,
          attribution: l.attribution,
          statutoryRelevance: l.statutoryRelevance,
          geojson: l.features as { type: 'FeatureCollection'; features: Array<{ id?: string | number; type: 'Feature'; geometry: unknown; properties: Record<string, unknown> | null }> } | null,
        }));
        const findings = computeProximityFindings(
          proxyLayers,
          { lat: notice.latitude, lng: notice.longitude },
          radiusConfig.metres,
        );
        proximityFindingCount = findings.length;
      }
    }
  } catch {
    // non-fatal
  }

  return { notice, run, preset, layers, proximityFindingCount };
}

function buildGeoLibreUrl(params: { noticeId?: string; noticeType?: string; ward?: string; lat?: string; lng?: string }) {
  const base = GEOLIBRE_URL;
  const q = new URLSearchParams();
  if (params.noticeId) q.set('ref', `notice:${params.noticeId}`);
  if (params.noticeType) q.set('type', params.noticeType);
  if (params.ward) q.set('ward', params.ward);
  if (params.lat && params.lng) { q.set('lat', params.lat); q.set('lng', params.lng); }
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

function AvailabilityIcon({ status }: { status: string }) {
  if (status === 'available') return <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />;
  if (status === 'pending-permission') return <Clock className="size-3.5 text-amber-500 shrink-0" />;
  return <XCircle className="size-3.5 text-red-400 shrink-0" />;
}

export default async function SpatialWorkbenchPage({
  searchParams,
}: {
  searchParams: Promise<{ noticeId?: string; noticeType?: string; ward?: string; lat?: string; lng?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getWorkbenchContext();
  const noticeCtx = params.noticeId ? await getNoticeContext(params.noticeId) : null;

  const hasContext = !!(params.noticeId || params.lat);
  const geolibreUrl = hasContext ? buildGeoLibreUrl(params) : GEOLIBRE_URL;

  const availableLayers = noticeCtx?.layers.filter((l) => l.availability === 'available') ?? [];
  const pendingLayers = noticeCtx?.layers.filter((l) => l.availability !== 'available') ?? [];
  const radiusConfig = noticeCtx ? PROXIMITY_RADIUS[noticeCtx.notice.type] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spatial Workbench"
        description="Routine spatial workflows and advanced GIS analysis for Amajuba District."
      />

      {hasContext && (
        <Alert>
          <FileSearch className="size-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>
              {params.noticeId
                ? `Opened from notice context${params.noticeType ? ` (${params.noticeType.replace(/-/g, ' ')})` : ''}.`
                : 'Opened with spatial context.'}
              {params.returnTo && (
                <Link href={params.returnTo} className="ml-2 text-blue-600 hover:underline text-sm">
                  ← Return to record
                </Link>
              )}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* ── F-1: Notice context panel ── */}
      {noticeCtx && (
        <div className="space-y-4">
          {/* Notice summary */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileSearch className="size-4 text-blue-600" />
                  {noticeCtx.notice.title}
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs capitalize">
                    {noticeCtx.notice.type.replace(/-/g, ' ')}
                  </Badge>
                  {noticeCtx.notice.is_statutory && (
                    <Badge variant="outline" className="text-xs text-purple-700 border-purple-300">
                      Statutory
                    </Badge>
                  )}
                  {noticeCtx.run && (
                    <Badge variant="outline" className="text-xs capitalize">
                      Stage: {noticeCtx.run.stage}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                {noticeCtx.notice.ward_ref && (
                  <span><span className="font-medium">Ward:</span> {noticeCtx.notice.ward_ref}</span>
                )}
                {noticeCtx.notice.latitude && noticeCtx.notice.longitude && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {noticeCtx.notice.latitude.toFixed(5)}, {noticeCtx.notice.longitude.toFixed(5)}
                  </span>
                )}
                {radiusConfig && (
                  <span><span className="font-medium">Proximity radius:</span> {radiusConfig.metres}m</span>
                )}
              </div>

              {/* Workflow stage guidance */}
              {noticeCtx.run ? (
                <div className="rounded-md bg-muted/50 px-3 py-2 text-xs space-y-0.5">
                  <p className="font-medium">Current stage: <span className="capitalize">{noticeCtx.run.stage}</span></p>
                  <p className="text-muted-foreground">{STAGE_NEXT[noticeCtx.run.stage] ?? 'See workflow page.'}</p>
                  {noticeCtx.run.geolibre_project_url && (
                    <a
                      href={noticeCtx.run.geolibre_project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                    >
                      GeoLibre project <ExternalLink className="size-3" />
                    </a>
                  )}
                  {noticeCtx.run.gn_notice_ref && (
                    <p className="text-green-700">GN ref: {noticeCtx.run.gn_notice_ref}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  No workflow run started.{' '}
                  <Link href={`/notices/${noticeCtx.notice.id}/workflow`} className="underline">
                    Start workflow →
                  </Link>
                </div>
              )}

              <div className="flex gap-2 pt-1 flex-wrap">
                <Link
                  href={`/notices/${noticeCtx.notice.id}`}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  Notice detail <ArrowRight className="size-3" />
                </Link>
                <Link
                  href={`/notices/${noticeCtx.notice.id}/workflow`}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  Workflow <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Dataset availability checklist */}
          {noticeCtx.layers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="size-4 text-violet-600" />
                  Preset Dataset Checklist
                  <span className="text-xs font-normal text-muted-foreground">
                    {availableLayers.length}/{noticeCtx.layers.length} available
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {noticeCtx.layers.map((layer) => (
                  <div key={layer.id} className="flex items-start gap-2 py-1 border-b last:border-0">
                    <AvailabilityIcon status={layer.availability} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium leading-tight">{layer.label}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{layer.statutoryRelevance}</p>
                      {layer.availability !== 'available' && layer.permissionNote && (
                        <p className="text-xs text-amber-600 mt-0.5">{layer.permissionNote}</p>
                      )}
                    </div>
                    <span className={`text-xs shrink-0 px-1.5 py-0.5 rounded font-medium ${
                      layer.availability === 'available'
                        ? 'bg-green-100 text-green-700'
                        : layer.availability === 'pending-permission'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {layer.availability === 'available' ? 'Ready' : layer.availability === 'pending-permission' ? 'Pending' : 'Unavailable'}
                    </span>
                  </div>
                ))}
                {pendingLayers.length > 0 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    {pendingLayers.length} layer{pendingLayers.length !== 1 ? 's' : ''} pending permission or unavailable — screening will be incomplete.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Proximity findings summary */}
          {radiusConfig && noticeCtx.notice.latitude && noticeCtx.notice.longitude && (
            <Card className="border-violet-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="size-4 text-violet-600" />
                  Proximity Summary
                  <span className="text-xs font-normal text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full">
                    {radiusConfig.metres}m radius
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1 pt-0">
                <p className="text-xs text-muted-foreground">{radiusConfig.statutoryBasis}</p>
                {noticeCtx.proximityFindingCount > 0 ? (
                  <p className="text-sm font-medium text-violet-700">
                    {noticeCtx.proximityFindingCount} feature{noticeCtx.proximityFindingCount !== 1 ? 's' : ''} found within {radiusConfig.metres}m
                  </p>
                ) : availableLayers.filter((l) => l.role === 'proximity').length === 0 ? (
                  <p className="text-xs text-amber-600">No proximity layers available — screening incomplete.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">No features found within radius from available layers.</p>
                )}
                <Link
                  href={`/notices/${noticeCtx.notice.id}`}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  View full proximity findings on notice page <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Routine workflows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/spatial/map" className="block group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Map className="size-4 text-blue-600" />
                Geographic View
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Published datasets, active notices and governance node activity.
              </p>
              <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                <span className="text-green-600">{ctx.datasetCount} datasets</span>
                <span>{ctx.noticeCount} georeferenced notices</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/spatial/datasets" className="block group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="size-4 text-violet-600" />
                Datasets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Manage published spatial datasets, staging review and layer configuration.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/spatial/report" className="block group">
          <Card className="h-full transition-colors group-hover:border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="size-4 text-amber-600" />
                Spatial Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Coverage, quality metrics and dataset status summary.
              </p>
              {ctx.qualityCount > 0 && (
                <p className="text-xs text-amber-600">{ctx.qualityCount} open quality issues</p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Advanced GIS workspace */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5 text-emerald-600" />
              Advanced GIS Workspace
              <Badge variant="outline" className="text-xs">GeoLibre v3.9.0</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Full-featured GIS environment for advanced spatial exploration, analysis, cartographic
            layouts and project-based work. Opens in a new tab.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Capabilities</p>
              <ul className="space-y-0.5 text-sm text-muted-foreground">
                <li>• Vector and raster layer exploration</li>
                <li>• AI Assistant — spatial SQL, restyling, processing tools</li>
                <li>• Model Builder — repeatable geoprocessing workflows</li>
                <li>• Cartographic layouts and PDF export</li>
                <li>• KML/KMZ import for external evidence</li>
                <li>• GeoLibre MCP for external automation</li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Data access</p>
              <ul className="space-y-0.5 text-sm text-muted-foreground">
                <li>• GratisGIS OGC API Features</li>
                <li>• Approved Amajuba spatial datasets</li>
                <li>• Administrative boundaries</li>
                <li>• OSM contextual layers</li>
                <li>• Uploaded project files</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={geolibreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Globe className="size-4" />
              {hasContext ? 'Open GeoLibre with notice context' : 'Open GeoLibre'}
              <ExternalLink className="size-3.5" />
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            GeoLibre is deployed at{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">{GEOLIBRE_URL}</code>.
            Sign in with your operator credentials.
            AI-generated outputs must be reviewed before use in statutory assessments.
          </p>
        </CardContent>
      </Card>

      {/* GratisGIS connection status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            GratisGIS OGC Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            GratisGIS is live at{' '}
            <a href="https://gis.unamifoundation.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              gis.unamifoundation.org
            </a>.
            Configure <code className="bg-muted px-1 py-0.5 rounded text-xs">GRATISGIS_OGC_API_URL</code> in
            the Control Centre environment to enable OGC API Features integration.
          </p>
          <Link href="/spatial/gratisgis" className="text-xs text-blue-600 hover:underline">
            View GratisGIS integration status →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
