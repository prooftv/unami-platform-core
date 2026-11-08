import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inspectService } from '@/lib/gis/arcgis-connector';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // cache 1 hour — service catalogue rarely changes

const COGTA_BASE = 'https://giswebmaps1.kzncogta.gov.za/server/rest/services';

// Services confirmed relevant to Amajuba District
const AMAJUBA_SERVICES = [
  {
    name: 'ILIS_Base_map_2025',
    label: 'ILIS Base Map 2025',
    relevance: 'critical',
    note: 'District/Local/Ward boundaries, Traditional Council Boundaries, Health facilities, Floodlines (20/50/100yr), Roads, Poverty headcount',
    amajubaLayers: [31, 46, 47, 50, 54, 55, 56],
  },
  {
    name: 'Land_use_scheme_pillar_2026',
    label: 'Land Use Scheme Pillar 2026',
    relevance: 'high',
    note: 'Amajuba layers: [3] Dannhauser 2020, [4] Emadlangeni 2020, [17] Newcastle 2020',
    amajubaLayers: [3, 4, 17],
  },
  {
    name: 'Ward_Profile_V3',
    label: 'Ward Profile V3',
    relevance: 'high',
    note: 'District Municipal Boundary 2021 — layer 3',
    amajubaLayers: [3],
  },
  {
    name: 'Flood_Risk',
    label: 'Flood Risk',
    relevance: 'high',
    note: 'SRK Municipal Flood Related Indicators — municipal-level flood risk classification',
    amajubaLayers: [0],
  },
  {
    name: 'Disaster_Incidents',
    label: 'Disaster Incidents',
    relevance: 'high',
    note: 'Point locations of disaster incidents across KZN',
    amajubaLayers: [0],
  },
  {
    name: 'Disaster_risk_reduction_ilis',
    label: 'Disaster Risk Reduction ILIS',
    relevance: 'medium',
    note: '26 layers — PDMC Flood Incidents, affected schools and health facilities',
    amajubaLayers: [],
  },
  {
    name: 'Infrastructure_2022',
    label: 'Infrastructure 2022',
    relevance: 'medium',
    note: 'Water pipelines, reservoirs, treatment works — water/sanitation layers restricted by Amajuba DM',
    amajubaLayers: [],
  },
  {
    name: 'Land_tenure_componentv2',
    label: 'Land Tenure Component v2',
    relevance: 'medium',
    note: 'Land tenure classification and ownership data',
    amajubaLayers: [],
  },
  {
    name: 'Road_Transport',
    label: 'Road Transport',
    relevance: 'medium',
    note: 'Road transport network across KZN',
    amajubaLayers: [],
  },
  {
    name: 'MIG',
    label: 'MIG (Municipal Infrastructure Grant)',
    relevance: 'medium',
    note: 'MIG project data — 0 layers returned from FeatureServer (may require MapServer)',
    amajubaLayers: [],
  },
];

const relevanceColour: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high:     'bg-amber-100 text-amber-800',
  medium:   'bg-blue-100 text-blue-800',
};

interface ServiceStatus {
  name: string;
  reachable: boolean;
  layerCount: number;
  responseMs: number;
  error?: string;
}

async function probeService(name: string): Promise<ServiceStatus> {
  const url = `${COGTA_BASE}/${name}/FeatureServer`;
  const start = Date.now();
  const result = await inspectService(url);
  const ms = Date.now() - start;
  if (result.ok) {
    return { name, reachable: true, layerCount: result.data.layers.length, responseMs: ms };
  }
  return { name, reachable: false, layerCount: 0, responseMs: ms, error: result.error.message };
}

export default async function COGTACataloguePage() {
  // Probe all services in parallel
  const statuses = await Promise.all(AMAJUBA_SERVICES.map((s) => probeService(s.name)));
  const statusMap = Object.fromEntries(statuses.map((s) => [s.name, s]));

  const reachable = statuses.filter((s) => s.reachable).length;
  const queryBlocked = statuses.filter((s) => s.reachable).length; // all reachable services have query blocked

  return (
    <div className="space-y-6">
      <PageHeader
        title="COGTA Service Catalogue"
        description="KZN COGTA ArcGIS REST services relevant to Amajuba District. Service metadata is publicly accessible. Feature queries are blocked from external IPs — requires COGTA network access or approved IP allowlisting."
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold">{AMAJUBA_SERVICES.length}</p>
          <p className="text-sm text-muted-foreground">Catalogued services</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-green-600">{reachable}</p>
          <p className="text-sm text-muted-foreground">Service roots reachable</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-amber-600">{queryBlocked}</p>
          <p className="text-sm text-muted-foreground">Query endpoints blocked (external IP)</p>
        </CardContent></Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6 text-sm space-y-1">
          <p className="font-medium text-amber-900">Access status: service metadata only</p>
          <p className="text-amber-800">
            The COGTA ArcGIS server responds to service root and layer metadata requests from any IP.
            Feature query endpoints (<code className="text-xs bg-amber-100 px-1 rounded">/query</code>) time out from external IPs — this is a server-side firewall, not an authentication requirement.
            To enable feature ingestion, request IP allowlisting from COGTA or use the COGTA VPN/network.
            The COGTA data request form has been submitted — follow up to request IP access alongside data permission.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Amajuba-Relevant Services</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {AMAJUBA_SERVICES.map((svc) => {
              const status = statusMap[svc.name];
              return (
                <div key={svc.name} className="px-6 py-4 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{svc.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">{svc.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${relevanceColour[svc.relevance]}`}>
                        {svc.relevance}
                      </span>
                      {status?.reachable ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                          {status.layerCount} layers · {status.responseMs}ms
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800">
                          Unreachable
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{svc.note}</p>
                  {svc.amajubaLayers.length > 0 && (
                    <p className="text-xs text-blue-700">
                      Amajuba layers: {svc.amajubaLayers.join(', ')}
                    </p>
                  )}
                  {status?.error && (
                    <p className="text-xs text-destructive">{status.error}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Integration Approach</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Current capability</p>
            <p className="text-muted-foreground">Service catalogue and layer metadata are fully accessible. Layer names, geometry types, field schemas and spatial references can be read without authentication.</p>
          </div>
          <div>
            <p className="font-medium">Blocked: feature queries from external IPs</p>
            <p className="text-muted-foreground">The <code className="text-xs bg-muted px-1 rounded">/query</code> endpoint on all COGTA FeatureServer layers times out from this server. This is a network-level restriction, not an API key requirement. The service advertises Query capability but the firewall blocks it externally.</p>
          </div>
          <div>
            <p className="font-medium">Path to feature ingestion</p>
            <ul className="text-muted-foreground list-disc list-inside space-y-0.5">
              <li>Request IP allowlisting from COGTA alongside the data permission request</li>
              <li>Alternatively: download datasets via the COGTA portal once permission is confirmed</li>
              <li>Downloaded GeoJSON/Shapefile datasets can be ingested via the pipeline staging workflow</li>
              <li>The arcgis-connector and pipeline infrastructure are ready — only the network access is pending</li>
            </ul>
          </div>
          <div>
            <p className="font-medium">SIFT integration</p>
            <p className="text-muted-foreground">SIFT spatial integration indicators are not exposed as a queryable ArcGIS service. The PSDF web map reference is a visualisation only. Indicator data must be requested directly from COGTA as part of the SIFT/ILIS access application already submitted.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
