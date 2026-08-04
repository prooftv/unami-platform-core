import { createClient } from '@/lib/supabase/server';

// Control Centre operator session — read directly from Supabase Auth.
// No admin_roles table or Edge Function dependency in Phase 18B.
// All authenticated users are operators. Role expansion in Phase 18C.
export type OperatorSession = {
  id: string;
  email: string;
  name: string | null;
  role: 'operator';
};

export async function getOperatorSession(): Promise<OperatorSession | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata?.full_name ?? null,
    role: 'operator',
  };
}
