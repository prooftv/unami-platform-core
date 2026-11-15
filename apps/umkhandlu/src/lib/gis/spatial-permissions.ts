export type PermissionClassification =
  | 'reference'
  | 'display'
  | 'internal'
  | 'download'
  | 'redistribute'
  | 'restricted'
  | 'prohibited'
  | 'pending';

export type LegacyPermissionStatus =
  | 'pending'
  | 'confirmed'
  | 'restricted'
  | 'denied'
  | 'reference';

const PERMISSION_CLASSIFICATIONS: ReadonlySet<string> = new Set([
  'reference',
  'display',
  'internal',
  'download',
  'redistribute',
  'restricted',
  'prohibited',
  'pending',
]);

export function isPermissionClassification(
  value: unknown,
): value is PermissionClassification {
  return (
    typeof value === 'string' &&
    PERMISSION_CLASSIFICATIONS.has(value)
  );
}

export function toLegacyPermissionStatus(
  classification: PermissionClassification,
): LegacyPermissionStatus {
  switch (classification) {
    case 'pending':
      return 'pending';
    case 'reference':
      return 'reference';
    case 'restricted':
      return 'restricted';
    case 'prohibited':
      return 'denied';
    case 'display':
    case 'internal':
    case 'download':
    case 'redistribute':
      return 'confirmed';
  }
}

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
