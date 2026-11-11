'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getOperatorSession } from '@/lib/auth/operator';
import { inspectService, inspectLayer, queryFeatures } from '@/lib/gis/arcgis-connector';
import type { PermissionClassification } from '@/lib/gis/spatial-sources-fetcher';

async function requireOperator() {
  const session = await getOperatorSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

// ---------------------------------------------------------------------------
// Permission enforcement
// ---------------------------------------------------------------------------

// Classifications that block ingestion regardless of context
const BLOCKS_INGESTION: PermissionClassification[] = [
  'restricted', 'prohibited', 'pending', 'reference', 'display',
];

// Permitted operations per classification
const PERMITTED_OPS: Record<PermissionClassification, string[]> = {
  reference:    [],
  display:      ['display'],
  internal:     ['display', 'ingest', 'process', 'publish'],
  download:     ['display', 'ingest', 'process', 'download', 'publish'],
  redistribute: ['display', 'ingest', 'process', 'download', 'publish', 'redistribute'],
  restricted:   [],
  prohibited:   [],
  pending:      [],
};

function canPerform(classification: PermissionClassification, operation: string): boolean {
  return PERMITTED_OPS[classification]?.includes(operation) ?? false;
}

// Returns an error string if ingestion is blocked, null if permitted.
// Enforces: most restrictive permission prevails; dataset cannot override source restriction.
async function checkIngestionPermission(
  supabase: ReturnType<typeof createServiceClient>,
  datasetId: string,
): Promise<string | null> {
  const { data: dataset } = await supabase
    .from('spatial_datasets')
    .select('id, name, permission_classification, source_id')
    .eq('id', datasetId)
    .single();

  if (!dataset) return 'Dataset not found.';

  const datasetClass = (dataset.permission_classification ?? 'pending') as PermissionClassification;

  const { data: source } = await supabase
    .from('spatial_sources')
    .select('id, name, permission_classification, restriction_authority, restriction_basis')
    .eq('id', dataset.source_id)
    .single();

  if (!source) return 'Source not found for dataset.';

  const sourceClass = (source.permission_classification ?? 'pending') as PermissionClassification;

  // Source-level restriction always prevails — cannot be overridden by dataset
  if (sourceClass === 'restricted') {
    return `Ingestion blocked: source "${source.name}" is restricted. Authority: ${source.restriction_authority ?? 'not recorded'}. Basis: ${source.restriction_basis ?? 'not recorded'}.`;
  }
  if (sourceClass === 'prohibited') {
    return `Ingestion blocked: source "${source.name}" is prohibited.`;
  }

  // Dataset-level check
  if (BLOCKS_INGESTION.includes(datasetClass)) {
    return `Ingestion blocked: dataset permission classification is "${datasetClass}". Only internal, download or redistribute permit ingestion.`;
  }

  // Source must also permit ingestion
  if (!canPerform(sourceClass, 'ingest')) {
    return `Ingestion blocked: source permission classification is "${sourceClass}". Only internal, download or redistribute permit ingestion.`;
  }

  return null;
}

async function checkPublicationPermission(
  supabase: ReturnType<typeof createServiceClient>,
  datasetId: string,
): Promise<string | null> {
  const { data: dataset } = await supabase
    .from('spatial_datasets')
    .select('id, name, permission_classification, source_id')
    .eq('id', datasetId)
    .single();

  if (!dataset) return 'Dataset not found.';

  const datasetClass = (dataset.permission_classification ?? 'pending') as PermissionClassification;

  const { data: source } = await supabase
    .from('spatial_sources')
    .select('id, name, permission_classification, restriction_authority')
    .eq('id', dataset.source_id)
    .single();

  if (!source) return 'Source not found for dataset.';

  const sourceClass = (source.permission_classification ?? 'pending') as PermissionClassification;

  if (sourceClass === 'restricted') {
    return `Publication blocked: source "${source.name}" is restricted. Authority: ${source.restriction_authority ?? 'not recorded'}.`;
  }
  if (sourceClass === 'prohibited') {
    return `Publication blocked: source "${source.name}" is prohibited.`;
  }
  // 'redistribute' permits full public publication.
  // 'download' and 'internal' permit publication within the platform (internal use).
  // 'display', 'reference', 'pending' do not permit publication.
  if (!canPerform(sourceClass, 'publish')) {
    return `Publication blocked: source permission classification is "${sourceClass}". Redistribution, download or internal classification required.`;
  }
  if (!canPerform(datasetClass, 'publish')) {
    return `Publication blocked: dataset permission classification is "${datasetClass}". Redistribution, download or internal classification required.`;
  }

  return null;
}

async function writePermissionAudit(
  supabase: ReturnType<typeof createServiceClient>,
  tableName: string,
  recordId: string,
  actor: string,
  prevClass: string | null,
  newClass: string,
  prevRestrictionAuthority: string | null,
  newRestrictionAuthority: string | null,
  reason: string,
) {
  await supabase.from('spatial_permission_changes').insert({
    table_name: tableName,
    record_id: recordId,
    actor,
    previous_classification: prevClass,
    new_classification: newClass,
    previous_restriction_authority: prevRestrictionAuthority,
    new_restriction_authority: newRestrictionAuthority,
    reason,
  });
}

// ---------------------------------------------------------------------------
// Source actions
// ---------------------------------------------------------------------------

export async function createSourceAction(formData: FormData) {
  await requireOperator();
  const supabase = await createClient();

  const name                      = formData.get('name') as string;
  const institution               = formData.get('institution') as string;
  const source_type               = formData.get('source_type') as string;
  const permission_classification = (formData.get('permission_classification') as PermissionClassification) ?? 'pending';

  if (!name || !institution || !source_type) {
    return { error: 'Name, institution and source type are required.' };
  }

  const { data, error } = await supabase.from('spatial_sources').insert({
    name,
    institution,
    source_type,
    base_url:                  (formData.get('base_url') as string) || null,
    source_url:                (formData.get('source_url') as string) || null,
    dataset_identifier:        (formData.get('dataset_identifier') as string) || null,
    layer_id:                  (formData.get('layer_id') as string) || null,
    description:               (formData.get('description') as string) || null,
    geographic_coverage:       (formData.get('geographic_coverage') as string) || 'amajuba',
    coordinate_system:         (formData.get('coordinate_system') as string) || 'EPSG:4326',
    requires_auth:             false,
    permission_status:         permission_classification,
    permission_classification,
    permission_notes:          (formData.get('permission_notes') as string) || null,
    attribution:               (formData.get('attribution') as string) || null,
    licence_terms:             (formData.get('licence_terms') as string) || null,
    restriction_authority:     (formData.get('restriction_authority') as string) || null,
    restriction_basis:         (formData.get('restriction_basis') as string) || null,
    custodian_name:            (formData.get('custodian_name') as string) || null,
    custodian_email:           (formData.get('custodian_email') as string) || null,
    dataset_date:              (formData.get('dataset_date') as string) || null,
    availability_status:       (formData.get('availability_status') as string) || 'unknown',
    technical_usability:       (formData.get('technical_usability') as string) || 'unknown',
    authority_status:          (formData.get('authority_status') as string) || 'unknown',
    assessment_notes:          (formData.get('assessment_notes') as string) || null,
    notes:                     (formData.get('notes') as string) || null,
  }).select('id').single();

  if (error) return { error: error.message };

  revalidatePath('/spatial/sources');
  return { success: true };
}

export async function updateSourceAction(id: string, formData: FormData) {
  const session = await requireOperator();
  const supabase = await createClient();
  const sb = createServiceClient();

  const newClass = (formData.get('permission_classification') as PermissionClassification) ?? 'pending';

  // Read previous state for audit
  const { data: prev } = await sb.from('spatial_sources')
    .select('permission_classification, restriction_authority')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('spatial_sources').update({
    name:                      formData.get('name') as string,
    institution:               formData.get('institution') as string,
    source_type:               formData.get('source_type') as string,
    base_url:                  (formData.get('base_url') as string) || null,
    source_url:                (formData.get('source_url') as string) || null,
    dataset_identifier:        (formData.get('dataset_identifier') as string) || null,
    layer_id:                  (formData.get('layer_id') as string) || null,
    description:               (formData.get('description') as string) || null,
    geographic_coverage:       (formData.get('geographic_coverage') as string) || 'amajuba',
    coordinate_system:         (formData.get('coordinate_system') as string) || 'EPSG:4326',
    permission_status:         newClass,
    permission_classification: newClass,
    permission_notes:          (formData.get('permission_notes') as string) || null,
    attribution:               (formData.get('attribution') as string) || null,
    licence_terms:             (formData.get('licence_terms') as string) || null,
    restriction_authority:     (formData.get('restriction_authority') as string) || null,
    restriction_basis:         (formData.get('restriction_basis') as string) || null,
    custodian_name:            (formData.get('custodian_name') as string) || null,
    custodian_email:           (formData.get('custodian_email') as string) || null,
    dataset_date:              (formData.get('dataset_date') as string) || null,
    availability_status:       (formData.get('availability_status') as string) || 'unknown',
    technical_usability:       (formData.get('technical_usability') as string) || 'unknown',
    authority_status:          (formData.get('authority_status') as string) || 'unknown',
    assessment_notes:          (formData.get('assessment_notes') as string) || null,
    notes:                     (formData.get('notes') as string) || null,
    updated_at:                new Date().toISOString(),
  }).eq('id', id);

  if (error) return { error: error.message };

  // Audit permission classification changes
  if (prev && prev.permission_classification !== newClass) {
    await writePermissionAudit(
      sb, 'spatial_sources', id, session.id,
      prev.permission_classification, newClass,
      prev.restriction_authority,
      (formData.get('restriction_authority') as string) || null,
      'operator update via source form',
    );
  }

  revalidatePath('/spatial/sources');
  revalidatePath(`/spatial/sources/${id}`);
  return { success: true };
}

export async function deactivateSourceAction(id: string) {
  await requireOperator();
  const supabase = await createClient();
  const { error } = await supabase.from('spatial_sources')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/spatial/sources');
  return { success: true };
}

export async function reactivateSourceAction(id: string) {
  await requireOperator();
  const supabase = await createClient();
  const { error } = await supabase.from('spatial_sources')
    .update({ active: true, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/spatial/sources');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function runHealthCheckAction(sourceId?: string) {
  await requireOperator();
  const supabase = createServiceClient();

  let query = supabase.from('spatial_sources').select('id, name, base_url').eq('active', true);
  if (sourceId) query = query.eq('id', sourceId);
  const { data: sources } = await query;
  if (!sources?.length) return { error: 'No active sources found.' };

  const results: { id: string; name: string; reachable: boolean; responseMs: number }[] = [];

  for (const source of sources) {
    const started = new Date().toISOString();
    let reachable = false;
    let responseMs = 0;
    let errorMsg: string | null = null;

    if (source.base_url) {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch(`${source.base_url.replace(/\/$/, '')}?f=json`, {
          signal: controller.signal, cache: 'no-store',
        });
        clearTimeout(timer);
        reachable = res.ok;
        responseMs = Date.now() - start;
      } catch (e) {
        responseMs = Date.now() - start;
        errorMsg = e instanceof Error ? e.message : String(e);
      }
    } else {
      errorMsg = 'No base_url configured';
    }

    const completed = new Date().toISOString();
    await supabase.from('spatial_pipeline_runs').insert({
      pipeline_type: 'health-check',
      source_id: source.id,
      status: reachable ? 'success' : 'failed',
      started_at: started,
      completed_at: completed,
      error_message: errorMsg,
      triggered_by: 'operator',
      log: [{ ts: completed, msg: reachable ? `Reachable — ${responseMs}ms` : `Unreachable — ${errorMsg}` }],
    });

    await supabase.from('spatial_sources')
      .update({ last_checked_at: completed, updated_at: completed })
      .eq('id', source.id);

    results.push({ id: source.id, name: source.name, reachable, responseMs });
  }

  revalidatePath('/spatial/sources');
  revalidatePath('/spatial/pipelines');
  return { success: true, results };
}

// ---------------------------------------------------------------------------
// ArcGIS inspection
// ---------------------------------------------------------------------------

export async function inspectSourceLayersAction(sourceId: string) {
  await requireOperator();
  const supabase = createServiceClient();

  const { data: source } = await supabase
    .from('spatial_sources')
    .select('id, name, base_url, source_type')
    .eq('id', sourceId)
    .single();

  if (!source?.base_url) return { error: 'Source has no base_url configured.' };
  if (!source.source_type.startsWith('arcgis')) {
    return { error: 'Layer inspection is only available for ArcGIS sources.' };
  }

  const result = await inspectService(source.base_url);
  if (!result.ok) return { error: result.error.message };

  const now = new Date().toISOString();
  await supabase.from('spatial_sources').update({
    last_checked_at: now,
    updated_at: now,
  }).eq('id', sourceId);

  revalidatePath(`/spatial/sources/${sourceId}`);
  return { success: true, layers: result.data.layers, spatialReference: result.data.spatialReference };
}

/**
 * Fetch features live from an ArcGIS FeatureServer layer and stage them.
 * Enforces permission before fetching. Clips to Amajuba bbox by default.
 * Idempotency: blocks if pending features already exist for the dataset.
 */
export async function fetchAndStageFromArcGISAction(
  datasetId: string,
  layerId: number,
  options?: { where?: string; maxFeatures?: number },
) {
  const session = await requireOperator();
  const supabase = createServiceClient();

  const permissionError = await checkIngestionPermission(supabase, datasetId);
  if (permissionError) return { error: permissionError };

  const { data: dataset } = await supabase
    .from('spatial_datasets')
    .select('id, name, source_id')
    .eq('id', datasetId)
    .single();
  if (!dataset) return { error: 'Dataset not found.' };

  const { data: source } = await supabase
    .from('spatial_sources')
    .select('base_url, source_type')
    .eq('id', dataset.source_id)
    .single();
  if (!source?.base_url) return { error: 'Source has no base_url.' };
  if (!source.source_type.startsWith('arcgis')) {
    return { error: 'Live fetch is only available for ArcGIS sources.' };
  }

  // Idempotency guard
  const { count: existingCount } = await supabase
    .from('spatial_staged_features')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_id', datasetId)
    .eq('operator_status', 'pending');
  if ((existingCount ?? 0) > 0) {
    return { error: `Dataset already has ${existingCount} features pending review. Approve or reject them before re-fetching.` };
  }

  const result = await queryFeatures(source.base_url, layerId, {
    where: options?.where ?? '1=1',
    maxFeatures: options?.maxFeatures ?? 2000,
  });
  if (!result.ok) return { error: result.error.message };

  const { features, totalCount } = result.data;
  if (!features.length) return { error: 'Query returned no features. Check the layer ID and where clause.' };

  const started = new Date().toISOString();
  const { data: run, error: runErr } = await supabase
    .from('spatial_pipeline_runs')
    .insert({
      pipeline_type: 'arcgis-fetch',
      dataset_id: datasetId,
      source_id: dataset.source_id,
      status: 'running',
      triggered_by: session.id,
      started_at: started,
      log: [{ ts: started, msg: `Fetching layer ${layerId} from ${source.base_url} — ${features.length} features` }],
    })
    .select('id')
    .single();
  if (runErr || !run) return { error: 'Failed to create pipeline run.' };

  type RawFeature = { type: string; geometry: unknown; properties: Record<string, unknown> | null };
  const staged = (features as RawFeature[]).map((f) => {
    const geom = f.geometry as { type?: string; coordinates?: unknown } | null;
    const hasGeom = !!geom?.type && geom.coordinates !== undefined;
    const issues: string[] = [];
    if (!hasGeom) issues.push('Missing or null geometry');
    return {
      dataset_id: datasetId,
      pipeline_run_id: run.id,
      feature_geojson: geom ?? {},
      feature_properties: f.properties ?? {},
      geometry_valid: issues.length === 0,
      geometry_issues: issues.length ? issues : null,
      operator_status: 'pending',
    };
  });

  let inserted = 0;
  for (let i = 0; i < staged.length; i += 500) {
    const { error: insErr } = await supabase
      .from('spatial_staged_features')
      .insert(staged.slice(i, i + 500));
    if (insErr) {
      await supabase.from('spatial_pipeline_runs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: insErr.message,
      }).eq('id', run.id);
      return { error: `Failed to stage features: ${insErr.message}` };
    }
    inserted += Math.min(500, staged.length - i);
  }

  const invalid = staged.filter((f) => !f.geometry_valid).length;
  const completed = new Date().toISOString();
  await supabase.from('spatial_pipeline_runs').update({
    status: 'success',
    completed_at: completed,
    features_fetched: totalCount ?? features.length,
    features_processed: inserted,
    log: [
      { ts: started, msg: `Fetching layer ${layerId} — ${features.length} features` },
      { ts: completed, msg: `Staged ${inserted} features. ${invalid} with geometry issues.` },
    ],
  }).eq('id', run.id);

  await supabase.from('spatial_datasets')
    .update({ status: 'staged', updated_at: completed })
    .eq('id', datasetId);

  revalidatePath('/spatial/staging');
  revalidatePath('/spatial/datasets');
  revalidatePath('/spatial/pipelines');
  return { success: true, staged: inserted, invalid };
}

export async function inspectLayerFieldsAction(sourceId: string, layerId: number) {
  await requireOperator();
  const supabase = createServiceClient();

  const { data: source } = await supabase
    .from('spatial_sources')
    .select('base_url')
    .eq('id', sourceId)
    .single();

  if (!source?.base_url) return { error: 'Source has no base_url.' };

  const result = await inspectLayer(source.base_url, layerId);
  if (!result.ok) return { error: result.error.message };

  return {
    success: true,
    layer: {
      id: result.data.id,
      name: result.data.name,
      geometryType: result.data.geometryType,
      fields: result.data.fields,
      description: result.data.description,
      copyrightText: result.data.copyrightText,
    },
  };
}

// ---------------------------------------------------------------------------
// Dataset publication and archival
// ---------------------------------------------------------------------------

export async function publishDatasetAction(datasetId: string) {
  const session = await requireOperator();
  const supabase = createServiceClient();

  const permissionError = await checkPublicationPermission(supabase, datasetId);
  if (permissionError) return { error: permissionError };

  const { data: dataset } = await supabase
    .from('spatial_datasets')
    .select('id, name, status, feature_count')
    .eq('id', datasetId)
    .single();

  if (!dataset) return { error: 'Dataset not found.' };
  if (dataset.status === 'published') return { error: 'Dataset is already published.' };

  // Count approved features
  const { count: approvedCount } = await supabase
    .from('spatial_staged_features')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_id', datasetId)
    .eq('operator_status', 'approved');

  const { count: pendingCount } = await supabase
    .from('spatial_staged_features')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_id', datasetId)
    .eq('operator_status', 'pending');

  if ((pendingCount ?? 0) > 0) {
    return { error: `${pendingCount} features are still pending review. Approve or reject all features before publishing.` };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from('spatial_datasets').update({
    status: 'published',
    active: true,
    published_at: now,
    feature_count: approvedCount ?? dataset.feature_count,
    updated_at: now,
  }).eq('id', datasetId);

  if (error) return { error: error.message };

  await supabase.from('spatial_permission_changes').insert({
    table_name: 'spatial_datasets',
    record_id: datasetId,
    actor: session.id,
    previous_classification: dataset.status,
    new_classification: 'published',
    reason: `Dataset published by operator. ${approvedCount ?? 0} approved features.`,
  });

  revalidatePath('/spatial/datasets');
  revalidatePath(`/spatial/datasets/${datasetId}`);
  revalidatePath('/spatial/staging');
  return { success: true, featureCount: approvedCount ?? 0 };
}

export async function archiveDatasetAction(datasetId: string) {
  const session = await requireOperator();
  const supabase = createServiceClient();

  const { data: dataset } = await supabase
    .from('spatial_datasets')
    .select('id, name, status')
    .eq('id', datasetId)
    .single();

  if (!dataset) return { error: 'Dataset not found.' };

  const now = new Date().toISOString();
  const { error } = await supabase.from('spatial_datasets').update({
    status: 'archived',
    active: false,
    updated_at: now,
  }).eq('id', datasetId);

  if (error) return { error: error.message };

  await supabase.from('spatial_permission_changes').insert({
    table_name: 'spatial_datasets',
    record_id: datasetId,
    actor: session.id,
    previous_classification: dataset.status,
    new_classification: 'archived',
    reason: 'Dataset archived by operator.',
  });

  revalidatePath('/spatial/datasets');
  revalidatePath(`/spatial/datasets/${datasetId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Pipeline trigger — select source, layer, run fetch-and-stage
// ---------------------------------------------------------------------------

export async function triggerPipelineAction(
  sourceId: string,
  datasetId: string,
  layerId: number,
  options?: { where?: string; maxFeatures?: number },
) {
  return fetchAndStageFromArcGISAction(datasetId, layerId, options);
}

// ---------------------------------------------------------------------------
// Dataset actions
// ---------------------------------------------------------------------------

export async function createDatasetAction(formData: FormData) {
  await requireOperator();
  const supabase = await createClient();

  const source_id               = formData.get('source_id') as string;
  const name                    = formData.get('name') as string;
  const permission_classification = (formData.get('permission_classification') as PermissionClassification) ?? 'pending';

  if (!source_id || !name) return { error: 'Source and name are required.' };

  const { error } = await supabase.from('spatial_datasets').insert({
    source_id,
    name,
    layer_id:               (formData.get('layer_id') as string) || null,
    description:            (formData.get('description') as string) || null,
    geographic_coverage:    (formData.get('geographic_coverage') as string) || 'amajuba',
    crs:                    (formData.get('crs') as string) || 'EPSG:4326',
    dataset_date:           (formData.get('dataset_date') as string) || null,
    permission_status:      permission_classification,
    permission_classification,
    permission_notes:       (formData.get('permission_notes') as string) || null,
    attribution:            (formData.get('attribution') as string) || null,
    licence_terms:          (formData.get('licence_terms') as string) || null,
    restriction_authority:  (formData.get('restriction_authority') as string) || null,
    restriction_basis:      (formData.get('restriction_basis') as string) || null,
    custodian_name:         (formData.get('custodian_name') as string) || null,
    custodian_email:        (formData.get('custodian_email') as string) || null,
    provenance:             (formData.get('provenance') as string) || null,
    authority_status:       (formData.get('authority_status') as string) || 'unknown',
    assessment_notes:       (formData.get('assessment_notes') as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath('/spatial/datasets');
  return { success: true };
}

// ---------------------------------------------------------------------------
// GeoJSON ingestion — enforces permission at source and dataset level
// ---------------------------------------------------------------------------

export async function ingestGeoJSONAction(datasetId: string, geojsonText: string) {
  const session = await requireOperator();
  const supabase = createServiceClient();

  // Permission check — blocks ingestion before any processing
  const permissionError = await checkIngestionPermission(supabase, datasetId);
  if (permissionError) {
    // Audit the blocked attempt
    await supabase.from('spatial_permission_changes').insert({
      table_name: 'spatial_datasets',
      record_id: datasetId,
      actor: session.id,
      previous_classification: null,
      new_classification: 'blocked_attempt',
      reason: `Ingestion blocked: ${permissionError}`,
    });
    return { error: permissionError };
  }

  let collection: { type: string; features: unknown[] };
  try {
    collection = JSON.parse(geojsonText);
  } catch {
    return { error: 'Invalid JSON.' };
  }

  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    return { error: 'Expected a GeoJSON FeatureCollection.' };
  }
  if (collection.features.length === 0) {
    return { error: 'FeatureCollection contains no features.' };
  }
  if (collection.features.length > 10_000) {
    return { error: 'FeatureCollection exceeds 10,000 features. Split into smaller files.' };
  }

  // Idempotency guard — prevent duplicate staging for the same dataset
  const { count: existingCount } = await supabase
    .from('spatial_staged_features')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_id', datasetId)
    .eq('operator_status', 'pending');
  if ((existingCount ?? 0) > 0) {
    return { error: `Dataset already has ${existingCount} features pending review. Approve or reject them before re-ingesting.` };
  }

  const started = new Date().toISOString();

  const { data: run, error: runErr } = await supabase
    .from('spatial_pipeline_runs')
    .insert({
      pipeline_type: 'gdal-process',
      dataset_id: datasetId,
      status: 'running',
      triggered_by: 'operator',
      started_at: started,
      log: [{ ts: started, msg: `Ingesting ${collection.features.length} features from operator upload` }],
    })
    .select('id')
    .single();

  if (runErr || !run) return { error: 'Failed to create pipeline run.' };

  type RawFeature = { type: string; geometry: unknown; properties: Record<string, unknown> | null };
  const staged = (collection.features as RawFeature[]).map((f) => {
    const geom = f.geometry as { type?: string; coordinates?: unknown } | null;
    const hasGeom = !!geom?.type && geom.coordinates !== undefined;
    const issues: string[] = [];
    if (!hasGeom) issues.push('Missing or null geometry');
    if (geom && !['Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon','GeometryCollection'].includes(geom.type ?? '')) {
      issues.push(`Unknown geometry type: ${geom.type}`);
    }
    return {
      dataset_id: datasetId,
      pipeline_run_id: run.id,
      feature_geojson: geom ?? {},
      feature_properties: f.properties ?? {},
      geometry_valid: issues.length === 0,
      geometry_issues: issues.length ? issues : null,
      operator_status: 'pending',
    };
  });

  let inserted = 0;
  for (let i = 0; i < staged.length; i += 500) {
    const { error: insErr } = await supabase
      .from('spatial_staged_features')
      .insert(staged.slice(i, i + 500));
    if (insErr) {
      await supabase.from('spatial_pipeline_runs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: insErr.message,
      }).eq('id', run.id);
      return { error: `Failed to stage features: ${insErr.message}` };
    }
    inserted += Math.min(500, staged.length - i);
  }

  const invalid = staged.filter((f) => !f.geometry_valid).length;
  const completed = new Date().toISOString();

  await supabase.from('spatial_pipeline_runs').update({
    status: 'success',
    completed_at: completed,
    features_fetched: staged.length,
    features_processed: inserted,
    log: [
      { ts: started, msg: `Ingesting ${staged.length} features from operator upload` },
      { ts: completed, msg: `Staged ${inserted} features. ${invalid} with geometry issues.` },
    ],
  }).eq('id', run.id);

  await supabase.from('spatial_datasets')
    .update({ status: 'staged', updated_at: completed })
    .eq('id', datasetId);

  revalidatePath('/spatial/staging');
  revalidatePath('/spatial/datasets');
  revalidatePath('/spatial/pipelines');
  return { success: true, staged: inserted, invalid };
}

// ---------------------------------------------------------------------------
// Staging review — rechecks permission before publication
// ---------------------------------------------------------------------------

export async function reviewStagedFeaturesAction(
  datasetId: string,
  featureIds: string[],
  action: 'approve' | 'reject',
  notes?: string,
) {
  const session = await requireOperator();
  const supabase = await createClient();
  const sb = createServiceClient();
  const now = new Date().toISOString();

  // Recheck permission before approving — permission may have changed since staging
  if (action === 'approve') {
    const permissionError = await checkPublicationPermission(sb, datasetId);
    if (permissionError) {
      await sb.from('spatial_permission_changes').insert({
        table_name: 'spatial_datasets',
        record_id: datasetId,
        actor: session.id,
        previous_classification: null,
        new_classification: 'blocked_attempt',
        reason: `Publication blocked at staging review: ${permissionError}`,
      });
      return { error: permissionError };
    }
  }

  const { error } = await supabase.from('spatial_staged_features').update({
    operator_status: action === 'approve' ? 'approved' : 'rejected',
    reviewed_at: now,
    notes: notes ?? null,
  }).in('id', featureIds).eq('dataset_id', datasetId);

  if (error) return { error: error.message };

  if (action === 'approve') {
    const { data: remaining } = await supabase.from('spatial_staged_features')
      .select('id').eq('dataset_id', datasetId).eq('operator_status', 'pending');
    // When all features are reviewed, advance status to 'staged' so the operator
    // can explicitly publish via publishDatasetAction — which enforces permission checks.
    // Do NOT auto-publish here; that would bypass the permission gate.
    if (!remaining?.length) {
      await supabase.from('spatial_datasets')
        .update({ status: 'staged', updated_at: now })
        .eq('id', datasetId)
        .neq('status', 'published');
    }
  }

  revalidatePath('/spatial/staging');
  return { success: true };
}
