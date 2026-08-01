import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logAudit } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/settings\/?/, '').split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && parts[0] === 'flags') return await listFlags(req, cors);
    if (req.method === 'POST' && parts[0] === 'flags' && parts[1]) return await updateFlag(req, cors, parts[1]);
    if (req.method === 'GET' && parts[0] === 'system') return await listSystemSettings(req, cors);
    if (req.method === 'POST' && parts[0] === 'system' && parts[1]) return await updateSystemSetting(req, cors, parts[1]);
    if (req.method === 'GET' && parts[0] === 'audit-logs') return await auditLogs(req, cors);
    if (req.method === 'GET' && parts[0] === 'error-logs') return await errorLogs(req, cors);
    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await supabase.from('error_logs').insert({
      error_type: 'settings_function',
      error_message: (e as Error).message,
      context: { url: req.url },
      severity: 'medium',
    });
    return err('Internal server error', 500, cors);
  }
});

async function listFlags(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from('feature_flags')
    .select('flag_key, enabled, description, updated_at')
    .order('flag_key');

  if (error) return err(error.message, 500, cors);
  return json(data ?? [], 200, cors);
}

async function updateFlag(req: Request, cors: Record<string, string>, flagKey: string) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const body = await req.json().catch(() => ({}));
  if (typeof body.enabled !== 'boolean') return err('enabled (boolean) required', 400, cors);

  const { data, error } = await supabase
    .from('feature_flags')
    .update({ enabled: body.enabled })
    .eq('flag_key', flagKey)
    .select('flag_key, enabled, description, updated_at')
    .single();

  if (error) return err(error.message, 500, cors);
  await logAudit(supabase, context.userId, 'update', 'feature_flag', flagKey, { enabled: body.enabled });
  return json(data, 200, cors);
}

async function listSystemSettings(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value, description, updated_at')
    .order('setting_key');

  if (error) return err(error.message, 500, cors);
  return json(data ?? [], 200, cors);
}

async function updateSystemSetting(req: Request, cors: Record<string, string>, settingKey: string) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const body = await req.json().catch(() => ({}));
  if (typeof body.value !== 'string') return err('value (string) required', 400, cors);

  const { data, error } = await supabase
    .from('system_settings')
    .update({ setting_value: body.value })
    .eq('setting_key', settingKey)
    .select('setting_key, setting_value, description, updated_at')
    .single();

  if (error) return err(error.message, 500, cors);
  await logAudit(supabase, context.userId, 'update', 'system_setting', settingKey, { value: body.value });
  return json(data, 200, cors);
}

async function auditLogs(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.resourceType) query = query.eq('resource_type', params.resourceType);
  if (params.userId) query = query.eq('user_id', params.userId);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  return json({
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function errorLogs(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('error_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.severity) query = query.eq('severity', params.severity);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  return json({
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}
