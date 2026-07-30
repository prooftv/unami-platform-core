import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logError } from '../_shared/auth.ts';

// Mask phone number per POPIA — show only last 4 digits
function maskPhone(phone: string): string {
  if (phone.length <= 4) return '****';
  return phone.slice(0, 3) + '...' + phone.slice(-4);
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/subscribers\/?/, '').split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && parts.length === 0) return await listSubscribers(req, cors);
    if (req.method === 'GET' && parts[0] === 'stats') return await subscriberStats(req, cors);
    if (req.method === 'GET' && parts.length === 1) return await getSubscriber(req, parts[0], cors);
    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await logError(supabase, 'subscribers_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

async function listSubscribers(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('subscriptions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.opted_in !== undefined) query = query.eq('opted_in', params.opted_in === 'true');
  if (params.region) query = query.contains('regions', [params.region]);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  // Mask phone numbers — POPIA
  const masked = (data ?? []).map((s: Record<string, unknown>) => ({
    ...s,
    phone_number: maskPhone(s.phone_number as string),
  }));

  return json({
    data: masked,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function getSubscriber(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase.from('subscriptions').select('*').eq('id', id).single();
  if (error) return err('Subscriber not found', 404, cors);

  return json({ ...data, phone_number: maskPhone(data.phone_number) }, 200, cors);
}

async function subscriberStats(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const [totalRes, activeRes, optedOutRes, todayRes, scheduleRes, regionRes] = await Promise.all([
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('opted_in', true),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('opted_in', false),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true })
      .eq('opted_in', true)
      .gte('opted_in_at', new Date(Date.now() - 86400000).toISOString()),
    supabase.from('subscriptions').select('delivery_schedule').eq('opted_in', true),
    supabase.from('subscriptions').select('regions').eq('opted_in', true),
  ]);

  // Opt-out rate over last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: optOutCount } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('opted_in', false)
    .gte('opted_out_at', sevenDaysAgo);

  const total = totalRes.count ?? 0;
  const active = activeRes.count ?? 0;
  const optOutRate7d = total > 0 ? ((optOutCount ?? 0) / total) * 100 : 0;

  // Aggregate delivery schedule counts
  const bySchedule: Record<string, number> = {};
  for (const row of scheduleRes.data ?? []) {
    const s = row.delivery_schedule as string;
    bySchedule[s] = (bySchedule[s] ?? 0) + 1;
  }

  // Aggregate region counts (each subscriber can have multiple regions)
  const byRegion: Record<string, number> = {};
  for (const row of regionRes.data ?? []) {
    for (const r of (row.regions as string[]) ?? []) {
      byRegion[r] = (byRegion[r] ?? 0) + 1;
    }
  }

  return json({
    total,
    active,
    optedOut: optedOutRes.count ?? 0,
    newToday: todayRes.count ?? 0,
    optOutRate7d: parseFloat(optOutRate7d.toFixed(2)),
    bySchedule,
    byRegion,
  }, 200, cors);
}
