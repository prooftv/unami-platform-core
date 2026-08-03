'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Client-side only. Returns the current session access token.
 * Used by client components that need to call the API directly (mutations).
 * Returns empty string if no session — callers should handle gracefully.
 */
export async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}
