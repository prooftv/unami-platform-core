'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getOperatorSession } from '@/lib/auth/operator';

// Statutory notice types — these auto-set is_statutory = true
const STATUTORY_TYPES = new Set([
  'eia', 'rezoning', 'land-use', 'township', 'building', 'mining', 'liquor', 'telecom',
]);

async function requireOperator() {
  const session = await getOperatorSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function createNoticeAction(formData: FormData) {
  const session = await requireOperator();
  const supabase = await createClient();

  const type             = formData.get('type') as string;
  const title            = formData.get('title') as string;
  const content          = formData.get('content') as string;
  const status           = (formData.get('status') as string) || 'draft';
  const comment_deadline = formData.get('comment_deadline') as string;
  const ward_ref         = formData.get('ward_ref') as string;
  const latitude         = formData.get('latitude') as string;
  const longitude        = formData.get('longitude') as string;

  if (!type || !title || !content) {
    return { error: 'Type, title and content are required.' };
  }

  const { data, error } = await supabase.from('notices').insert({
    type, title, content, status,
    is_statutory: STATUTORY_TYPES.has(type),
    comment_deadline: comment_deadline || null,
    ward_ref: ward_ref || null,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    created_by: session.name ?? 'Operator',
  }).select().single();

  if (error) return { error: error.message };

  await supabase.from('gis_audit_log').insert({
    table_name: 'notices',
    record_id: data.id,
    actor: session.email,
    action: 'create',
    previous_state: null,
    new_state: data,
  });

  revalidatePath('/notices');
  return { success: true, id: data.id };
}

export async function updateNoticeAction(id: string, formData: FormData) {
  const session = await requireOperator();
  const supabase = await createClient();

  const { data: prev } = await supabase.from('notices').select('*').eq('id', id).single();

  const type             = formData.get('type') as string;
  const comment_deadline = formData.get('comment_deadline') as string;
  const ward_ref         = formData.get('ward_ref') as string;
  const latitude         = formData.get('latitude') as string;
  const longitude        = formData.get('longitude') as string;

  const { data, error } = await supabase.from('notices').update({
    type,
    title:            formData.get('title') as string,
    content:          formData.get('content') as string,
    status:           formData.get('status') as string,
    is_statutory:     STATUTORY_TYPES.has(type),
    comment_deadline: comment_deadline || null,
    ward_ref:         ward_ref || null,
    latitude:         latitude ? parseFloat(latitude) : null,
    longitude:        longitude ? parseFloat(longitude) : null,
    updated_at:       new Date().toISOString(),
  }).eq('id', id).select().single();

  if (error) return { error: error.message };

  await supabase.from('gis_audit_log').insert({
    table_name: 'notices',
    record_id: id,
    actor: session.email,
    action: 'update',
    previous_state: prev,
    new_state: data,
  });

  revalidatePath('/notices');
  revalidatePath(`/notices/${id}`);
  return { success: true };
}

export async function publishNoticeAction(id: string) {
  const session = await requireOperator();
  const supabase = createServiceClient();

  const { data: prev } = await supabase.from('notices').select('*').eq('id', id).single();
  if (!prev) return { error: 'Notice not found.' };

  const newStatus = prev.is_statutory ? 'open' : 'published';

  const { error } = await supabase.from('notices')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  await supabase.from('gis_audit_log').insert({
    table_name: 'notices',
    record_id: id,
    actor: session.email,
    action: 'publish',
    previous_state: prev,
    new_state: { ...prev, status: newStatus },
  });

  revalidatePath('/notices');
  revalidatePath(`/notices/${id}`);
  return { success: true };
}

export async function closeNoticeAction(id: string) {
  const session = await requireOperator();
  const supabase = createServiceClient();

  const { error } = await supabase.from('notices')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  await supabase.from('gis_audit_log').insert({
    table_name: 'notices',
    record_id: id,
    actor: session.email,
    action: 'archive',
    previous_state: null,
    new_state: { status: 'closed' },
  });

  revalidatePath('/notices');
  revalidatePath(`/notices/${id}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Spatial feature search — for the Notice site feature association UI
// ---------------------------------------------------------------------------

export async function searchApprovedFeaturesAction(
  query: string,
  datasetId?: string,
) {
  await requireOperator();
  const supabase = createServiceClient();

  // Build a query against approved features with their dataset names
  let q = supabase
    .from('spatial_staged_features')
    .select('id, dataset_id, feature_properties, feature_geojson, spatial_datasets(name, source_id, spatial_sources(institution))')
    .eq('operator_status', 'approved')
    .limit(20);

  if (datasetId) {
    q = q.eq('dataset_id', datasetId);
  }

  const { data, error } = await q;
  if (error) return { error: error.message };

  const rows = (data ?? []).map((row) => {
    const props = (row.feature_properties ?? {}) as Record<string, unknown>;
    const nameKeys = ['name', 'NAME', 'Name', 'title', 'TITLE', 'label', 'LABEL', 'NAMECODE', 'MUNICNAME'];
    let featureName = '';
    for (const k of nameKeys) {
      if (props[k]) { featureName = String(props[k]); break; }
    }
    if (!featureName) {
      featureName = Object.entries(props).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ');
    }
    const ds = Array.isArray(row.spatial_datasets) ? row.spatial_datasets[0] : row.spatial_datasets;
    const src = ds && !Array.isArray(ds.spatial_sources) ? ds.spatial_sources : null;
    const geom = row.feature_geojson as { type?: string } | null;
    return {
      id: row.id,
      featureName: featureName || '(unnamed feature)',
      datasetId: row.dataset_id,
      datasetName: (ds as { name?: string } | null)?.name ?? 'Unknown dataset',
      institution: (src as { institution?: string } | null)?.institution ?? '',
      geometryType: geom?.type ?? 'Unknown',
    };
  });

  // Filter by query string if provided
  const filtered = query.trim()
    ? rows.filter((r) =>
        r.featureName.toLowerCase().includes(query.toLowerCase()) ||
        r.datasetName.toLowerCase().includes(query.toLowerCase())
      )
    : rows;

  return { features: filtered };
}

// ---------------------------------------------------------------------------
// Associate an approved spatial feature with a notice
// ---------------------------------------------------------------------------

export async function associateNoticeSiteFeatureAction(
  noticeId: string,
  featureId: string,
) {
  const session = await requireOperator();
  const supabase = createServiceClient();

  // Use the SECURITY DEFINER function from migration 016
  const { data, error } = await supabase.rpc('associate_notice_site_feature', {
    p_notice_id:   noticeId,
    p_feature_id:  featureId,
    p_operator_id: session.email,
  });

  if (error) return { error: error.message };

  revalidatePath(`/notices/${noticeId}`);
  return { success: true, result: data };
}

// ---------------------------------------------------------------------------
// Remove spatial feature association from a notice
// ---------------------------------------------------------------------------

export async function removeNoticeSiteFeatureAction(noticeId: string) {
  const session = await requireOperator();
  const supabase = createServiceClient();

  const { data: prev } = await supabase
    .from('notices')
    .select('site_feature_id')
    .eq('id', noticeId)
    .single();

  const { error } = await supabase.from('notices').update({
    site_feature_id:            null,
    site_feature_associated_at: null,
    site_feature_associated_by: null,
    updated_at:                 new Date().toISOString(),
  }).eq('id', noticeId);

  if (error) return { error: error.message };

  await supabase.from('gis_audit_log').insert({
    table_name: 'notices',
    record_id:  noticeId,
    actor:      session.email,
    action:     'update',
    previous_state: { site_feature_id: prev?.site_feature_id },
    new_state:      { site_feature_id: null },
    reason:         'Operator removed spatial feature association',
  });

  revalidatePath(`/notices/${noticeId}`);
  return { success: true };
}
