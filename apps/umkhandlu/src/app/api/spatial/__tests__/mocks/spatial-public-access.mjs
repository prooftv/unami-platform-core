export async function filterPubliclyRedistributableDatasets(_supabase, datasets) {
  const state = globalThis.__spatialRouteTestState;
  const allowed = datasets.filter(
    (candidate) =>
      candidate.permission_classification === 'redistribute' &&
      candidate.source_id !== null &&
      !state.restrictedIds.has(candidate.id),
  );
  return { datasets: allowed, excludedCount: datasets.length - allowed.length };
}
