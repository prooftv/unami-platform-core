import { createClient } from '@/lib/supabase/server';
import { createApiClient } from '@unami/api';
import type { AdminSession } from '@unami/api';

export type OperatorSession = AdminSession;

export async function getOperatorSession(): Promise<OperatorSession | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const api = createApiClient({
      baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1',
      token: session.access_token,
    });

    const authSession = await api.auth.me();

    return {
      id: authSession.id,
      email: authSession.email,
      name: null,
      role: authSession.role,
      authority_id: authSession.authority_id,
    };
  } catch {
    return null;
  }
}
