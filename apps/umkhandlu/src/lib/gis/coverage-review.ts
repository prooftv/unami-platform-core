type Position = [number, number];
type GeoJSONGeometry = {
  type?: unknown;
  coordinates?: unknown;
};

function isPosition(value: unknown): value is Position {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1]) &&
    value[1] >= -90 &&
    value[1] <= 90
  );
}

function ringLocation(point: Position, ring: unknown): 'inside' | 'outside' | 'boundary' {
  if (!Array.isArray(ring) || ring.length < 4 || !ring.every(isPosition)) {
    return 'outside';
  }

  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [x1, y1] = ring[current];
    const [x2, y2] = ring[previous];
    const cross = (point[1] - y1) * (x2 - x1) - (point[0] - x1) * (y2 - y1);
    if (
      Math.abs(cross) <= 1e-10 &&
      point[0] >= Math.min(x1, x2) - 1e-10 &&
      point[0] <= Math.max(x1, x2) + 1e-10 &&
      point[1] >= Math.min(y1, y2) - 1e-10 &&
      point[1] <= Math.max(y1, y2) + 1e-10
    ) {
      return 'boundary';
    }

    if ((y1 > point[1]) !== (y2 > point[1])) {
      const intersectionX = ((x2 - x1) * (point[1] - y1)) / (y2 - y1) + x1;
      if (point[0] < intersectionX) inside = !inside;
    }
  }
  return inside ? 'inside' : 'outside';
}

function polygonCoversPoint(point: Position, rings: unknown): boolean {
  if (!Array.isArray(rings) || rings.length === 0) return false;
  const outer = ringLocation(point, rings[0]);
  if (outer === 'outside') return false;

  for (const hole of rings.slice(1)) {
    const location = ringLocation(point, hole);
    if (location === 'inside') return false;
    if (location === 'boundary') return true;
  }
  return true;
}

export function pointCoveredByGeometry(point: Position, geometry: unknown): boolean {
  if (!isPosition(point) || !geometry || typeof geometry !== 'object') return false;
  const candidate = geometry as GeoJSONGeometry;
  if (candidate.type === 'Polygon') {
    return polygonCoversPoint(point, candidate.coordinates);
  }
  if (candidate.type === 'MultiPolygon' && Array.isArray(candidate.coordinates)) {
    return candidate.coordinates.some((polygon) => polygonCoversPoint(point, polygon));
  }
  return false;
}

export function isAmajubaDistrictFeature(properties: unknown): boolean {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return false;
  }
  const values = properties as Record<string, unknown>;
  const districtCode = ['DISTRICT', 'DISTRICT_CODE', 'DC_CODE', 'DC']
    .map((key) => values[key])
    .find((value) => typeof value === 'string' && value.trim().toUpperCase() === 'DC25');
  const districtName = ['DISTRICT_N', 'DISTRICT_NAME', 'NAME', 'Map_Label']
    .map((key) => values[key])
    .find((value) => typeof value === 'string' && /amajuba/i.test(value));
  return districtCode !== undefined && districtName !== undefined;
}

export function pointFromGeometry(geometry: unknown): Position | null {
  if (!geometry || typeof geometry !== 'object') return null;
  const candidate = geometry as GeoJSONGeometry;
  if (candidate.type !== 'Point' || !isPosition(candidate.coordinates)) return null;
  return candidate.coordinates;
}
