import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

export type UNCIPRole = 'admin' | 'parent' | 'school' | 'authority' | 'community';

export interface UNCIPProfile {
  id: string;
  email: string;
  name: string | null;
  role: UNCIPRole;
  station_id: string | null;
  school_id: string | null;
  is_active: boolean;
}

export interface UNCIPAuthContext {
  profile: UNCIPProfile;
  supabase: ReturnType<typeof createClient>;
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = [
    Deno.env.get('UNCIP_URL') ?? '',
    Deno.env.get('ADMIN_URL') ?? '',
  ].filter(Boolean);
  return {
    ...CORS_HEADERS,
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : (allowed[0] ?? ''),
  };
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function err(
  message: string,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return json({ error: message }, status, headers);
}

// ---------------------------------------------------------------------------
// requireUNCIPAuth
// Resolves the authenticated Supabase user and their UNCIP profile.
// Never accepts role/stationId/schoolId from the request body or query string.
// Returns UNCIPAuthContext or a Response (caller must return the Response).
// ---------------------------------------------------------------------------

export async function requireUNCIPAuth(
  req: Request,
  allowedRoles?: UNCIPRole[],
): Promise<UNCIPAuthContext | Response> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return err('Unauthorized', 401);

  // Use service role to resolve the user — then switch to anon client for
  // data operations so RLS applies correctly.
  const service = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error: userError } = await service.auth.getUser(token);
  if (userError || !user) return err('Unauthorized', 401);

  const { data: profile, error: profileError } = await service
    .from('uncip_user_profiles')
    .select('id, email, name, role, station_id, school_id, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return err('UNCIP profile not found', 403);
  if (!profile.is_active) return err('Account is inactive', 403);
  if (allowedRoles && !allowedRoles.includes(profile.role as UNCIPRole)) {
    return err('Forbidden', 403);
  }

  // Data client uses the user's JWT so RLS policies apply
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  return { profile: profile as UNCIPProfile, supabase };
}
