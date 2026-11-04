import { createServiceClient } from '@/lib/supabase/server';

export interface SpatialSource {
  id: string;
  name: string;
  institution: string;
  source_type: string;
  base_url: string | null;
  layer_id: string | null;
  description: string | null;
  geographic_coverage: string;
  coordinate_system: string;
  requires_auth: boolean;
  permission_status: string;
  permission_notes: string | null;
  custodian_name: string | null;
  custodian_email: string | null;
  last_checked_at: string | null;
  last_successful_import_at: string | null;
  dataset_date: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
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
