import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isGeometryWithinBounds,
  isGeometryWithinRadius,
  isValidGeoJSONGeometry,
  isValidWgs84Bounds,
  isValidWgs84Point,
} from '../spatial-proximity.ts';

const origin = { lat: -27.75, lng: 29.93 };

test('validates WGS84 coordinates and rejects non-finite values', () => {
  assert.equal(isValidWgs84Point(origin), true);
  assert.equal(isValidWgs84Point({ lat: 91, lng: 29.93 }), false);
  assert.equal(isValidWgs84Point({ lat: -27.75, lng: Number.NaN }), false);
});

test('validates GeoJSON geometry types and WGS84 position order', () => {
  assert.equal(
    isValidGeoJSONGeometry({ type: 'Point', coordinates: [29.93, -27.75] }),
    true
  );
  assert.equal(
    isValidGeoJSONGeometry({ type: 'Point', coordinates: [29.93, 91] }),
    false
  );
  assert.equal(
    isValidGeoJSONGeometry({
      type: 'GeometryCollection',
      geometries: [{ type: 'Point', coordinates: [29.93, -27.75] }],
    }),
    true
  );
  assert.equal(
    isValidGeoJSONGeometry({ type: 'Unknown', coordinates: [29.93, -27.75] }),
    false
  );
});

test('rejects malformed GeoJSON positions and unclosed polygon rings', () => {
  assert.equal(
    isValidGeoJSONGeometry({ type: 'Point', coordinates: [29.93, 91] }),
    false
  );
  assert.equal(
    isValidGeoJSONGeometry({
      type: 'Polygon',
      coordinates: [
        [
          [29.92, -27.76],
          [29.94, -27.76],
          [29.94, -27.74],
          [29.92, -27.74],
        ],
      ],
    }),
    false
  );
});

test('filters points by geographic distance', () => {
  assert.equal(
    isGeometryWithinRadius(
      { type: 'Point', coordinates: [29.93, -27.751] },
      origin,
      500
    ),
    true
  );
  assert.equal(
    isGeometryWithinRadius(
      { type: 'Point', coordinates: [29.93, -27.76] },
      origin,
      500
    ),
    false
  );
});

test('measures line segments rather than only their distant vertices', () => {
  assert.equal(
    isGeometryWithinRadius(
      {
        type: 'LineString',
        coordinates: [
          [29.91, -27.75],
          [29.95, -27.75],
        ],
      },
      origin,
      500
    ),
    true
  );
});

test('includes polygon interiors and nearby edges but excludes distant polygons', () => {
  assert.equal(
    isGeometryWithinRadius(
      {
        type: 'Polygon',
        coordinates: [
          [
            [29.92, -27.76],
            [29.94, -27.76],
            [29.94, -27.74],
            [29.92, -27.74],
            [29.92, -27.76],
          ],
        ],
      },
      origin,
      500
    ),
    true
  );
  assert.equal(
    isGeometryWithinRadius(
      {
        type: 'Polygon',
        coordinates: [
          [
            [29.95, -27.76],
            [29.96, -27.76],
            [29.96, -27.74],
            [29.95, -27.74],
            [29.95, -27.76],
          ],
        ],
      },
      origin,
      500
    ),
    false
  );
});

test('handles multipolygons and rejects invalid geometry coordinates', () => {
  assert.equal(
    isGeometryWithinRadius(
      {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [29.929, -27.751],
              [29.931, -27.751],
              [29.931, -27.749],
              [29.929, -27.749],
              [29.929, -27.751],
            ],
          ],
        ],
      },
      origin,
      500
    ),
    true
  );
  assert.equal(
    isGeometryWithinRadius(
      { type: 'Point', coordinates: [300, -27.75] },
      origin,
      500
    ),
    false
  );
});

test('validates WGS84 view bounds and tests exact geometry intersection', () => {
  const view = { west: 29.92, south: -27.76, east: 29.94, north: -27.74 };
  assert.equal(isValidWgs84Bounds(view), true);
  assert.equal(isValidWgs84Bounds({ ...view, west: 181 }), false);
  assert.equal(isValidWgs84Bounds({ ...view, south: -27.7 }), false);
  assert.equal(
    isGeometryWithinBounds(
      { type: 'LineString', coordinates: [[29.91, -27.75], [29.95, -27.75]] },
      view
    ),
    true
  );
  assert.equal(
    isGeometryWithinBounds(
      { type: 'Point', coordinates: [29.95, -27.75] },
      view
    ),
    false
  );
  assert.equal(
    isGeometryWithinBounds(
      { type: 'Point', coordinates: [300, -27.75] },
      view
    ),
    false
  );
  assert.equal(
    isGeometryWithinBounds(
      {
        type: 'MultiPolygon',
        coordinates: [
          [[
            [29.90, -27.70],
            [29.91, -27.70],
            [29.91, -27.71],
            [29.90, -27.71],
            [29.90, -27.70],
          ]],
          [[
            [29.95, -27.78],
            [29.96, -27.78],
            [29.96, -27.77],
            [29.95, -27.77],
            [29.95, -27.78],
          ]],
        ],
      },
      view
    ),
    false
  );
  assert.equal(
    isGeometryWithinBounds(
      {
        type: 'Polygon',
        coordinates: [[
          [29.90, -27.80],
          [29.96, -27.80],
          [29.96, -27.70],
          [29.90, -27.70],
          [29.90, -27.80],
        ]],
      },
      view
    ),
    true
  );
});
