import assert from 'node:assert/strict';
import test from 'node:test';

const state = {
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

function dataset(id, overrides = {}) {
  return {
    id,
    name: 'Published Places',
    status: 'published',
    active: true,
    feature_count: 1,
    attribution: null,
    dataset_date: '2026-01-01',
    published_at: '2026-01-02T00:00:00Z',
    source_id: 'source-1',
    permission_classification: 'redistribute',
    spatial_sources: {
      name: 'Open Places',
      institution: 'Source Institution',
      attribution: 'Source attribution',
    },
    ...overrides,
  };
}

function feature(id, datasetId, geometry = {
  type: 'Point',
  coordinates: [29.93, -27.75],
}, overrides = {}) {
  return {
    id,
    dataset_id: datasetId,
    operator_status: 'approved',
    feature_geojson: geometry,
    feature_properties: { name: `Feature ${id}` },
    ...overrides,
  };
}

const publishedId = 'c8532e74-88f4-4f66-9e93-e504347f1123';
const restrictedId = 'd8532e74-88f4-4f66-9e93-e504347f1123';
const unpublishedId = 'e8532e74-88f4-4f66-9e93-e504347f1123';
const incompletePermissionId = 'a8532e74-88f4-4f66-9e93-e504347f1123';
const pointBbox = '29.9,-27.8,30,-27.7';

const { GET: getMapLayers } = await import('../map-layers/route.ts');
const { GET: getFeatures } = await import('../features/route.ts');
const { GET: getFeature } = await import('../features/[id]/route.ts');
const { GET: getNoticeContext } = await import('../notice-context/route.ts');

test('map-layers validates bbox and returns stable IDs with source attribution', async () => {
  resetState();
  state.datasets = [
    dataset(publishedId),
    dataset(unpublishedId, { status: 'draft' }),
  ];
  state.features = [feature('feature-stable-id', publishedId)];

  const invalid = await getMapLayers(
    new Request('https://control.example/api/spatial/map-layers?bbox=,,,'),
  );
  assert.equal(invalid.status, 400);

  const response = await getMapLayers(
    new Request(`https://control.example/api/spatial/map-layers?bbox=${pointBbox}`),
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.layers.length, 1);
  assert.equal(body.layers[0].features[0].id, 'feature-stable-id');
  assert.equal(body.layers[0].attribution, 'Source attribution');
  assert.equal(body.layers[0].features[0].geometry.coordinates[0], 29.93);
});

test('map-layers returns empty status and reports only explicitly requested permission-denied IDs', async () => {
  resetState();
  state.datasets = [
    dataset(publishedId),
    dataset(restrictedId),
    dataset(incompletePermissionId, { source_id: null }),
    dataset('f8532e74-88f4-4f66-9e93-e504347f1123', {
      name: 'Empty Places',
      feature_count: 0,
    }),
  ];
  state.restrictedIds.add(restrictedId);

  const response = await getMapLayers(
    new Request(
      `https://control.example/api/spatial/map-layers?bbox=${pointBbox}&datasetIds=${restrictedId},${incompletePermissionId}`,
    ),
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.layers, []);
  assert.deepEqual(
    body.permissionRequiredDatasetIds,
    [restrictedId, incompletePermissionId],
  );

  const emptyResponse = await getMapLayers(
    new Request(
      `https://control.example/api/spatial/map-layers?bbox=${pointBbox}&datasetIds=f8532e74-88f4-4f66-9e93-e504347f1123`,
    ),
  );
  const emptyBody = await emptyResponse.json();
  assert.equal(emptyBody.layers[0].status, 'empty');
});

test('map-layers does not return invalid approved geometry as an empty result', async () => {
  resetState();
  state.datasets = [dataset(publishedId)];
  state.features = [
    feature(publishedId, publishedId, { type: 'Point', coordinates: [29.93, 91] }),
  ];

  const response = await getMapLayers(
    new Request(`https://control.example/api/spatial/map-layers?bbox=${pointBbox}`),
  );
  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /temporarily unavailable/);
});

test('features validates filters and returns approved features with fallback attribution', async () => {
  resetState();
  state.datasets = [dataset(publishedId)];
  state.features = [
    feature('approved-feature', publishedId),
    feature('staged-feature', publishedId, undefined, { operator_status: 'pending' }),
  ];

  const invalid = await getFeatures(
    new Request(
      `https://control.example/api/spatial/features?id=${publishedId}&bbox=,,,`,
    ),
  );
  assert.equal(invalid.status, 400);

  const response = await getFeatures(
    new Request(
      `https://control.example/api/spatial/features?id=${publishedId}&bbox=${pointBbox}&limit=1`,
    ),
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.features.length, 1);
  assert.equal(body.features[0].id, 'approved-feature');
  assert.equal(body.meta.attribution, 'Source attribution');
  assert.equal(body.meta.sourceInstitution, 'Source Institution');
});

