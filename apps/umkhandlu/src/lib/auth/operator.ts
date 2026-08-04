import { createClient } from '@/lib/supabase/server';

// Control Centre operator session — read directly from Supabase Auth.
// Role is stored in user_metadata.role. Defaults to 'operator'.
// To grant super_admin: set user_metadata.role = 'super_admin' in Supabase Auth dashboard.
export type OperatorRole = 'super_admin' | 'operator';

export type OperatorSession = {
  id: string;
  email: string;
  name: string | null;
  role: OperatorRole;
};

export async function getOperatorSession(): Promise<OperatorSession | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const rawRole = user.app_metadata?.role ?? user.user_metadata?.role;
  const role: OperatorRole = rawRole === 'super_admin' ? 'super_admin' : 'operator';
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata?.full_name ?? null,
    role,
  };
}

export function isSuperAdmin(session: OperatorSession | null): boolean {
  return session?.role === 'super_admin';
}
