import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canPerformSpatialOperation,
  hasPublicRedistributionPermission,
  isPermissionClassification,
  toLegacyPermissionStatus,
} from '../spatial-permissions.ts';
import { validateDatasetSourceIdentity } from '../spatial-pipeline.ts';

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

test('maps classifications to the legacy database status constraint', () => {
  assert.equal(toLegacyPermissionStatus('redistribute'), 'confirmed');
  assert.equal(toLegacyPermissionStatus('prohibited'), 'denied');
  assert.equal(toLegacyPermissionStatus('pending'), 'pending');
  assert.equal(isPermissionClassification('redistribute'), true);
  assert.equal(isPermissionClassification('public'), false);
});

test('rejects a pipeline source that does not own its selected dataset', () => {
  assert.deepEqual(validateDatasetSourceIdentity('source-a', 'source-a'), { valid: true });
  assert.deepEqual(validateDatasetSourceIdentity('source-a', 'source-b'), {
    valid: false,
    error: 'The selected source does not own the selected dataset.',
  });
});
