import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canPerformSpatialOperation,
  hasPublicRedistributionPermission,
} from '../spatial-permissions.ts';

test('requires both the source and dataset to permit redistribution', () => {
  assert.equal(hasPublicRedistributionPermission('redistribute', 'redistribute'), true);
  assert.equal(hasPublicRedistributionPermission('redistribute', 'display'), false);
  assert.equal(hasPublicRedistributionPermission('download', 'redistribute'), false);
  assert.equal(hasPublicRedistributionPermission(null, 'redistribute'), false);
});

test('only redistribution classification permits public publication', () => {
  assert.equal(canPerformSpatialOperation('redistribute', 'publish'), true);
  assert.equal(canPerformSpatialOperation('download', 'publish'), false);
  assert.equal(canPerformSpatialOperation('internal', 'publish'), false);
  assert.equal(canPerformSpatialOperation('display', 'publish'), false);
  assert.equal(canPerformSpatialOperation('reference', 'publish'), false);
});
