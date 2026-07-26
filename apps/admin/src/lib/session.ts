import { createClient } from '@/lib/supabase/server';
import { createApiClient } from '@moments/api';
import type { AdminSession } from '@moments/api';

/**
 * Server-only. Reads the current Supabase session and loads the admin role
 * via packages/api. Returns null if unauthenticated or role not found.
 *
 * Call once per layout/page render. Never call from client components.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return null;

  try {
    const api = createApiClient({
      baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1',
      token: session.access_token,
    });

    const authSession = await api.auth.me(session.access_token);

    return {
      userId: authSession.userId,
      email: authSession.email,
      name: null, // populated by /auth/me Edge Function when user_profiles is built
      role: authSession.role,
    };
  } catch {
    // Role lookup failed — return minimal session from JWT claims only
    // This is intentionally fail-open for the shell; Edge Functions enforce roles
    return {
      userId: session.user.id,
      email: session.user.email ?? '',
      name: null,
      role: 'viewer',
    };
  }
}
