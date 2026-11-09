import { getRegisteredNodes } from '@/lib/nodes/fetcher';
import { getNodeClient } from '@/lib/api/client';
import type { GeoRef, NodeMunicipalitySummary, NodeWardSummary } from '@unami/api';

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

export type AreaType = 'municipality' | 'ward' | 'district' | 'locality';

export interface AreaGeoRef extends GeoRef {
  nodeId: string;
  nodeName: string;
  nodeAuthority: string;
  nodeUrl: string;
}

export interface AreaNodeSummary {
  nodeId: string;
  nodeName: string;
  nodeAuthority: string;
  nodeUrl: string;
  municipality: NodeMunicipalitySummary | null;
  ward: NodeWardSummary | null;
  // null = node did not respond; undefined = capability not available
  available: boolean;
}

export interface AreaReport {
  areaName: string;
  areaType: AreaType;
  // Governance intelligence from nodes — not copied, fetched live
  nodeSummaries: AreaNodeSummary[];
  // GeoRefs filtered to this area — records/notices/projects with coordinates
  geoRefs: AreaGeoRef[];
  // Aggregate counts across all responding nodes
  totals: {
    records: number;
    notices: number;
    activeProjects: number;
    activeDevNotices: number;
  };
  generatedAt: string;
  // Nodes that did not respond
  unavailableNodes: string[];
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchesArea(ref: GeoRef, areaName: string, areaType: AreaType): boolean {
  const n = normalise(areaName);
  switch (areaType) {
    case 'municipality': return normalise(ref.municipality ?? '') === n;
    case 'ward':         return normalise(ref.ward ?? '') === n;
    case 'district':     return normalise(ref.district ?? '') === n;
    case 'locality':     return normalise(ref.locality ?? '') === n;
  }
}

export async function buildAreaReport(
  areaName: string,
  areaType: AreaType,
): Promise<AreaReport> {
  const nodes = await getRegisteredNodes();

  const results = await Promise.all(
    nodes.map(async (node) => {
      const client = getNodeClient(node.url, node.api_key);
      const spatial = await safe(() => client.spatialSummary());

      if (!spatial) {
        return { node, spatial: null, geoRefs: [] as GeoRef[] };
      }

      // Fall back to GeoRefs from records/notices if spatialSummary has none
      const geoRefs: GeoRef[] = spatial.geoRefs?.length
        ? spatial.geoRefs
        : await (async () => {
            const [records, notices] = await Promise.all([
              safe(() => client.recordsSummary()),
              safe(() => client.noticesSummary()),
            ]);
            const refs: GeoRef[] = [];
            for (const item of records?.recent ?? []) {
              if (item.geoRef) refs.push({ ...item.geoRef, recordId: item.id, recordType: 'record', label: item.title });
            }
            for (const item of notices?.recentActivity ?? []) {
              if (item.geoRef) refs.push({ ...item.geoRef, recordId: item.id, recordType: 'notice', label: item.title });
            }
            return refs;
          })();

      return { node, spatial, geoRefs };
    }),
  );

  const nodeSummaries: AreaNodeSummary[] = [];
  const filteredGeoRefs: AreaGeoRef[] = [];
  const unavailableNodes: string[] = [];
  const totals = { records: 0, notices: 0, activeProjects: 0, activeDevNotices: 0 };

  for (const { node, spatial, geoRefs } of results) {
    if (!spatial) {
      unavailableNodes.push(node.name);
      nodeSummaries.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeAuthority: node.authority,
        nodeUrl: node.url,
        municipality: null,
        ward: null,
        available: false,
      });
      continue;
    }

    // Match municipality or ward summary from spatial summary
    const municipality = areaType === 'municipality'
      ? (spatial.municipalities ?? []).find((m) => normalise(m.name) === normalise(areaName)) ?? null
      : (spatial.municipalities ?? []).find((m) => normalise(m.name) === normalise(areaName)) ?? null;

    const ward = areaType === 'ward'
      ? (spatial.wards ?? []).find((w) => normalise(`ward ${w.wardNumber}`) === normalise(areaName) || normalise(String(w.wardNumber)) === normalise(areaName)) ?? null
      : null;

    const summary: AreaNodeSummary = {
      nodeId: node.id,
      nodeName: node.name,
      nodeAuthority: node.authority,
      nodeUrl: node.url,
      municipality,
      ward,
      available: true,
    };
    nodeSummaries.push(summary);

    // Aggregate totals from matched summaries
    if (municipality) {
      totals.records       += municipality.recordCount;
      totals.notices       += municipality.noticeCount;
      totals.activeProjects += municipality.activeProjects;
      totals.activeDevNotices += municipality.activeDevNotices;
    } else if (ward) {
      totals.records        += ward.recordCount;
      totals.activeProjects += ward.activeProjects;
    }

    // Filter GeoRefs to this area
    for (const ref of geoRefs) {
      if (matchesArea(ref, areaName, areaType)) {
        filteredGeoRefs.push({
          ...ref,
          nodeId: node.node_id ?? node.id,
          nodeName: node.name,
          nodeAuthority: node.authority,
          nodeUrl: node.url,
        });
      }
    }
  }

  return {
    areaName,
    areaType,
    nodeSummaries,
    geoRefs: filteredGeoRefs,
    totals,
    generatedAt: new Date().toISOString(),
    unavailableNodes,
  };
}
