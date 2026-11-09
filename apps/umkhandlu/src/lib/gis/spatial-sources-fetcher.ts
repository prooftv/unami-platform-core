import { createServiceClient } from '@/lib/supabase/server';

// Controlled permission classification vocabulary
export type PermissionClassification =
  | 'reference'
  | 'display'
  | 'internal'
  | 'download'
  | 'redistribute'
  | 'restricted'
  | 'prohibited'
  | 'pending';

// Operations permitted per classification
export const PERMITTED_OPERATIONS: Record<PermissionClassification, string[]> = {
  reference:    [],
  display:      ['display'],
  internal:     ['display', 'ingest', 'process'],
  download:     ['display', 'ingest', 'process', 'download'],
  redistribute: ['display', 'ingest', 'process', 'download', 'publish', 'redistribute'],
  restricted:   [],
  prohibited:   [],
  pending:      [],
};

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

export interface SpatialImport {
  id: string;
  source_id: string;
  status: string;
  features_imported: number;
  error_message: string | null;
  import_type: string | null;
  target_node_url: string | null;
  started_at: string;
  completed_at: string | null;
}

export async function fetchSpatialSources(): Promise<SpatialSource[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('spatial_sources')
    .select('*')
    .order('institution', { ascending: true });
  if (error || !data) return [];
  return data as SpatialSource[];
}

export async function fetchRecentImports(limit = 20): Promise<SpatialImport[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('spatial_imports')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as SpatialImport[];
}
