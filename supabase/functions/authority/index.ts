import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logError } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/authority\/?/, '').split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && parts.length === 0) return await listAuthority(req, cors);
    if (req.method === 'GET' && parts[0] === 'stats') return await authorityStats(req, cors);
    if (req.method === 'GET' && parts[0] === 'audit') return await auditLog(req, cors);
    if (req.method === 'GET' && parts.length === 1) return await getAuthority(req, parts[0], cors);
    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await logError(supabase, 'authority_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

async function listAuthority(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('authority_profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.status) query = query.eq('status', params.status);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  return json({
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function getAuthority(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase.from('authority_profiles').select('*').eq('id', id).single();
  if (error) return err('Authority profile not found', 404, cors);
  return json(data, 200, cors);
}

async function auditLog(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '10')));
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('authority_audit_log')
    .select('*, authority_profiles(authority_level, scope)', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return err(error.message, 500, cors);

  const mapped = (data ?? []).map((row: Record<string, unknown>) => {
    const profile = row.authority_profiles as Record<string, unknown> | null;
    const context = (row.context ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      authorityId: row.authority_profile_id,
      actionType: row.action,
      authorityLevel: profile?.authority_level ?? null,
      scope: profile?.scope ?? null,
      blastRadiusApplied: context.blast_radius_applied ?? 0,
      performedAt: row.timestamp,
    };
  });

  return json({
    data: mapped,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function authorityStats(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [totalRes, activeRes, levelRes, todayRes, weekRes] = await Promise.all([
    supabase.from('authority_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('authority_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('authority_profiles').select('authority_level').eq('status', 'active'),
    supabase.from('authority_audit_log').select('id', { count: 'exact', head: true }).gte('timestamp', today.toISOString()),
    supabase.from('authority_audit_log').select('id', { count: 'exact', head: true }).gte('timestamp', sevenDaysAgo),
  ]);

  const byLevel: Record<string, number> = {};
  for (const row of levelRes.data ?? []) {
    const l = String(row.authority_level);
    byLevel[l] = (byLevel[l] ?? 0) + 1;
  }

  return json({
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    byLevel,
    actionsToday: todayRes.count ?? 0,
    actionsLast7d: weekRes.count ?? 0,
  }, 200, cors);
}
