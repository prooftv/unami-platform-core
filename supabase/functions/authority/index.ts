import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { z } from 'https://esm.sh/zod@3';
import { requireAuth, corsHeaders, json, err, logAudit, logError } from '../_shared/auth.ts';

const AuthorityScope = ['community', 'region', 'province', 'national'] as const;
const ApprovalMode = ['admin_review', 'ai_review', 'auto'] as const;

const CreateAuthoritySchema = z.object({
  user_identifier: z.string().min(1),
  authority_level: z.coerce.number().int().min(1).max(5),
  role_label: z.string().min(1).max(100),
  scope: z.enum(AuthorityScope),
  scope_identifier: z.string().nullable().default(null),
  approval_mode: z.enum(ApprovalMode).default('admin_review'),
  blast_radius: z.coerce.number().int().min(1).max(10000).default(100),
  risk_threshold: z.coerce.number().min(0.1).max(0.9).default(0.7),
  valid_until: z.string().datetime().nullable().default(null),
});

const UpdateAuthoritySchema = CreateAuthoritySchema.omit({ user_identifier: true }).partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: 'At least one field required' },
);

const SuspendSchema = z.object({ reason: z.string().min(1).max(500) });

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
    if (req.method === 'POST' && parts.length === 0) return await createAuthority(req, cors);
    if (req.method === 'PUT' && parts.length === 1) return await updateAuthority(req, parts[0], cors);
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'suspend') return await suspendAuthority(req, parts[0], cors);
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

async function createAuthority(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const body = await req.json();
  const parsed = CreateAuthoritySchema.safeParse(body);
  if (!parsed.success) return json({ error: 'Validation failed', details: parsed.error.flatten() }, 400, cors);

  const { data, error } = await supabase
    .from('authority_profiles')
    .insert({ ...parsed.data, created_by: context.userId, status: 'active' })
    .select()
    .single();

  if (error) return err(error.message, 500, cors);

  await supabase.from('authority_audit_log').insert({
    authority_profile_id: data.id,
    action: 'created',
    actor_id: context.userId,
    context: { blast_radius_applied: data.blast_radius },
  });

  await logAudit(supabase, context.userId, 'create', 'authority_profile', data.id, parsed.data);
  return json(data, 201, cors);
}

async function updateAuthority(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const { data: existing } = await supabase.from('authority_profiles').select('status').eq('id', id).single();
  if (!existing) return err('Authority profile not found', 404, cors);

  const body = await req.json();
  const parsed = UpdateAuthoritySchema.safeParse(body);
  if (!parsed.success) return json({ error: 'Validation failed', details: parsed.error.flatten() }, 400, cors);

  const { data, error } = await supabase
    .from('authority_profiles')
    .update({ ...parsed.data, updated_by: context.userId })
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);

  await supabase.from('authority_audit_log').insert({
    authority_profile_id: id,
    action: 'updated',
    actor_id: context.userId,
    context: { changes: parsed.data },
  });

  await logAudit(supabase, context.userId, 'update', 'authority_profile', id, parsed.data);
  return json(data, 200, cors);
}

async function suspendAuthority(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const { data: existing } = await supabase.from('authority_profiles').select('status').eq('id', id).single();
  if (!existing) return err('Authority profile not found', 404, cors);
  if (existing.status === 'suspended') return err('Authority profile is already suspended', 409, cors);

  const body = await req.json();
  const parsed = SuspendSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'Validation failed', details: parsed.error.flatten() }, 400, cors);

  const { data, error } = await supabase
    .from('authority_profiles')
    .update({ status: 'suspended', updated_by: context.userId })
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);

  await supabase.from('authority_audit_log').insert({
    authority_profile_id: id,
    action: 'suspended',
    actor_id: context.userId,
    context: { reason: parsed.data.reason },
  });

  await logAudit(supabase, context.userId, 'suspend', 'authority_profile', id, { reason: parsed.data.reason });
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
    const ctx = (row.context ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      authorityId: row.authority_profile_id,
      actionType: row.action,
      authorityLevel: profile?.authority_level ?? null,
      scope: profile?.scope ?? null,
      blastRadiusApplied: ctx.blast_radius_applied ?? 0,
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
