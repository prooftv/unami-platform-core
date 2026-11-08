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
    created_by: session.email,
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
