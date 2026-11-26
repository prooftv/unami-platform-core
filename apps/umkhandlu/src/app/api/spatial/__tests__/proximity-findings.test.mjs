import assert from 'node:assert/strict';
import test from 'node:test';

// Import the pure calculation function directly — no mocks needed
const { computeProximityFindings } = await import(
  '@/lib/gis/proximity-findings'
);

// Newcastle CBD coordinates — used as notice site origin
const NEWCASTLE = { lat: -27.7567, lng: 29.9318 };
const RADIUS = 500; // metres

function makeLayer(id, role, features, availability = 'available') {
  return {
    id,
    label: `${role} Dataset`,
    role,
    availability,
    permissionNote: availability !== 'available' ? 'Permission pending' : null,
    attribution: 'HOT OSM',
    statutoryRelevance: 'Statutory screening',
    geojson: features
      ? { type: 'FeatureCollection', features }
      : null,
  };
}

function pointFeature(id, lng, lat, name) {
  return {
    id,
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: { name },
  };
}

function lineFeature(id, coords) {
  return {
    id,
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
    properties: { name: `Line ${id}` },
  };
}

function polygonFeature(id, rings) {
  return {
    id,
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: rings },
    properties: { name: `Polygon ${id}` },
  };
}

// ─── Feature results ──────────────────────────────────────────────────────────

