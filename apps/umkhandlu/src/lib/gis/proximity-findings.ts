import {
  isGeometryWithinRadius,
  type Wgs84Point,
} from '@/lib/gis/spatial-proximity';

export interface ProximityLayer {
  id: string;
  label: string;
  role: string;
  availability: 'available' | 'pending-permission' | 'not-available';
  permissionNote: string | null;
  attribution: string | null;
  statutoryRelevance: string;
  geojson: { type: 'FeatureCollection'; features: GeoJSONFeature[] } | null;
}

interface GeoJSONFeature {
  id?: string | number;
  type: 'Feature';
  geometry: unknown;
  properties: Record<string, unknown> | null;
}

export interface ProximityFinding {
  featureId: string | number;
  layerId: string;
  layerLabel: string;
  layerRole: string;
  featureName: string;
  distanceMetres: number;
  attribution: string | null;
}

export function computeProximityFindings(
  layers: ProximityLayer[],
  origin: Wgs84Point,
  radiusMetres: number,
): ProximityFinding[] {
  const findings: ProximityFinding[] = [];

  for (const layer of layers) {
    if (layer.availability !== 'available' || !layer.geojson) continue;
    for (const feature of layer.geojson.features) {
      if (!feature.geometry) continue;
      if (!isGeometryWithinRadius(feature.geometry, origin, radiusMetres)) continue;

      const name = resolveFeatureName(feature.properties, layer.role);
      const dist = approximateDistanceMetres(feature.geometry, origin);

      findings.push({
        featureId: feature.id ?? `${layer.id}-${findings.length}`,
        layerId: layer.id,
        layerLabel: layer.label,
        layerRole: layer.role,
        featureName: name,
        distanceMetres: dist,
        attribution: layer.attribution,
      });
    }
  }

  return findings.sort((a, b) => a.distanceMetres - b.distanceMetres);
}

function resolveFeatureName(
  props: Record<string, unknown> | null,
  layerRole: string,
): string {
  if (!props) return layerRole;
  const candidates = ['name', 'Name', 'NAME', 'title', 'label', 'description'];
  for (const key of candidates) {
    if (typeof props[key] === 'string' && props[key]) return props[key] as string;
  }
  return layerRole;
}

// Approximate nearest-point distance using equirectangular projection.
// For points: exact. For lines/polygons: representative point approximation.
// Sufficient for display — isGeometryWithinRadius already confirmed inclusion.
export function approximateDistanceMetres(geometry: unknown, origin: Wgs84Point): number {
  const EARTH = 6_371_008.8;
  const g = geometry as { type: string; coordinates?: unknown };
  const pt = extractRepresentativePoint(g);
  if (!pt) return 0;
  const latRad = (origin.lat * Math.PI) / 180;
  const dx = (EARTH * (pt[0] - origin.lng) * Math.PI * Math.cos(latRad)) / 180;
  const dy = (EARTH * (pt[1] - origin.lat) * Math.PI) / 180;
  return Math.round(Math.hypot(dx, dy));
}

function extractRepresentativePoint(g: { type: string; coordinates?: unknown }): [number, number] | null {
  if (!Array.isArray(g.coordinates)) return null;
  switch (g.type) {
    case 'Point':
      return g.coordinates.length >= 2
        ? [g.coordinates[0] as number, g.coordinates[1] as number]
        : null;
    case 'MultiPoint':
    case 'LineString':
      return Array.isArray(g.coordinates[0]) && g.coordinates[0].length >= 2
        ? [g.coordinates[0][0] as number, g.coordinates[0][1] as number]
        : null;
    case 'Polygon':
    case 'MultiLineString': {
      const ring = g.coordinates[0];
      if (!Array.isArray(ring) || !Array.isArray(ring[0])) return null;
      return [ring[0][0] as number, ring[0][1] as number];
    }
    default:
      return null;
  }
}