test('features default pagination returns a bounded page and a continuation offset', async () => {
  resetState();
  state.datasets = [dataset(publishedId, { feature_count: 2 })];
  state.features = [
    feature('feature-1', publishedId),
    feature('feature-2', publishedId, {
      type: 'Point',
      coordinates: [29.94, -27.75],
    }),
  ];

  const response = await getFeatures(
    new Request(
      `https://control.example/api/spatial/features?id=${publishedId}`,
    ),
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.features.length, 2);
  assert.equal(body.meta.complete, true);
  assert.equal(body.meta.hasMore, false);
});

test('features denies restricted and unpublished datasets and rejects invalid geometry', async () => {
  resetState();
  state.datasets = [
    dataset(publishedId),
    dataset(restrictedId),
    dataset(incompletePermissionId, { source_id: null }),
    dataset(unpublishedId, { status: 'draft' }),
  ];
  state.features = [feature('f1', publishedId)];
  state.restrictedIds.add(restrictedId);

  const restricted = await getFeatures(
    new Request(
      `https://control.example/api/spatial/features?id=${restrictedId}&bbox=${pointBbox}`,
    ),
  );
  assert.equal(restricted.status, 403);
  const incompletePermission = await getFeatures(
    new Request(
      `https://control.example/api/spatial/features?id=${incompletePermissionId}&bbox=${pointBbox}`,
    ),
  );
  assert.equal(incompletePermission.status, 403);
  const unpublished = await getFeatures(
    new Request(
      `https://control.example/api/spatial/features?id=${unpublishedId}&bbox=${pointBbox}`,
    ),
  );
  assert.equal(unpublished.status, 404);
  const badId = await getFeatures(
    new Request('https://control.example/api/spatial/features?id=not-a-uuid'),
  );
  assert.equal(badId.status, 400);

  state.features = [
    feature('bad-geometry', publishedId, { type: 'Point', coordinates: [29.93, 91] }),
  ];
  const invalidGeometry = await getFeatures(
    new Request(
      `https://control.example/api/spatial/features?id=${publishedId}&bbox=${pointBbox}`,
    ),
  );
  assert.equal(invalidGeometry.status, 500);
});

test('features by ID preserves identity and enforces publication and permission', async () => {
  resetState();
  state.datasets = [dataset(publishedId), dataset(restrictedId)];
  state.features = [
    feature('c8532e74-88f4-4f66-9e93-e504347f1123', publishedId),
    feature('d8532e74-88f4-4f66-9e93-e504347f1123', restrictedId),
  ];
  state.restrictedIds.add(restrictedId);

  const response = await getFeature(
    new Request('https://control.example/api/spatial/features/feature'),
    { params: Promise.resolve({ id: 'c8532e74-88f4-4f66-9e93-e504347f1123' }) },
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.id, 'c8532e74-88f4-4f66-9e93-e504347f1123');
  assert.equal(body.meta.attribution, 'Source attribution');

  const restricted = await getFeature(
    new Request('https://control.example/api/spatial/features/feature'),
    { params: Promise.resolve({ id: 'd8532e74-88f4-4f66-9e93-e504347f1123' }) },
  );
  assert.equal(restricted.status, 403);
});

test('spatial APIs fail explicitly when the feature store is unavailable', async () => {
  resetState();
  state.datasets = [dataset(publishedId)];
  state.failTable = 'spatial_staged_features';
  const response = await getMapLayers(
    new Request(`https://control.example/api/spatial/map-layers?bbox=${pointBbox}`),
  );
  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /temporarily unavailable/);
});

test('notice-context validates coordinates and returns stable boundary identity and attribution', async () => {
  resetState();
  const wardId = 'a8532e74-88f4-4f66-9e93-e504347f1123';
  state.datasets = [
    dataset(publishedId, { name: 'MDB Wards 2026 — Amajuba' }),
    dataset('b8532e74-88f4-4f66-9e93-e504347f1123', {
      name: 'MDB Local Municipalities 2026 — Amajuba',
    }),
    dataset('c9532e74-88f4-4f66-9e93-e504347f1123', {
      name: 'MDB District Municipality 2026 — Amajuba',
    }),
  ];
  state.features = [
    feature(
      wardId,
      publishedId,
      {
        type: 'Polygon',
        coordinates: [[
          [29.92, -27.76],
          [29.94, -27.76],
          [29.94, -27.74],
          [29.92, -27.74],
          [29.92, -27.76],
        ]],
      },
      {
        feature_properties: { WardNo: 7, CAT_B: 'KZN123' },
      },
    ),
  ];

  const invalid = await getNoticeContext(
    new Request('https://control.example/api/spatial/notice-context?lat=91&lng=29.93'),
  );
  assert.equal(invalid.status, 400);

  const response = await getNoticeContext(
    new Request(
      'https://control.example/api/spatial/notice-context?noticeType=other&wardNumber=7&catB=KZN123&lat=-27.75&lng=29.93',
    ),
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.administrative.ward.features[0].id, wardId);
  assert.equal(body.administrative.ward.attribution, 'Source attribution');
});
