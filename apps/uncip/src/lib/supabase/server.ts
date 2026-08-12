import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { UNCIP_ENV } from '@/lib/env';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    UNCIP_ENV.supabaseUrl,
    UNCIP_ENV.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookies are read-only, middleware handles refresh
          }
        },
      },
    },
  );
}

/**
 * Service-role client for admin operations (e.g. inviteUserByEmail).
 * Server-only. Never expose to the browser.
 */
export function createServiceClient() {
  const serviceKey = process.env.UNCIP_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('[UNCIP] Missing UNCIP_SUPABASE_SERVICE_ROLE_KEY');
  return createServerClient(
    UNCIP_ENV.supabaseUrl,
    serviceKey,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}
