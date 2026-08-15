'use server';

import { getOperatorSession, isSuperAdmin } from '@/lib/auth/operator';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const SERVICE_KEY = process.env.UMKHANDLU_SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ADMIN_BASE = new URL('/auth/v1/admin', process.env.NEXT_PUBLIC_UMKHANDLU_SUPABASE_URL!).toString();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUUID(value: string): void {
  if (!UUID_RE.test(value)) throw new Error('Invalid user ID');
}

async function adminFetch(path: string, options: RequestInit) {
  const url = new URL(path, SUPABASE_ADMIN_BASE + '/').toString();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      ...(options.headers ?? {}),
    },
  });
  return res;
}

export async function updateProfileAction(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name') as string;
  const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
  if (error) return { error: error.message };
  revalidatePath('/settings');
  return { success: true };
}

export async function inviteOperatorAction(_: unknown, formData: FormData) {
  const session = await getOperatorSession();
  if (!isSuperAdmin(session)) return { error: 'Insufficient permissions' };

  const email = formData.get('email') as string;
  const role  = formData.get('role') as string;

  const res = await adminFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      email_confirm: true,
      app_metadata: { role: role === 'super_admin' ? 'super_admin' : 'operator' },
    }),
  });

  if (!res.ok) {
    const body = await res.json();
    return { error: body.msg ?? body.message ?? 'Failed to invite operator' };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function updateOperatorRoleAction(_: unknown, formData: FormData) {
  const session = await getOperatorSession();
  if (!isSuperAdmin(session)) return { error: 'Insufficient permissions' };

  const userId = formData.get('userId') as string;
  assertUUID(userId);
  const role   = formData.get('role') as string;

  const res = await adminFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ app_metadata: { role } }),
  });

  if (!res.ok) {
    const body = await res.json();
    return { error: body.msg ?? body.message ?? 'Failed to update role' };
  }

  revalidatePath('/settings');
  return { success: true };
}

export async function removeOperatorAction(_: unknown, formData: FormData) {
  const session = await getOperatorSession();
  if (!isSuperAdmin(session)) return { error: 'Insufficient permissions' };

  const userId = formData.get('userId') as string;
  assertUUID(userId);
  if (userId === session!.id) return { error: 'Cannot remove yourself' };

  const res = await adminFetch(`/users/${userId}`, { method: 'DELETE' });

  if (!res.ok) {
    const body = await res.json();
    return { error: body.msg ?? body.message ?? 'Failed to remove operator' };
  }

  revalidatePath('/settings');
  return { success: true };
}
