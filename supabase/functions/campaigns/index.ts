import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logError } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/campaigns\/?/, '').split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && parts.length === 0) return await listCampaigns(req, cors);
    if (req.method === 'GET' && parts[0] === 'budget') return await budgetOverview(req, cors);
    if (req.method === 'GET' && parts.length === 1) return await getCampaign(req, parts[0], cors);
    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await logError(supabase, 'campaigns_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

async function listCampaigns(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20')));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('campaigns')
    .select('*, sponsors(display_name)', { count: 'exact' })
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

async function getCampaign(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from('campaigns')
    .select('*, sponsors(display_name)')
    .eq('id', id)
    .single();

  if (error) return err('Campaign not found', 404, cors);
  return json(data, 200, cors);
}

async function budgetOverview(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data: campaigns, error: campErr } = await supabase
    .from('campaigns')
    .select('id, title, budget, status, sponsors(display_name)')
    .in('status', ['active', 'approved', 'pending_review']);

  if (campErr) return err(campErr.message, 500, cors);

  const results = await Promise.all(
    (campaigns ?? []).map(async (c: Record<string, unknown>) => {
      const { data: txns } = await supabase
        .from('budget_transactions')
        .select('amount, recipient_count')
        .eq('campaign_id', c.id)
        .eq('status', 'completed')
        .eq('transaction_type', 'spend');

      const spent = (txns ?? []).reduce((sum: number, t: Record<string, number>) => sum + (t.amount ?? 0), 0);
      const broadcastsSent = (txns ?? []).reduce((sum: number, t: Record<string, number>) => sum + (t.recipient_count ?? 0), 0);
      const sponsor = c.sponsors as Record<string, string> | null;

      return {
        campaignId: c.id,
        title: c.title,
        sponsorName: sponsor?.display_name ?? '—',
        budget: c.budget,
        spent,
        broadcastsSent,
        status: c.status,
      };
    })
  );

  return json(results, 200, cors);
}
