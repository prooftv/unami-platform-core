import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isAmajubaDistrictFeature,
  pointCoveredByGeometry,
  pointFromGeometry,
} from '../coverage-review.ts';

const polygonWithHole = {
  type: 'Polygon',
  coordinates: [
    [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
    [[3, 3], [7, 3], [7, 7], [3, 7], [3, 3]],
  ],
};

test('point coverage handles polygon interior, exterior and hole interior', () => {
  assert.equal(pointCoveredByGeometry([1, 1], polygonWithHole), true);
  assert.equal(pointCoveredByGeometry([11, 1], polygonWithHole), false);
  assert.equal(pointCoveredByGeometry([5, 5], polygonWithHole), false);
});

test('polygon boundaries and hole boundaries are treated as covered', () => {
  assert.equal(pointCoveredByGeometry([0, 5], polygonWithHole), true);
  assert.equal(pointCoveredByGeometry([3, 5], polygonWithHole), true);
});

test('MultiPolygon coverage checks each polygon', () => {
  const multiPolygon = {
    type: 'MultiPolygon',
    coordinates: [
      [[[20, 20], [21, 20], [21, 21], [20, 21], [20, 20]]],
      [[[30, 30], [31, 30], [31, 31], [30, 31], [30, 30]]],
    ],
  };
  assert.equal(pointCoveredByGeometry([30.5, 30.5], multiPolygon), true);
  assert.equal(pointCoveredByGeometry([25, 25], multiPolygon), false);
});

test('Amajuba boundary identity requires both district code and name', () => {
  assert.equal(isAmajubaDistrictFeature({ DISTRICT: 'DC25', DISTRICT_N: 'Amajuba' }), true);
  assert.equal(isAmajubaDistrictFeature({ DISTRICT: 'DC25', DISTRICT_N: 'Other' }), false);
  assert.equal(isAmajubaDistrictFeature({ DISTRICT_N: 'Amajuba' }), false);
});

test('point extraction rejects non-point and invalid coordinates', () => {
  assert.deepEqual(pointFromGeometry({ type: 'Point', coordinates: [30, -28] }), [30, -28]);
  assert.equal(pointFromGeometry({ type: 'Polygon', coordinates: [] }), null);
  assert.equal(pointFromGeometry({ type: 'Point', coordinates: [30, 91] }), null);
});
