import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createServiceClient } from '@/lib/supabase/server';
import {
  Map,
  Layers,
  ExternalLink,
  ArrowRight,
  Globe,
  FileSearch,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const GEOLIBRE_URL = process.env.GEOLIBRE_URL ?? 'https://maps.gis.unamifoundation.org';

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
  return {
    datasetCount: datasetCount ?? 0,
    noticeCount: noticeCount ?? 0,
    qualityCount: qualityCount ?? 0,
  };
}

export default async function SpatialWorkbenchPage({
  searchParams,
}: {
  searchParams: Promise<{ noticeId?: string; noticeType?: string; ward?: string; lat?: string; lng?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getWorkbenchContext();

  const hasContext = !!(params.noticeId || params.lat);
  const geolibreUrl = hasContext
    ? buildGeoLibreUrl(params)
    : GEOLIBRE_URL;

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
                <li>• Spatial analysis and proximity assessment</li>
                <li>• Cartographic layouts and PDF export</li>
                <li>• KML/KMZ import for external evidence</li>
                <li>• Collaborative project workspaces</li>
                <li>• Terrain and elevation context</li>
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
              Open GeoLibre
              <ExternalLink className="size-3.5" />
            </a>
            {hasContext && params.noticeId && (
              <a
                href={geolibreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Open with notice context
                <ArrowRight className="size-3.5" />
              </a>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            GeoLibre is deployed at{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs">{GEOLIBRE_URL}</code>.
            Sign in with your operator credentials.
            Analytical outputs from GeoLibre are contextual evidence — they are not authoritative
            Governance Node records.
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

function buildGeoLibreUrl(params: {
  noticeId?: string;
  noticeType?: string;
  ward?: string;
  lat?: string;
  lng?: string;
}): string {
  const base = process.env.GEOLIBRE_URL ?? 'https://maps.gis.unamifoundation.org';
  const q = new URLSearchParams();
  if (params.noticeId) q.set('ref', `notice:${params.noticeId}`);
  if (params.noticeType) q.set('type', params.noticeType);
  if (params.ward) q.set('ward', params.ward);
  if (params.lat && params.lng) {
    q.set('lat', params.lat);
    q.set('lng', params.lng);
  }
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}
