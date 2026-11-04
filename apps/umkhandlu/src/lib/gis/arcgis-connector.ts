/**
 * ArcGIS REST connector — server-side only.
 *
 * Handles FeatureServer and MapServer discovery, layer metadata inspection,
 * feature querying, coordinate reference system detection, and GeoJSON export.
 *
 * Amajuba District bounding box (WGS84): lng_min=27.8, lat_min=-28.9, lng_max=30.2, lat_max=-27.2
 */

export const AMAJUBA_BBOX = {
  xmin: 27.8,
  ymin: -28.9,
  xmax: 30.2,
  ymax: -27.2,
} as const;

export type ArcGISServiceType = 'FeatureServer' | 'MapServer';

export interface ArcGISServiceMeta {
  name: string;
  type: ArcGISServiceType;
  layers: ArcGISLayerRef[];
  spatialReference?: { wkid?: number; latestWkid?: number };
}

export interface ArcGISLayerRef {
  id: number;
  name: string;
  type?: string;
  geometryType?: string;
}

export interface ArcGISLayerMeta extends ArcGISLayerRef {
  fields: ArcGISField[];
  extent?: { xmin: number; ymin: number; xmax: number; ymax: number; spatialReference?: { wkid?: number } };
  description?: string;
  copyrightText?: string;
  editingInfo?: { lastEditDate?: number };
}

export interface ArcGISField {
  name: string;
  type: string;
  alias?: string;
  length?: number;
}

export interface ArcGISQueryResult {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  exceededTransferLimit?: boolean;
  totalCount?: number;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry | null;
  properties: Record<string, unknown>;
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: unknown;
}

export interface ConnectorError {
  code: 'UNREACHABLE' | 'AUTH_REQUIRED' | 'NOT_FOUND' | 'UNSUPPORTED_CRS' | 'QUERY_FAILED' | 'PARSE_ERROR';
  message: string;
  url?: string;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: ConnectorError };

const TIMEOUT_MS = 15_000;

async function fetchJson(url: string): Promise<Result<unknown>> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 3600 } });
    clearTimeout(timer);
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: { code: 'AUTH_REQUIRED', message: `HTTP ${res.status}`, url } };
    }
    if (res.status === 404) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found', url } };
    }
    if (!res.ok) {
      return { ok: false, error: { code: 'QUERY_FAILED', message: `HTTP ${res.status}`, url } };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { code: 'UNREACHABLE', message: msg, url } };
  }
}

/**
 * Inspect a service root — returns layer list and spatial reference.
 */
export async function inspectService(baseUrl: string): Promise<Result<ArcGISServiceMeta>> {
  const url = `${baseUrl.replace(/\/$/, '')}?f=json`;
  const result = await fetchJson(url);
  if (!result.ok) return result;

  try {
    const d = result.data as Record<string, unknown>;
    const layers = ((d.layers as unknown[]) ?? []).map((l) => {
      const layer = l as Record<string, unknown>;
      return {
        id: layer.id as number,
        name: layer.name as string,
        type: layer.type as string | undefined,
        geometryType: layer.geometryType as string | undefined,
      };
    });
    const serviceType: ArcGISServiceType = (baseUrl.includes('FeatureServer') ? 'FeatureServer' : 'MapServer');
    return {
      ok: true,
      data: {
        name: (d.serviceDescription as string) ?? (d.name as string) ?? '',
        type: serviceType,
        layers,
        spatialReference: d.spatialReference as ArcGISServiceMeta['spatialReference'],
      },
    };
  } catch {
    return { ok: false, error: { code: 'PARSE_ERROR', message: 'Could not parse service metadata', url } };
  }
}

/**
 * Inspect a single layer — returns fields, extent, description.
 */
export async function inspectLayer(baseUrl: string, layerId: number): Promise<Result<ArcGISLayerMeta>> {
  const url = `${baseUrl.replace(/\/$/, '')}/${layerId}?f=json`;
  const result = await fetchJson(url);
  if (!result.ok) return result;

  try {
    const d = result.data as Record<string, unknown>;
    const fields = ((d.fields as unknown[]) ?? []).map((f) => {
      const field = f as Record<string, unknown>;
      return {
        name: field.name as string,
        type: field.type as string,
        alias: field.alias as string | undefined,
        length: field.length as number | undefined,
      };
    });
    return {
      ok: true,
      data: {
        id: d.id as number,
        name: d.name as string,
        type: d.type as string | undefined,
        geometryType: d.geometryType as string | undefined,
        fields,
        extent: d.extent as ArcGISLayerMeta['extent'],
        description: d.description as string | undefined,
        copyrightText: d.copyrightText as string | undefined,
        editingInfo: d.editingInfo as ArcGISLayerMeta['editingInfo'],
      },
    };
  } catch {
    return { ok: false, error: { code: 'PARSE_ERROR', message: 'Could not parse layer metadata', url } };
  }
}

/**
 * Query features from a layer as GeoJSON.
 * Clips to Amajuba bounding box by default.
 * Handles pagination automatically up to maxFeatures.
 */
export async function queryFeatures(
  baseUrl: string,
  layerId: number,
  options: {
    where?: string;
    bbox?: typeof AMAJUBA_BBOX;
    outFields?: string;
    maxFeatures?: number;
  } = {},
): Promise<Result<ArcGISQueryResult>> {
  const {
    where = '1=1',
    bbox = AMAJUBA_BBOX,
    outFields = '*',
    maxFeatures = 2000,
  } = options;

  const geometry = `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`;
  const pageSize = Math.min(1000, maxFeatures);

  const allFeatures: GeoJSONFeature[] = [];
  let offset = 0;
  let exceeded = false;

  while (allFeatures.length < maxFeatures) {
    const params = new URLSearchParams({
      where,
      geometry,
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      outSR: '4326',
      outFields,
      f: 'geojson',
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
    });

    const url = `${baseUrl.replace(/\/$/, '')}/${layerId}/query?${params}`;
    const result = await fetchJson(url);
    if (!result.ok) return result;

    try {
      const d = result.data as Record<string, unknown>;

      // ArcGIS error response
      if (d.error) {
        const err = d.error as Record<string, unknown>;
        return {
          ok: false,
          error: {
            code: 'QUERY_FAILED',
            message: `ArcGIS error ${err.code}: ${err.message}`,
            url,
          },
        };
      }

      const features = (d.features as GeoJSONFeature[]) ?? [];
      allFeatures.push(...features);
      exceeded = (d.exceededTransferLimit as boolean) ?? false;

      if (!exceeded || features.length === 0) break;
      offset += features.length;
    } catch {
      return { ok: false, error: { code: 'PARSE_ERROR', message: 'Could not parse feature response', url } };
    }
  }

  return {
    ok: true,
    data: {
      type: 'FeatureCollection',
      features: allFeatures,
      exceededTransferLimit: exceeded,
      totalCount: allFeatures.length,
    },
  };
}

/**
 * Check if a service is reachable and responding.
 * Used by source health monitoring.
 */
export async function checkSourceHealth(baseUrl: string): Promise<{
  reachable: boolean;
  responseMs: number;
  error?: string;
}> {
  const start = Date.now();
  const url = `${baseUrl.replace(/\/$/, '')}?f=json`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    return { reachable: res.ok, responseMs: Date.now() - start };
  } catch (e) {
    return {
      reachable: false,
      responseMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
