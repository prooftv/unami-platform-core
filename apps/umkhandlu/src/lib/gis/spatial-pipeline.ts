export type DatasetSourceIdentity = {
  valid: true;
} | {
  valid: false;
  error: string;
};

export function validateDatasetSourceIdentity(
  requestedSourceId: string,
  datasetSourceId: string,
): DatasetSourceIdentity {
  if (requestedSourceId !== datasetSourceId) {
    return {
      valid: false,
      error: 'The selected source does not own the selected dataset.',
    };
  }

  return { valid: true };
}
