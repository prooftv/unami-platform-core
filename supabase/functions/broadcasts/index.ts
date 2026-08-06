import { requireAuth, corsHeaders, json, err, logError } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/broadcasts\/?/, '').split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && parts.length === 0) return await listBroadcasts(req, cors);
    if (req.method === 'GET' && parts.length === 1) return await getBroadcast(req, parts[0], cors);
    return err('Not found', 404, cors);
  } catch (e) {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.50.0');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await logError(supabase, 'broadcasts_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

async function listBroadcasts(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('broadcasts')
    .select('*, moments(id, title, region, category)', { count: 'exact' })
    .order('broadcast_started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.momentId) query = query.eq('moment_id', params.momentId);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  const mapped = (data ?? []).map((b: Record<string, unknown>) => ({
    id: b.id,
    momentId: b.moment_id,
    campaignId: b.campaign_id,
    recipientCount: b.recipient_count,
    successCount: b.success_count,
    failureCount: b.failure_count,
    status: b.status,
    broadcastStartedAt: b.broadcast_started_at,
    broadcastCompletedAt: b.broadcast_completed_at,
    moment: b.moments,
  }));

  return json({
    data: mapped,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function getBroadcast(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from('broadcasts')
    .select('*, moments(id, title, region, category)')
    .eq('id', id)
    .single();

  if (error) return err('Broadcast not found', 404, cors);

  return json({
    id: data.id,
    momentId: data.moment_id,
    campaignId: data.campaign_id,
    recipientCount: data.recipient_count,
    successCount: data.success_count,
    failureCount: data.failure_count,
    status: data.status,
    broadcastStartedAt: data.broadcast_started_at,
    broadcastCompletedAt: data.broadcast_completed_at,
    moment: data.moments,
  }, 200, cors);
}
