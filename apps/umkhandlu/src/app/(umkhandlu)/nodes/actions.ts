'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { getOperatorSession, isSuperAdmin } from '@/lib/auth/operator';

async function requireSuperAdmin() {
  const session = await getOperatorSession();
  if (!isSuperAdmin(session)) throw new Error('Forbidden');
  return session;
}

export async function addNodeAction(formData: FormData) {
  await requireSuperAdmin();
  const supabase = createServiceClient();

  const name             = formData.get('name') as string;
  const authority        = formData.get('authority') as string;
  const location         = formData.get('location') as string;
  const url              = formData.get('url') as string;
  const api_key          = formData.get('api_key') as string;
  const contract_version = (formData.get('contract_version') as string) || '1.0';
  const notes            = formData.get('notes') as string;

  if (!name || !authority || !url || !api_key) {
    return { error: 'Name, authority, URL and API key are required.' };
  }

  const { error } = await supabase.from('governance_nodes').insert({
    name, authority, location, url, api_key, contract_version,
    notes: notes || null,
    capabilities: [],
    active: true,
  });

  if (error) return { error: error.message };
  revalidatePath('/nodes');
  return { success: true };
}

export async function toggleNodeAction(id: string, active: boolean) {
  await requireSuperAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('governance_nodes')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/nodes');
  return { success: true };
}

export async function deleteNodeAction(id: string) {
  await requireSuperAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from('governance_nodes').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/nodes');
  return { success: true };
}
