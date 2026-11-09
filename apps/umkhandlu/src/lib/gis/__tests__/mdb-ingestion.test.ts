/**
 * MDB Wards 2026 — Amajuba DC25 ingestion validation tests
 *
 * Run with: node --experimental-strip-types src/lib/gis/__tests__/mdb-ingestion.test.ts
 *
 * Validates the ingested GeoJSON against all acceptance criteria from the
 * implementation directive. Does not require a live database connection —
 * operates on the saved GeoJSON file from /tmp/mdb_dc25_wards_2026.geojson.
 *
 * If the file is not present, tests are skipped with a clear message.
 */

import { readFileSync, existsSync } from 'fs';

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
let skipped = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e instanceof Error ? e.message : String(e)}`);
    failed++;
  }
}

function skip(name: string, reason: string) {
  console.log(`  ⊘ ${name} — ${reason}`);
  skipped++;
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// ---------------------------------------------------------------------------
// Load dataset
// ---------------------------------------------------------------------------

const GEOJSON_PATH = '/tmp/mdb_dc25_wards_2026.geojson';

if (!existsSync(GEOJSON_PATH)) {
  console.log('\nMDB GeoJSON file not found at /tmp/mdb_dc25_wards_2026.geojson');
  console.log('Run the ingestion script first to generate the file.\n');
  process.exit(0);
}

type Feature = {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown> | null;
};

type FeatureCollection = {
  type: 'FeatureCollection';
  features: Feature[];
};

const fc = JSON.parse(readFileSync(GEOJSON_PATH, 'utf-8')) as FeatureCollection;
const features = fc.features;

// ---------------------------------------------------------------------------
// Dataset integrity
// ---------------------------------------------------------------------------

console.log('\nDataset integrity');

test('response is a GeoJSON FeatureCollection', () => {
  assert(fc.type === 'FeatureCollection', `Expected FeatureCollection, got ${fc.type}`);
});

test('dataset contains exactly 55 Amajuba wards', () => {
  assert(features.length === 55, `Expected 55 features, got ${features.length}`);
});

test('all features have polygon geometry', () => {
  const nonPolygon = features.filter(
    (f) => f.geometry?.type !== 'Polygon' && f.geometry?.type !== 'MultiPolygon'
  );
  assert(nonPolygon.length === 0, `${nonPolygon.length} features have non-polygon geometry`);
});

test('no features have null or missing geometry', () => {
  const nullGeom = features.filter((f) => !f.geometry || !f.geometry.type);
  assert(nullGeom.length === 0, `${nullGeom.length} features have null/missing geometry`);
});

test('all features have WardID', () => {
  const missing = features.filter((f) => !f.properties?.WardID);
  assert(missing.length === 0, `${missing.length} features missing WardID`);
});

test('no duplicate WardIDs', () => {
  const ids = features.map((f) => f.properties?.WardID as string);
  const unique = new Set(ids);
  assert(unique.size === ids.length, `${ids.length - unique.size} duplicate WardIDs found`);
});

test('all features have MUNICNAME', () => {
  const missing = features.filter((f) => !f.properties?.MUNICNAME);
  assert(missing.length === 0, `${missing.length} features missing MUNICNAME`);
});

test('all features have WardNo', () => {
  const missing = features.filter((f) => f.properties?.WardNo == null);
  assert(missing.length === 0, `${missing.length} features missing WardNo`);
});

// ---------------------------------------------------------------------------
// Administrative integrity
// ---------------------------------------------------------------------------

console.log('\nAdministrative integrity');

test('Newcastle has exactly 36 wards', () => {
  const count = features.filter((f) => f.properties?.MUNICNAME === 'Newcastle').length;
  assert(count === 36, `Expected 36 Newcastle wards, got ${count}`);
});

test('Emadlangeni has exactly 6 wards', () => {
  const count = features.filter((f) => f.properties?.MUNICNAME === 'Emadlangeni').length;
  assert(count === 6, `Expected 6 Emadlangeni wards, got ${count}`);
});

test('Dannhauser has exactly 13 wards', () => {
  const count = features.filter((f) => f.properties?.MUNICNAME === 'Dannhauser').length;
  assert(count === 13, `Expected 13 Dannhauser wards, got ${count}`);
});

test('Newcastle wards have CAT_B=KZN252', () => {
  const wrong = features.filter(
    (f) => f.properties?.MUNICNAME === 'Newcastle' && f.properties?.CAT_B !== 'KZN252'
  );
  assert(wrong.length === 0, `${wrong.length} Newcastle wards have wrong CAT_B`);
});

test('Emadlangeni wards have CAT_B=KZN253', () => {
  const wrong = features.filter(
    (f) => f.properties?.MUNICNAME === 'Emadlangeni' && f.properties?.CAT_B !== 'KZN253'
  );
  assert(wrong.length === 0, `${wrong.length} Emadlangeni wards have wrong CAT_B`);
});

test('Dannhauser wards have CAT_B=KZN254', () => {
  const wrong = features.filter(
    (f) => f.properties?.MUNICNAME === 'Dannhauser' && f.properties?.CAT_B !== 'KZN254'
  );
  assert(wrong.length === 0, `${wrong.length} Dannhauser wards have wrong CAT_B`);
});

test('all wards have DISTRICTCO=DC25', () => {
  const wrong = features.filter((f) => f.properties?.DISTRICTCO !== 'DC25');
  assert(wrong.length === 0, `${wrong.length} wards have wrong DISTRICTCO`);
});

test('all wards are in KwaZulu-Natal province', () => {
  const wrong = features.filter((f) => f.properties?.Province !== 'KwaZulu-Natal');
  assert(wrong.length === 0, `${wrong.length} wards have wrong Province`);
});

test('WardID format matches expected pattern (5-digit prefix + 3-digit ward)', () => {
  // Expected: 52502001 format (province+muni+ward)
  const invalid = features.filter((f) => {
    const id = f.properties?.WardID as string;
    return !id || !/^\d{8}$/.test(id);
  });
  assert(invalid.length === 0, `${invalid.length} wards have invalid WardID format`);
});

// ---------------------------------------------------------------------------
// Spatial accuracy
// ---------------------------------------------------------------------------

console.log('\nSpatial accuracy');

// Amajuba bounding box: lng 28.5–30.5, lat -29.0 to -27.0
const AMAJUBA_BOUNDS = { minLng: 27.5, maxLng: 31.0, minLat: -30.0, maxLat: -26.5 };

function getCoords(geom: { type: string; coordinates: unknown }): number[][] {
  if (geom.type === 'Polygon') {
    return (geom.coordinates as number[][][])[0];
  }
  if (geom.type === 'MultiPolygon') {
    return (geom.coordinates as number[][][][])[0][0];
  }
  return [];
}

test('all ward geometries fall within Amajuba spatial extent', () => {
  const outside: string[] = [];
  for (const feat of features) {
    if (!feat.geometry) continue;
    const coords = getCoords(feat.geometry as { type: string; coordinates: unknown });
    for (const [lng, lat] of coords) {
      if (lng < AMAJUBA_BOUNDS.minLng || lng > AMAJUBA_BOUNDS.maxLng ||
          lat < AMAJUBA_BOUNDS.minLat || lat > AMAJUBA_BOUNDS.maxLat) {
        outside.push(feat.properties?.WardID as string);
        break;
      }
    }
  }
  assert(outside.length === 0, `${outside.length} wards have coordinates outside Amajuba extent: ${outside.join(', ')}`);
});

test('coordinates are in WGS84 range (lng -180 to 180, lat -90 to 90)', () => {
  const invalid: string[] = [];
  for (const feat of features) {
    if (!feat.geometry) continue;
    const coords = getCoords(feat.geometry as { type: string; coordinates: unknown });
    for (const [lng, lat] of coords) {
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        invalid.push(feat.properties?.WardID as string);
        break;
      }
    }
  }
  assert(invalid.length === 0, `${invalid.length} wards have out-of-range coordinates (not WGS84)`);
});

test('no ward has zero-area geometry (degenerate polygon)', () => {
  const degenerate: string[] = [];
  for (const feat of features) {
    if (!feat.geometry) continue;
    const coords = getCoords(feat.geometry as { type: string; coordinates: unknown });
    if (coords.length < 4) {
      degenerate.push(feat.properties?.WardID as string);
    }
  }
  assert(degenerate.length === 0, `${degenerate.length} wards have degenerate geometry`);
});

// ---------------------------------------------------------------------------
// Source and permission
// ---------------------------------------------------------------------------

console.log('\nSource and permission');

test('dataset has DATE field (2026 delimitation epoch)', () => {
  const withDate = features.filter((f) => f.properties?.DATE != null);
  assert(withDate.length === 55, `Only ${withDate.length}/55 features have DATE field`);
});

test('DATE epoch corresponds to 2026 delimitation', () => {
  // DATE=1793750400000 ms → 2026-11-04 (confirmed in investigation)
  const dates = features.map((f) => f.properties?.DATE as number);
  const years = dates.map((d) => new Date(d).getFullYear());
  const allIn2026 = years.every((y) => y === 2026);
  assert(allIn2026, `Not all DATE values are in 2026: ${[...new Set(years)].join(', ')}`);
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

console.log(`\n${passed + failed + skipped} tests: ${passed} passed, ${failed} failed, ${skipped} skipped\n`);
if (failed > 0) process.exit(1);
