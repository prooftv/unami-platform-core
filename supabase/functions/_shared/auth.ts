import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type AdminRole = 'superadmin' | 'content_admin' | 'moderator' | 'viewer';

export interface AuthContext {
  userId: string;
  role: AdminRole;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = [
    Deno.env.get('ADMIN_URL') ?? '',
    Deno.env.get('WEB_URL') ?? '',
  ].filter(Boolean);
  return {
    ...CORS_HEADERS,
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : (allowed[0] ?? ''),
  };
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function err(message: string, status: number, headers: Record<string, string> = {}) {
  return json({ error: message }, status, headers);
}

export async function requireAuth(
  req: Request,
  allowedRoles: AdminRole[],
): Promise<{ context: AuthContext; supabase: ReturnType<typeof createClient> } | Response> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return err('Unauthorized', 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return err('Unauthorized', 401);

  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const role = (roleData?.role ?? 'viewer') as AdminRole;
  if (!allowedRoles.includes(role)) return err('Forbidden', 403);

  return { context: { userId: user.id, role }, supabase };
}

export async function logAudit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  changes?: unknown,
) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    changes: changes ?? null,
  });
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

const RATE_LIMITS: Record<string, { windowMs: number; max: number }> = {
  '/webhook':       { windowMs: 60_000, max: 1000 },
  '/moments':       { windowMs: 60_000, max: 60 },
  '/broadcast':     { windowMs: 60_000, max: 10 },
  '/analytics':     { windowMs: 60_000, max: 30 },
  '/auth':          { windowMs: 60_000, max: 5 },
  '/participation': { windowMs: 60_000, max: 20 },
  '/evidence':      { windowMs: 60_000, max: 30 },
  '/media':         { windowMs: 60_000, max: 20 },
  '/campaigns':     { windowMs: 60_000, max: 60 },
  '/sponsors':      { windowMs: 60_000, max: 60 },
  '/subscribers':   { windowMs: 60_000, max: 60 },
  '/moderation':    { windowMs: 60_000, max: 60 },
  '/authority':     { windowMs: 60_000, max: 60 },
  '/broadcasts':    { windowMs: 60_000, max: 60 },
  '/settings':      { windowMs: 60_000, max: 30 },
  '/retry-batches': { windowMs: 60_000, max: 5 },
};

export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  endpoint: string,
): Promise<Response | null> {
  const limit = RATE_LIMITS[endpoint];
  if (!limit) return null;

  const now = new Date();
  const windowStart = new Date(now.getTime() - limit.windowMs);

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('id, request_count, window_start')
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .single();

  if (!existing || new Date(existing.window_start) < windowStart) {
    // New window — upsert with count 1
    await supabase.from('rate_limits').upsert(
      { identifier, endpoint, request_count: 1, window_start: now.toISOString() },
      { onConflict: 'identifier,endpoint' },
    );
    return null;
  }

  if (existing.request_count >= limit.max) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  await supabase
    .from('rate_limits')
    .update({ request_count: existing.request_count + 1 })
    .eq('id', existing.id);

  return null;
}

export async function logError(
  supabase: ReturnType<typeof createClient>,
  errorType: string,
  errorMessage: string,
  context?: unknown,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
) {
  await supabase.from('error_logs').insert({
    error_type: errorType,
    error_message: errorMessage,
    context: context ?? null,
    severity,
  });
}
