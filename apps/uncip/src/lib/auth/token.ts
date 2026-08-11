'use client';

/**
 * Client-side only. Returns the current session access token.
 * FOUNDATION PHASE: Returns empty string — no real auth yet.
 * AUTH PHASE: Replace with Supabase client getSession().
 */
export async function getToken(): Promise<string> {
  // TODO(auth-phase): Replace with Supabase createBrowserClient().auth.getSession()
  return '';
}
