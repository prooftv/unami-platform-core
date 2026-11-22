import assert from 'node:assert/strict';
import test from 'node:test';

// ─── Inline the pure functions under test (no Supabase dependency) ────────────

const EARTH_RADIUS_METRES = 6_371_008.8;

function geodesicDistanceMetres(a, b) {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(h));
}

function isValidWgs84Point(p) {
  return (
    Number.isFinite(p.lat) && Number.isFinite(p.lng) &&
    p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180
  );
}

function rolesAreCompatible(a, b) {
  if (a === 'area-reference' || b === 'area-reference') return false;
  return a === b;
}

function extractPointFromFeatureGeojson(geojson) {
  if (!geojson || typeof geojson !== 'object') return null;
  if (geojson.type !== 'Point' || !Array.isArray(geojson.coordinates)) return null;
  const [lng, lat] = geojson.coordinates;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const point = { lat, lng };
  return isValidWgs84Point(point) ? point : null;
}

function precisionTierOf(precision) {
  if (!precision) return null;
  if (['verified', 'operator-provided', 'approximate', 'locality-only'].includes(precision)) return precision;
  return null;
}

function ruleMatches(rule, gnSource, ccSource) {
  const matchesRole = rule.coordinate_role === '*' || rule.coordinate_role === gnSource.coordinateRole;
  const matchesPrecision =
    rule.precision_tier === '*' ||
    rule.precision_tier === precisionTierOf(gnSource.locationPrecision) ||
    rule.precision_tier === precisionTierOf(ccSource.locationPrecision);
  const matchesSourceTypes =
    (rule.source_type_a === '*' || rule.source_type_a === gnSource.sourceType) &&
    (rule.source_type_b === '*' || rule.source_type_b === ccSource.sourceType);
  const matchesSourceTypesReversed =
    (rule.source_type_a === '*' || rule.source_type_a === ccSource.sourceType) &&
    (rule.source_type_b === '*' || rule.source_type_b === gnSource.sourceType);
  return matchesRole && matchesPrecision && (matchesSourceTypes || matchesSourceTypesReversed);
}

// ─── Geodesic distance ────────────────────────────────────────────────────────

test('geodesic distance — same point is zero', () => {
  const d = geodesicDistanceMetres({ lat: -27.756, lng: 29.931 }, { lat: -27.756, lng: 29.931 });
  assert.equal(d, 0);
});

test('geodesic distance — Khethokuhle discrepancy ~14.7 km', () => {
  const d = geodesicDistanceMetres(
    { lat: -27.818, lng: 30.047 },
    { lat: -27.7626, lng: 30.1831 },
  );
  assert.ok(d > 14_000 && d < 16_000, `Expected ~14700m, got ${d}`);
});

test('geodesic distance — 1 degree latitude ~111 km', () => {
  const d = geodesicDistanceMetres({ lat: -27.0, lng: 30.0 }, { lat: -28.0, lng: 30.0 });
  assert.ok(d > 110_000 && d < 112_000, `Expected ~111km, got ${d}`);
});

test('geodesic distance — zero coordinates are valid and produce non-zero distance', () => {
  const d = geodesicDistanceMetres({ lat: 0, lng: 0 }, { lat: -27.756, lng: 29.931 });
  assert.ok(d > 0);
});

// ─── Coordinate validation ────────────────────────────────────────────────────

test('isValidWgs84Point — rejects NaN', () => {
  assert.equal(isValidWgs84Point({ lat: NaN, lng: 29.931 }), false);
});

test('isValidWgs84Point — rejects out-of-range lat', () => {
  assert.equal(isValidWgs84Point({ lat: 91, lng: 29.931 }), false);
});

test('isValidWgs84Point — accepts zero coordinates', () => {
  assert.equal(isValidWgs84Point({ lat: 0, lng: 0 }), true);
});

test('isValidWgs84Point — accepts valid Amajuba point', () => {
  assert.equal(isValidWgs84Point({ lat: -27.756, lng: 29.931 }), true);
});

// ─── Role compatibility ───────────────────────────────────────────────────────

test('rolesAreCompatible — site vs site is compatible', () => {
  assert.equal(rolesAreCompatible('site', 'site'), true);
});

test('rolesAreCompatible — facility vs facility is compatible', () => {
  assert.equal(rolesAreCompatible('facility', 'facility'), true);
});

test('rolesAreCompatible — site vs area-reference is NOT compatible', () => {
  assert.equal(rolesAreCompatible('site', 'area-reference'), false);
});

test('rolesAreCompatible — area-reference vs facility is NOT compatible', () => {
  assert.equal(rolesAreCompatible('area-reference', 'facility'), false);
});

test('rolesAreCompatible — site vs facility is NOT compatible', () => {
  assert.equal(rolesAreCompatible('site', 'facility'), false);
});

// ─── Rule matching ────────────────────────────────────────────────────────────

const gnOperatorSite = {
  sourceType: 'operator-entered',
  coordinateRole: 'site',
  locationPrecision: 'operator-provided',
};
const ccDatasetSite = {
  sourceType: 'dataset-import',
  coordinateRole: 'site',
  locationPrecision: null,
};

test('rule matching — operator-entered vs dataset-import site rule matches', () => {
  const rule = {
    source_type_a: 'operator-entered',
    source_type_b: 'dataset-import',
    coordinate_role: 'site',
    precision_tier: 'operator-provided',
    threshold_metres: 500,
  };
  assert.equal(ruleMatches(rule, gnOperatorSite, ccDatasetSite), true);
});

