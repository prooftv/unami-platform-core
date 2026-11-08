'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getOperatorSession } from '@/lib/auth/operator';
import { inspectService, inspectLayer } from '@/lib/gis/arcgis-connector';

async function requireOperator() {
  const session = await getOperatorSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function createSourceAction(formData: FormData) {
  await requireOperator();
  const supabase = await createClient();

  const name               = formData.get('name') as string;
  const institution        = formData.get('institution') as string;
  const source_type        = formData.get('source_type') as string;
  const base_url           = formData.get('base_url') as string;
  const layer_id           = formData.get('layer_id') as string;
  const description        = formData.get('description') as string;
  const geographic_coverage = formData.get('geographic_coverage') as string;
  const coordinate_system  = formData.get('coordinate_system') as string;
  const permission_status  = formData.get('permission_status') as string;
  const permission_notes   = formData.get('permission_notes') as string;
  const custodian_name     = formData.get('custodian_name') as string;
  const custodian_email    = formData.get('custodian_email') as string;
  const dataset_date       = formData.get('dataset_date') as string;
  const notes              = formData.get('notes') as string;

  if (!name || !institution || !source_type) {
    return { error: 'Name, institution and source type are required.' };
  }

  const { error } = await supabase.from('spatial_sources').insert({
    name, institution, source_type,
    base_url: base_url || null,
    layer_id: layer_id || null,
    description: description || null,
    geographic_coverage: geographic_coverage || 'amajuba',
    coordinate_system: coordinate_system || 'EPSG:4326',
    requires_auth: false,
    permission_status: permission_status || 'pending',
    permission_notes: permission_notes || null,
    custodian_name: custodian_name || null,
    custodian_email: custodian_email || null,
    dataset_date: dataset_date || null,
    notes: notes || null,
  });

  if (error) return { error: error.message };
  revalidatePath('/spatial/sources');
  return { success: true };
}

export async function updateSourceAction(id: string, formData: FormData) {
  await requireOperator();
  const supabase = await createClient();

  const { error } = await supabase.from('spatial_sources').update({
    name:                formData.get('name') as string,
    institution:         formData.get('institution') as string,
    source_type:         formData.get('source_type') as string,
    base_url:            (formData.get('base_url') as string) || null,
    layer_id:            (formData.get('layer_id') as string) || null,
    description:         (formData.get('description') as string) || null,
    geographic_coverage: (formData.get('geographic_coverage') as string) || 'amajuba',
    coordinate_system:   (formData.get('coordinate_system') as string) || 'EPSG:4326',
    permission_status:   (formData.get('permission_status') as string) || 'pending',
    permission_notes:    (formData.get('permission_notes') as string) || null,
    custodian_name:      (formData.get('custodian_name') as string) || null,
    custodian_email:     (formData.get('custodian_email') as string) || null,
    dataset_date:        (formData.get('dataset_date') as string) || null,
    notes:               (formData.get('notes') as string) || null,
    updated_at:          new Date().toISOString(),
  }).eq('id', id);

  if (error) return { error: error.message };
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

/**
 * Inspect the layer catalogue of an ArcGIS source.
 * Returns layer list and spatial reference from the service root.
 * Does NOT attempt feature queries — those are blocked from external IPs on COGTA.
 */
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

  // Update source with confirmed layer count
  const now = new Date().toISOString();
  await supabase.from('spatial_sources').update({
    last_checked_at: now,
    updated_at: now,
  }).eq('id', sourceId);

  revalidatePath(`/spatial/sources/${sourceId}`);
  return { success: true, layers: result.data.layers, spatialReference: result.data.spatialReference };
}

/**
 * Inspect a single layer's field schema.
 */
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

export async function createDatasetAction(formData: FormData) {
  await requireOperator();
  const supabase = await createClient();

  const source_id         = formData.get('source_id') as string;
  const name              = formData.get('name') as string;
  const layer_id          = formData.get('layer_id') as string;
  const description       = formData.get('description') as string;
  const crs               = formData.get('crs') as string;
  const dataset_date      = formData.get('dataset_date') as string;
  const permission_status = formData.get('permission_status') as string;
  const permission_notes  = formData.get('permission_notes') as string;
  const custodian_name    = formData.get('custodian_name') as string;
  const custodian_email   = formData.get('custodian_email') as string;
  const provenance        = formData.get('provenance') as string;

  if (!source_id || !name) return { error: 'Source and name are required.' };

  const { error } = await supabase.from('spatial_datasets').insert({
    source_id, name,
    layer_id: layer_id || null,
    description: description || null,
    crs: crs || 'EPSG:4326',
    dataset_date: dataset_date || null,
    permission_status: permission_status || 'pending',
    permission_notes: permission_notes || null,
    custodian_name: custodian_name || null,
    custodian_email: custodian_email || null,
    provenance: provenance || null,
  });

  if (error) return { error: error.message };
  revalidatePath('/spatial/datasets');
  return { success: true };
}

/**
 * Ingest a GeoJSON FeatureCollection into the staging pipeline.
 * Validates geometry presence, records a pipeline run, and stages all features
 * for operator review. Does not publish — staging review is always required.
 */
export async function ingestGeoJSONAction(
  datasetId: string,
  geojsonText: string,
) {
  await requireOperator();
  const supabase = createServiceClient();

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

  const started = new Date().toISOString();

  // Create pipeline run record
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

  // Stage each feature
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

  // Insert in batches of 500
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

  // Move dataset to staged status
  await supabase.from('spatial_datasets')
    .update({ status: 'staged', updated_at: completed })
    .eq('id', datasetId);

  revalidatePath('/spatial/staging');
  revalidatePath('/spatial/datasets');
  revalidatePath('/spatial/pipelines');
  return { success: true, staged: inserted, invalid };
}

export async function reviewStagedFeaturesAction(
  datasetId: string,
  featureIds: string[],
  action: 'approve' | 'reject',
  notes?: string,
) {
  await requireOperator();
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from('spatial_staged_features').update({
    operator_status: action === 'approve' ? 'approved' : 'rejected',
    reviewed_at: now,
    notes: notes ?? null,
  }).in('id', featureIds).eq('dataset_id', datasetId);

  if (error) return { error: error.message };

  if (action === 'approve') {
    const { data: remaining } = await supabase.from('spatial_staged_features')
      .select('id').eq('dataset_id', datasetId).eq('operator_status', 'pending');
    if (!remaining?.length) {
      await supabase.from('spatial_datasets')
        .update({ status: 'published', published_at: now, updated_at: now })
        .eq('id', datasetId);
    }
  }

  revalidatePath('/spatial/staging');
  return { success: true };
}
