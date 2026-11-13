import { createServiceClient } from '@/lib/supabase/server';
import { hasPublicRedistributionPermission } from '@/lib/gis/spatial-permissions';

type PermissionRecord = {
  id: string;
  source_id: string | null;
  permission_classification: string | null;
};

export async function filterPubliclyRedistributableDatasets<
  T extends PermissionRecord,
>(
  supabase: ReturnType<typeof createServiceClient>,
  datasets: T[],
): Promise<{ datasets: T[]; excludedCount: number }> {
  const candidates = datasets.filter(
    (dataset) =>
      dataset.source_id !== null &&
      dataset.permission_classification === 'redistribute',
  );
  const sourceIds = [
    ...new Set(
      candidates.flatMap((dataset) =>
        dataset.source_id ? [dataset.source_id] : [],
      ),
    ),
  ];
  if (!sourceIds.length) {
    return { datasets: [], excludedCount: datasets.length };
  }

  const { data: sources, error } = await supabase
    .from('spatial_sources')
    .select('id, permission_classification')
    .in('id', sourceIds);
  if (error) {
    throw new Error(`Could not verify spatial source permissions: ${error.message}`);
  }

  const sourcePermissions = new Map(
    (sources ?? []).map((source) => [source.id, source.permission_classification]),
  );
  const allowed = candidates.filter((dataset) =>
    hasPublicRedistributionPermission(
      dataset.permission_classification,
      dataset.source_id
        ? sourcePermissions.get(dataset.source_id) ?? null
        : null,
    ),
  );
  return { datasets: allowed, excludedCount: datasets.length - allowed.length };
}
