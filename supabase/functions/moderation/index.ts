import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logAudit, logError } from '../_shared/auth.ts';

function maskPhone(phone: string): string {
  if (phone.length <= 4) return '****';
  return phone.slice(0, 3) + '...' + phone.slice(-4);
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/moderation\/?/, '').split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && parts[0] === 'stats') return await moderationStats(req, cors);
    if (req.method === 'GET' && parts[0] === 'messages' && parts.length === 1) return await listMessages(req, cors);
    if (req.method === 'GET' && parts[0] === 'advisories' && parts.length === 1) return await listAdvisories(req, cors);
    if (req.method === 'POST' && parts[0] === 'messages' && parts[2] === 'approve') return await approveMessage(req, parts[1], cors);
    if (req.method === 'POST' && parts[0] === 'messages' && parts[2] === 'reject') return await rejectMessage(req, parts[1], cors);
    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await logError(supabase, 'moderation_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

async function listMessages(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.status) query = query.eq('moderation_status', params.status);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  const masked = (data ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    from_number: maskPhone(m.from_number as string),
  }));

  return json({
    data: masked,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function listAdvisories(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('advisories')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.escalated === 'true') query = query.eq('escalation_suggested', true);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  return json({
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function moderationStats(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [pendingRes, escalatedRes, approvedRes, rejectedRes, oldestRes, avgRes] = await Promise.all([
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
    supabase.from('advisories').select('id', { count: 'exact', head: true }).eq('escalation_suggested', true),
    supabase.from('moderation_audit').select('id', { count: 'exact', head: true }).eq('action', 'approved').gte('created_at', todayIso),
    supabase.from('moderation_audit').select('id', { count: 'exact', head: true }).eq('action', 'rejected').gte('created_at', todayIso),
    supabase.from('messages').select('created_at').eq('moderation_status', 'pending').order('created_at', { ascending: true }).limit(1),
    supabase.from('moderation_audit').select('timestamp').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(100),
  ]);

  const oldestPendingAge = oldestRes.data?.[0]
    ? Math.round((Date.now() - new Date(oldestRes.data[0].created_at).getTime()) / 60000)
    : null;

  const avgReviewTime7d = avgRes.data && avgRes.data.length > 1
    ? Math.round(
        avgRes.data.slice(1).reduce((sum: number, row: Record<string, string>, i: number) => {
          const prev = new Date(avgRes.data![i].timestamp).getTime();
          const curr = new Date(row.timestamp).getTime();
          return sum + (curr - prev) / 60000;
        }, 0) / (avgRes.data.length - 1)
      )
    : null;

  return json({
    pendingMessages: pendingRes.count ?? 0,
    escalatedAdvisories: escalatedRes.count ?? 0,
    approvedToday: approvedRes.count ?? 0,
    rejectedToday: rejectedRes.count ?? 0,
    oldestPendingAge,
    avgReviewTime7d,
  }, 200, cors);
}

async function approveMessage(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const { data, error } = await supabase
    .from('messages')
    .update({ moderation_status: 'approved' })
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);

  await supabase.from('moderation_audit').insert({
    message_id: id,
    action: 'approved',
    moderator: context.userId,
  });

  await logAudit(supabase, context.userId, 'approve', 'message', id);
  return json({ ...data, from_number: maskPhone(data.from_number) }, 200, cors);
}

async function rejectMessage(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const { data, error } = await supabase
    .from('messages')
    .update({ moderation_status: 'rejected' })
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);

  await supabase.from('moderation_audit').insert({
    message_id: id,
    action: 'rejected',
    moderator: context.userId,
  });

  await logAudit(supabase, context.userId, 'reject', 'message', id);
  return json({ ...data, from_number: maskPhone(data.from_number) }, 200, cors);
}