test('returns features within radius sorted by distance ascending', () => {
  const layers = [
    makeLayer('schools', 'Schools / learning institutions', [
      pointFeature('school-near', 29.9330, -27.7570, 'Near School'),   // ~100m
      pointFeature('school-far', 29.9450, -27.7600, 'Far School'),     // ~1300m — outside
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].featureId, 'school-near');
  assert.equal(findings[0].featureName, 'Near School');
  assert.equal(findings[0].layerRole, 'Schools / learning institutions');
  assert.ok(findings[0].distanceMetres < RADIUS);
});

test('sorts multiple findings by distance ascending', () => {
  const layers = [
    makeLayer('health', 'Health facilities', [
      pointFeature('h1', 29.9360, -27.7570, 'Clinic A'),   // ~380m
      pointFeature('h2', 29.9325, -27.7568, 'Clinic B'),   // ~60m
      pointFeature('h3', 29.9340, -27.7572, 'Clinic C'),   // ~200m
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 3);
  assert.ok(findings[0].distanceMetres <= findings[1].distanceMetres);
  assert.ok(findings[1].distanceMetres <= findings[2].distanceMetres);
});

test('returns empty array when no features within radius', () => {
  const layers = [
    makeLayer('schools', 'Schools', [
      pointFeature('s1', 29.9600, -27.7800, 'Distant School'), // >2km away
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 0);
});

// ─── Distance values ──────────────────────────────────────────────────────────

test('distance values are non-negative integers', () => {
  const layers = [
    makeLayer('roads', 'Road network', [
      pointFeature('r1', 29.9320, -27.7568, 'Road A'),
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 1);
  assert.ok(Number.isInteger(findings[0].distanceMetres));
  assert.ok(findings[0].distanceMetres >= 0);
});

test('feature at origin has distance near zero', () => {
  const layers = [
    makeLayer('poi', 'Points of interest', [
      pointFeature('p1', NEWCASTLE.lng, NEWCASTLE.lat, 'At Origin'),
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 1);
  assert.ok(findings[0].distanceMetres < 10); // within 10m rounding
});

// ─── Geometry types ───────────────────────────────────────────────────────────

test('includes LineString features that cross the radius', () => {
  // A road that passes through the 500m zone
  const layers = [
    makeLayer('roads', 'Road network', [
      lineFeature('road-1', [
        [29.9310, -27.7570],
        [29.9330, -27.7570],
      ]),
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 1);
});

test('includes Polygon features that overlap the radius', () => {
  // A polygon centred near the origin
  const layers = [
    makeLayer('areas', 'Traditional authority areas', [
      polygonFeature('poly-1', [[
        [29.9310, -27.7560],
        [29.9330, -27.7560],
        [29.9330, -27.7575],
        [29.9310, -27.7575],
        [29.9310, -27.7560],
      ]]),
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 1);
});

// ─── Missing geometry ─────────────────────────────────────────────────────────

test('skips features with null geometry', () => {
  const layers = [
    makeLayer('schools', 'Schools', [
      { id: 'no-geom', type: 'Feature', geometry: null, properties: { name: 'No Geometry' } },
      pointFeature('with-geom', 29.9325, -27.7568, 'Has Geometry'),
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].featureId, 'with-geom');
});

test('skips layers with null geojson', () => {
  const layers = [
    makeLayer('empty', 'Empty layer', null),
    makeLayer('schools', 'Schools', [
      pointFeature('s1', 29.9325, -27.7568, 'School'),
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 1);
});

// ─── Missing datasets / permission filtering ──────────────────────────────────

test('skips layers with availability != available', () => {
  const layers = [
    makeLayer('ilis', 'Traditional authority areas', [
      pointFeature('t1', 29.9325, -27.7568, 'Traditional Area'),
    ], 'pending-permission'),
    makeLayer('cadastre', 'Cadastral / property', [
      pointFeature('c1', 29.9325, -27.7568, 'Property'),
    ], 'not-available'),
    makeLayer('schools', 'Schools', [
      pointFeature('s1', 29.9325, -27.7568, 'School'),
    ], 'available'),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  // Only the available layer contributes findings
  assert.equal(findings.length, 1);
  assert.equal(findings[0].layerRole, 'Schools');
});

test('unavailable layers do not appear in findings', () => {
  const layers = [
    makeLayer('restricted', 'Licensed premises', [
      pointFeature('lp1', 29.9325, -27.7568, 'Pub'),
    ], 'not-available'),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 0);
});

// ─── Feature name resolution ──────────────────────────────────────────────────

test('falls back to layer role when feature has no name property', () => {
  const layers = [
    makeLayer('poi', 'Points of interest', [
      {
        id: 'unnamed',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [29.9325, -27.7568] },
        properties: { ref: 'OSM123' }, // no name field
      },
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].featureName, 'Points of interest');
});

test('falls back to layer role when properties is null', () => {
  const layers = [
    makeLayer('poi', 'Points of interest', [
      {
        id: 'null-props',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [29.9325, -27.7568] },
        properties: null,
      },
    ]),
  ];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].featureName, 'Points of interest');
});

// ─── Error handling ───────────────────────────────────────────────────────────

test('handles empty layers array without throwing', () => {
  const findings = computeProximityFindings([], NEWCASTLE, RADIUS);
  assert.equal(findings.length, 0);
});

test('handles layers with empty features array', () => {
  const layers = [makeLayer('empty', 'Empty', [])];
  const findings = computeProximityFindings(layers, NEWCASTLE, RADIUS);
  assert.equal(findings.length, 0);
});

test('handles invalid origin coordinates gracefully', () => {
  const layers = [
    makeLayer('schools', 'Schools', [
      pointFeature('s1', 29.9325, -27.7568, 'School'),
    ]),
  ];
  // Invalid origin — isGeometryWithinRadius returns false for invalid origin
  const findings = computeProximityFindings(layers, { lat: 999, lng: 999 }, RADIUS);
  assert.equal(findings.length, 0);
});

// ─── Attribution ──────────────────────────────────────────────────────────────

test('preserves layer attribution on findings', () => {
  const layer = makeLayer('schools', 'Schools', [
    pointFeature('s1', 29.9325, -27.7568, 'School'),
  ]);
  layer.attribution = 'HOT OSM / OpenStreetMap contributors';
  const findings = computeProximityFindings([layer], NEWCASTLE, RADIUS);
  assert.equal(findings[0].attribution, 'HOT OSM / OpenStreetMap contributors');
});
