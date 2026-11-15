import { createServiceClient } from '@/lib/supabase/server';
import {
  PERMITTED_OPERATIONS,
  type PermissionClassification,
} from '@/lib/gis/spatial-permissions';

export { PERMITTED_OPERATIONS };
export type { PermissionClassification };

// Classifications that block ingestion entirely
export const BLOCKS_INGESTION: PermissionClassification[] = ['restricted', 'prohibited', 'pending', 'reference', 'display'];

export interface SpatialSource {
  id: string;
  name: string;
  institution: string;
  source_type: string;
  base_url: string | null;
  source_url: string | null;
  dataset_identifier: string | null;
  layer_id: string | null;
  description: string | null;
  geographic_coverage: string;
  coordinate_system: string;
  requires_auth: boolean;
  // Legacy field — preserved for display; permission_classification is authoritative
  permission_status: string;
  permission_classification: PermissionClassification;
  permission_notes: string | null;
  attribution: string | null;
  licence_terms: string | null;
  restriction_authority: string | null;
  restriction_basis: string | null;
  custodian_name: string | null;
  custodian_email: string | null;
  // Four-dimension assessment
  availability_status: string;
  technical_usability: string;
  authority_status: string;
  assessment_notes: string | null;
  assessed_by: string | null;
  assessed_at: string | null;
  last_checked_at: string | null;
  last_successful_import_at: string | null;
  dataset_date: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpatialActivity {
  id: string;
  source_id: string;
  status: string;
  activity: string;
  features_processed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export async function fetchSpatialSources(): Promise<SpatialSource[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('spatial_sources')
    .select('*')
    .order('institution', { ascending: true });
  if (error) {
    throw new Error(`Could not fetch spatial sources: ${error.message}`);
  }
  return (data ?? []) as SpatialSource[];
}

export async function fetchRecentActivity(limit = 20): Promise<SpatialActivity[]> {
  const supabase = createServiceClient();
  const [pipelineResult, importResult] = await Promise.all([
    supabase
      .from('spatial_pipeline_runs')
      .select('id, source_id, pipeline_type, status, features_processed, error_message, started_at, completed_at')
      .order('started_at', { ascending: false })
      .limit(limit),
    supabase
    .from('spatial_imports')
      .select('id, source_id, status, features_imported, error_message, import_type, target_node_url, started_at, completed_at')
      .order('started_at', { ascending: false })
      .limit(limit),
  ]);
  if (pipelineResult.error) {
    throw new Error(`Could not fetch recent spatial pipeline runs: ${pipelineResult.error.message}`);
  }
  if (importResult.error) {
    throw new Error(`Could not fetch recent spatial imports: ${importResult.error.message}`);
  }

  const pipelineActivity: SpatialActivity[] = (pipelineResult.data ?? []).map((run) => ({
    id: `pipeline-${run.id}`,
    source_id: run.source_id ?? '',
    status: run.status,
    activity: run.pipeline_type,
    features_processed: run.features_processed,
    error_message: run.error_message,
    started_at: run.started_at,
    completed_at: run.completed_at,
  }));
  const importActivity: SpatialActivity[] = (importResult.data ?? []).map((item) => ({
    id: `import-${item.id}`,
    source_id: item.source_id,
    status: item.status,
    activity: `${item.import_type ?? 'import'} → ${item.target_node_url ?? 'node'}`,
    features_processed: item.features_imported,
    error_message: item.error_message,
    started_at: item.started_at,
    completed_at: item.completed_at,
  }));

  return [...pipelineActivity, ...importActivity]
    .sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))
    .slice(0, limit);
}
