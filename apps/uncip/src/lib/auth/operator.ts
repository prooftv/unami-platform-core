/**
 * Server-only. Returns the current UNCIP session from Supabase Auth.
 *
 * Resolves the authenticated user via getUser() (JWT-validated server-side),
 * then loads their UNCIP profile from uncip_user_profiles.
 *
 * Returns null if unauthenticated or profile not found.
 * Never throws.
 */

import { createClient } from '@/lib/supabase/server';
import { createUNCIPApiClient } from '@unami/api';
import { UNCIP_ENV } from '@/lib/env';
import type { UNCIPSession } from '@/domain/uncip/types';

export type { UNCIPSession };

export async function getUNCIPSession(): Promise<UNCIPSession | null> {
  try {
    const supabase = await createClient();

    // getUser() validates the JWT server-side — required per security model
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    // TEMP DIAGNOSTIC
    console.log('[UNCIP][getUNCIPSession] getUser:', { userId: user?.id ?? null, error: userError?.message ?? null });
    if (!user) return null;

    // Load UNCIP profile directly from the database via the anon client
    // (RLS allows users to read their own profile row)
    const { data: profile, error } = await supabase
      .from('uncip_user_profiles')
      .select('id, email, name, role, station_id, school_id, is_active')
      .eq('id', user.id)
      .single();

    // TEMP DIAGNOSTIC
    console.log('[UNCIP][getUNCIPSession] profile:', { found: !!profile, active: profile?.is_active ?? null, error: error?.message ?? null, code: error?.code ?? null });

    if (error || !profile || !profile.is_active) return null;

    return {
      id:        profile.id,
      email:     profile.email,
      name:      profile.name ?? null,
      role:      profile.role,
      stationId: profile.station_id ?? null,
      schoolId:  profile.school_id ?? null,
    };
  } catch (e) {
    // TEMP DIAGNOSTIC
    console.log('[UNCIP][getUNCIPSession] caught exception:', e instanceof Error ? e.message : String(e));
    return null;
  }
}

/**
 * Returns an authenticated UNCIP API client for the current session.
 * Use in Server Components and Server Actions only.
 * Returns null if unauthenticated.
 */
export async function getUNCIPClient() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    return createUNCIPApiClient({
      baseUrl: UNCIP_ENV.supabaseUrl + '/functions/v1',
      token:   session.access_token,
    });
  } catch {
    return null;
  }
}
