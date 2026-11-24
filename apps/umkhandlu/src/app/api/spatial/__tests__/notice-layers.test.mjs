import assert from 'node:assert/strict';
import test from 'node:test';

// Reuse the shared test state from routes.test.mjs
const state = globalThis.__spatialRouteTestState ?? {
  datasets: [],
  features: [],
  restrictedIds: new Set(),
  failTable: null,
};
globalThis.__spatialRouteTestState = state;

function resetState() {
  state.datasets = [];
  state.features = [];
  state.restrictedIds = new Set();
  state.failTable = null;
}

function dataset(id, name, overrides = {}) {
  return {
    id,
    name,
    status: 'published',
    active: true,
    feature_count: 1,
    attribution: `${name} attribution`,
    dataset_date: '2026-01-01',
    published_at: '2026-01-02T00:00:00Z',
    source_id: 'source-1',
    permission_classification: 'redistribute',
    spatial_sources: { name: 'Open Data', institution: 'Test Org', attribution: `${name} attribution` },
    ...overrides,
  };
}

function pointFeature(id, datasetId, props = {}) {
  return {
    id,
    dataset_id: datasetId,
    operator_status: 'approved',
    feature_geojson: { type: 'Point', coordinates: [29.93, -27.75] },
    feature_properties: props,
  };
}

const { GET: getNoticeLayers } = await import('../notice-layers/route.ts');

test('notice-layers returns admin layers for unknown notice type', async () => {
  resetState();
  const wardId = 'a1000000-0000-0000-0000-000000000001';
  state.datasets = [
    dataset(wardId, 'MDB Wards 2026 — Amajuba DC25'),
  ];
  state.features = [pointFeature('f1', wardId, { WardNo: 7, CAT_B: 'KZN252' })];

  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=other'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.layers));
  // Admin layers always present
  const ids = body.layers.map((l) => l.id);
  assert.ok(ids.includes('wards'));
  assert.ok(ids.includes('municipalities'));
  assert.ok(ids.includes('district'));
});

test('notice-layers returns liquor-specific layers including proximity layers', async () => {
  resetState();
  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=liquor'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  const ids = body.layers.map((l) => l.id);
  assert.ok(ids.includes('schools'));
  assert.ok(ids.includes('religious-institutions'));
  assert.ok(ids.includes('licensed-premises'));
  assert.ok(ids.includes('land-use'));
});

test('notice-layers returns eia-specific layers', async () => {
  resetState();
  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=eia'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  const ids = body.layers.map((l) => l.id);
  assert.ok(ids.includes('waterways'));
  assert.ok(ids.includes('populated-places'));
});

test('notice-layers returns rezoning-specific layers', async () => {
  resetState();
  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=rezoning'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  const ids = body.layers.map((l) => l.id);
  assert.ok(ids.includes('roads'));
  assert.ok(ids.includes('populated-places'));
});

test('notice-layers inlines features for available datasets', async () => {
  resetState();
  const dsId = 'b1000000-0000-0000-0000-000000000001';
  state.datasets = [dataset(dsId, 'HOT OSM Education Facilities — Amajuba DC25')];
  state.features = [
    pointFeature('feat-1', dsId, { name: 'Test School' }),
    pointFeature('feat-2', dsId, { name: 'Another School' }),
  ];

  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=liquor&features=true'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  const schoolsLayer = body.layers.find((l) => l.id === 'schools');
  assert.ok(schoolsLayer, 'schools layer present');
  assert.equal(schoolsLayer.availability, 'available');
  assert.ok(schoolsLayer.features?.features.length >= 1);
});

test('notice-layers marks layer pending-permission when dataset not cleared for redistribution', async () => {
  resetState();
  const dsId = 'c1000000-0000-0000-0000-000000000001';
  // Dataset exists but is restricted
  state.datasets = [dataset(dsId, 'HOT OSM Education Facilities — Amajuba DC25')];
  state.restrictedIds.add(dsId);

  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=liquor&features=true'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  const schoolsLayer = body.layers.find((l) => l.id === 'schools');
  assert.ok(schoolsLayer);
  assert.equal(schoolsLayer.availability, 'pending-permission');
  assert.equal(schoolsLayer.features, null);
});

test('notice-layers returns not-available for licensed-premises (no dataset exists)', async () => {
  resetState();
  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=liquor'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  const licensedLayer = body.layers.find((l) => l.id === 'licensed-premises');
  assert.ok(licensedLayer);
  assert.equal(licensedLayer.availability, 'not-available');
  assert.ok(licensedLayer.permissionNote?.includes('KZNERA'));
});

test('notice-layers filters ward features by wardNumber and catB when provided', async () => {
  resetState();
  const dsId = 'd1000000-0000-0000-0000-000000000001';
  state.datasets = [dataset(dsId, 'MDB Wards 2026 — Amajuba DC25')];
  state.features = [
    pointFeature('ward-7', dsId, { WardNo: 7, CAT_B: 'KZN252' }),
    pointFeature('ward-8', dsId, { WardNo: 8, CAT_B: 'KZN252' }),
  ];

  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=other&wardNumber=7&catB=KZN252&features=true'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  const wardsLayer = body.layers.find((l) => l.id === 'wards');
  assert.ok(wardsLayer);
  // Should only return ward 7
  assert.equal(wardsLayer.features?.features.length, 1);
  assert.equal(wardsLayer.features?.features[0].properties.WardNo, 7);
});

test('notice-layers returns empty features array when dataset has no approved features', async () => {
  resetState();
  const dsId = 'e1000000-0000-0000-0000-000000000001';
  state.datasets = [dataset(dsId, 'HOT OSM Education Facilities — Amajuba DC25')];
  // No features in state

  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=liquor&features=true'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  const schoolsLayer = body.layers.find((l) => l.id === 'schools');
  assert.ok(schoolsLayer);
  // Dataset exists but has no features — null features (empty dataset)
  assert.equal(schoolsLayer.features, null);
});

test('notice-layers returns 500 when feature store is unavailable', async () => {
  resetState();
  const dsId = 'f1000000-0000-0000-0000-000000000001';
  state.datasets = [dataset(dsId, 'HOT OSM Education Facilities — Amajuba DC25')];
  state.failTable = 'spatial_staged_features';

  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=liquor&features=true'),
  );
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.match(body.error, /temporarily unavailable/);
});

test('notice-layers includes proximityRadius for liquor notices', async () => {
  resetState();
  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=other'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  // Mock PROXIMITY_RADIUS has 'other' with 500m
  assert.ok(body.proximityRadius != null);
  assert.equal(body.proximityRadius.metres, 500);
});

test('notice-layers includes summary counts', async () => {
  resetState();
  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=other'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(typeof body.summary.total === 'number');
  assert.ok(typeof body.summary.available === 'number');
  assert.ok(typeof body.summary.pending === 'number');
  assert.ok(typeof body.summary.unavailable === 'number');
});

test('notice-layers features=false skips feature loading', async () => {
  resetState();
  const dsId = 'g1000000-0000-0000-0000-000000000001';
  state.datasets = [dataset(dsId, 'HOT OSM Education Facilities — Amajuba DC25')];
  state.features = [pointFeature('feat-1', dsId, { name: 'School' })];

  const res = await getNoticeLayers(
    new Request('https://cc.example/api/spatial/notice-layers?noticeType=liquor&features=false'),
  );
  const body = await res.json();
  assert.equal(res.status, 200);
  const schoolsLayer = body.layers.find((l) => l.id === 'schools');
  assert.ok(schoolsLayer);
  // features=false means no features loaded
  assert.equal(schoolsLayer.features, null);
});
