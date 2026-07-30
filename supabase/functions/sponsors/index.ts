import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logError } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/sponsors\/?/, '').split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && parts.length === 0) return await listSponsors(req, cors);
    if (req.method === 'GET' && parts[0] === 'stats') return await sponsorStats(req, cors);
    if (req.method === 'GET' && parts.length === 1) return await getSponsor(req, parts[0], cors);
    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await logError(supabase, 'sponsors_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

async function listSponsors(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('sponsors')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.active !== undefined) query = query.eq('active', params.active === 'true');
  if (params.tier) query = query.eq('tier', params.tier);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  return json({
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function getSponsor(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase.from('sponsors').select('*').eq('id', id).single();
  if (error) return err('Sponsor not found', 404, cors);
  return json(data, 200, cors);
}

async function sponsorStats(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const [totalRes, activeRes, tierRes] = await Promise.all([
    supabase.from('sponsors').select('id', { count: 'exact', head: true }),
    supabase.from('sponsors').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('sponsors').select('tier').eq('active', true),
  ]);

  const byTier: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  for (const row of tierRes.data ?? []) {
    const t = row.tier as string;
    byTier[t] = (byTier[t] ?? 0) + 1;
  }

  return json({
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    byTier,
  }, 200, cors);
}
