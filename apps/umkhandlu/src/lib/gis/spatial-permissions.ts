export type PermissionClassification =
  | 'reference'
  | 'display'
  | 'internal'
  | 'download'
  | 'redistribute'
  | 'restricted'
  | 'prohibited'
  | 'pending';

export const PERMITTED_OPERATIONS: Record<PermissionClassification, string[]> = {
  reference: [],
  display: ['display'],
  internal: ['display', 'ingest', 'process'],
  download: ['display', 'ingest', 'process', 'download'],
  redistribute: ['display', 'ingest', 'process', 'download', 'publish', 'redistribute'],
  restricted: [],
  prohibited: [],
  pending: [],
};

export function canPerformSpatialOperation(
  classification: PermissionClassification,
  operation: string,
): boolean {
  return PERMITTED_OPERATIONS[classification].includes(operation);
}

export function hasPublicRedistributionPermission(
  datasetPermission: string | null,
  sourcePermission: string | null,
): boolean {
  return datasetPermission === 'redistribute' && sourcePermission === 'redistribute';
}
