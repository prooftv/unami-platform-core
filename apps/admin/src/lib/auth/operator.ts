import { createClient } from '@/lib/supabase/server';
import { createApiClient } from '@moments/api';
import type { AdminSession } from '@moments/api';

/**
 * The authenticated operator context used throughout the admin application.
 * Identical to AdminSession — aliased here for clarity at the call site.
 */
export type OperatorSession = AdminSession;

/**
 * Server-only. Validates the current session and loads the operator's role
 * and authority_id via the API boundary (packages/api → /auth/me Edge Function).
 *
 * Returns null if unauthenticated.
 * Never throws — role lookup failure falls back to viewer.
 *
 * Call once per layout render. Never call from client components.
 */
export async function getOperatorSession(): Promise<OperatorSession | null> {
  const supabase = await createClient();

  // getUser() validates the JWT server-side — required per security model
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Retrieve the access token for the API call
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