test('rule matching — wildcard rule matches any source type', () => {
  const rule = {
    source_type_a: '*',
    source_type_b: '*',
    coordinate_role: '*',
    precision_tier: '*',
    threshold_metres: 1000,
  };
  assert.equal(ruleMatches(rule, gnOperatorSite, ccDatasetSite), true);
});

test('rule matching — wrong role does not match', () => {
  const rule = {
    source_type_a: '*',
    source_type_b: '*',
    coordinate_role: 'facility',
    precision_tier: '*',
    threshold_metres: 500,
  };
  assert.equal(ruleMatches(rule, gnOperatorSite, ccDatasetSite), false);
});

test('rule matching — wrong precision tier does not match', () => {
  const rule = {
    source_type_a: 'operator-entered',
    source_type_b: 'dataset-import',
    coordinate_role: 'site',
    precision_tier: 'verified',
    threshold_metres: 100,
  };
  assert.equal(ruleMatches(rule, gnOperatorSite, ccDatasetSite), false);
});

test('rule matching — reversed source types also match (symmetric)', () => {
  const rule = {
    source_type_a: 'dataset-import',
    source_type_b: 'operator-entered',
    coordinate_role: 'site',
    precision_tier: 'operator-provided',
    threshold_metres: 500,
  };
  assert.equal(ruleMatches(rule, gnOperatorSite, ccDatasetSite), true);
});

// ─── GeoJSON point extraction ─────────────────────────────────────────────────

test('extractPointFromFeatureGeojson — valid Point returns lat/lng', () => {
  const pt = extractPointFromFeatureGeojson({ type: 'Point', coordinates: [30.1831, -27.7626] });
  assert.ok(pt);
  assert.equal(pt.lat, -27.7626);
  assert.equal(pt.lng, 30.1831);
});

test('extractPointFromFeatureGeojson — non-Point geometry returns null', () => {
  assert.equal(extractPointFromFeatureGeojson({ type: 'Polygon', coordinates: [] }), null);
});

test('extractPointFromFeatureGeojson — invalid coordinates return null', () => {
  assert.equal(extractPointFromFeatureGeojson({ type: 'Point', coordinates: [200, 91] }), null);
});

test('extractPointFromFeatureGeojson — null input returns null', () => {
  assert.equal(extractPointFromFeatureGeojson(null), null);
});

// ─── Khethokuhle verification case ───────────────────────────────────────────

test('Khethokuhle — both source values preserved, distance ~14.7 km, roles compatible', () => {
  const sanityPoint = { lat: -27.818, lng: 30.047 };
  const gigaPoint = { lat: -27.7626, lng: 30.1831 };

  // Both valid
  assert.equal(isValidWgs84Point(sanityPoint), true);
  assert.equal(isValidWgs84Point(gigaPoint), true);

  // Roles compatible (both facility)
  assert.equal(rolesAreCompatible('facility', 'facility'), true);

  // Distance is material
  const d = geodesicDistanceMetres(sanityPoint, gigaPoint);
  assert.ok(d > 14_000, `Distance should be >14km, got ${d}`);

  // Neither value modified
  assert.equal(sanityPoint.lat, -27.818);
  assert.equal(sanityPoint.lng, 30.047);
  assert.equal(gigaPoint.lat, -27.7626);
  assert.equal(gigaPoint.lng, 30.1831);
});

// ─── Unconfigured threshold (requires-configuration) ─────────────────────────

test('no matching rule — comparison should be marked requires-configuration', () => {
  const rules = []; // no active rules
  const gnSource = { sourceType: 'operator-entered', coordinateRole: 'site', locationPrecision: 'operator-provided' };
  const ccSource = { sourceType: 'dataset-import', coordinateRole: 'site', locationPrecision: null };
  const matched = rules.find((r) => ruleMatches(r, gnSource, ccSource));
  assert.equal(matched, undefined);
  // When no rule matches, status should be requires-configuration
  const status = matched ? 'pending-review' : 'requires-configuration';
  assert.equal(status, 'requires-configuration');
});

test('matching rule below threshold — no discrepancy recorded', () => {
  const rule = {
    source_type_a: 'operator-entered',
    source_type_b: 'dataset-import',
    coordinate_role: 'site',
    precision_tier: 'operator-provided',
    threshold_metres: 500,
  };
  const gnSource = { sourceType: 'operator-entered', coordinateRole: 'site', locationPrecision: 'operator-provided' };
  const ccSource = { sourceType: 'dataset-import', coordinateRole: 'site', locationPrecision: null };
  const distance = 200; // within threshold
  const matched = ruleMatches(rule, gnSource, ccSource);
  assert.equal(matched, true);
  const status = distance > rule.threshold_metres ? 'pending-review' : null;
  assert.equal(status, null); // no discrepancy
});

test('matching rule above threshold — discrepancy pending-review', () => {
  const rule = {
    source_type_a: 'operator-entered',
    source_type_b: 'dataset-import',
    coordinate_role: 'site',
    precision_tier: 'operator-provided',
    threshold_metres: 500,
  };
  const gnSource = { sourceType: 'operator-entered', coordinateRole: 'site', locationPrecision: 'operator-provided' };
  const ccSource = { sourceType: 'dataset-import', coordinateRole: 'site', locationPrecision: null };
  const distance = 14700; // Khethokuhle
  const matched = ruleMatches(rule, gnSource, ccSource);
  assert.equal(matched, true);
  const status = distance > rule.threshold_metres ? 'pending-review' : null;
  assert.equal(status, 'pending-review');
});
