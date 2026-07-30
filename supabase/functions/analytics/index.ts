import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logError } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/analytics\/?/, '').split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && parts[0] === 'dashboard') return await dashboardMetrics(req, cors);
    if (req.method === 'GET' && parts[0] === 'daily') return await dailyStats(req, cors);
    if (req.method === 'GET' && parts[0] === 'regional') return await regionalStats(req, cors);
    if (req.method === 'GET' && parts[0] === 'categories') return await categoryStats(req, cors);
    if (req.method === 'GET' && parts[0] === 'revenue') return await revenueAnalytics(req, cors);
    if (req.method === 'GET' && parts[0] === 'intents') return await intentStats(req, cors);
    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await logError(supabase, 'analytics_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

async function dashboardMetrics(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const [
    totalMomentsRes, broadcastedRes, communityRes, adminRes, campaignRes,
    totalBroadcastsRes, successfulRes, pendingRes, failedRes,
    totalSubsRes, activeSubsRes,
    pendingIntentsRes,
  ] = await Promise.all([
    supabase.from('moments').select('id', { count: 'exact', head: true }),
    supabase.from('moments').select('id', { count: 'exact', head: true }).eq('status', 'broadcasted'),
    supabase.from('moments').select('id', { count: 'exact', head: true }).eq('content_source', 'community'),
    supabase.from('moments').select('id', { count: 'exact', head: true }).eq('content_source', 'admin'),
    supabase.from('moments').select('id', { count: 'exact', head: true }).eq('content_source', 'campaign'),
    supabase.from('broadcasts').select('id', { count: 'exact', head: true }),
    supabase.from('broadcasts').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('broadcasts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('broadcasts').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('opted_in', true),
    supabase.from('moment_intents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const total = totalBroadcastsRes.count ?? 0;
  const successful = successfulRes.count ?? 0;
  const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) + '%' : '—';

  const pendingIntents = pendingIntentsRes.count ?? 0;
  const intentSystem = pendingIntents > 50 ? 'backlog' : 'healthy';

  return json({
    totalMoments: totalMomentsRes.count ?? 0,
    broadcastedMoments: broadcastedRes.count ?? 0,
    communityMoments: communityRes.count ?? 0,
    adminMoments: adminRes.count ?? 0,
    campaignMoments: campaignRes.count ?? 0,
    totalBroadcasts: total,
    successfulBroadcasts: successful,
    pendingBroadcasts: pendingRes.count ?? 0,
    failedBroadcasts: failedRes.count ?? 0,
    successRate,
    totalSubscribers: totalSubsRes.count ?? 0,
    activeSubscribers: activeSubsRes.count ?? 0,
    recentActivity: pendingIntents,
    systemStatus: {
      intentSystem,
      lastUpdated: new Date().toISOString(),
    },
  }, 200, cors);
}

async function dailyStats(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const days = Math.min(90, Math.max(1, parseInt(new URL(req.url).searchParams.get('days') ?? '30')));
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const [momentsRes, broadcastsRes, subsRes] = await Promise.all([
    supabase.from('moments').select('created_at').gte('created_at', since),
    supabase.from('broadcasts').select('broadcast_started_at').gte('broadcast_started_at', since),
    supabase.from('subscriptions').select('opted_in_at').gte('opted_in_at', since).eq('opted_in', true),
  ]);

  // Build a map of date → counts
  const statsMap: Record<string, { momentsCount: number; broadcastsCount: number; newSubscribers: number }> = {};

  const dateKey = (iso: string) => iso.slice(0, 10);

  for (const row of momentsRes.data ?? []) {
    const d = dateKey(row.created_at);
    if (!statsMap[d]) statsMap[d] = { momentsCount: 0, broadcastsCount: 0, newSubscribers: 0 };
    statsMap[d].momentsCount++;
  }
  for (const row of broadcastsRes.data ?? []) {
    const d = dateKey(row.broadcast_started_at);
    if (!statsMap[d]) statsMap[d] = { momentsCount: 0, broadcastsCount: 0, newSubscribers: 0 };
    statsMap[d].broadcastsCount++;
  }
  for (const row of subsRes.data ?? []) {
    const d = dateKey(row.opted_in_at);
    if (!statsMap[d]) statsMap[d] = { momentsCount: 0, broadcastsCount: 0, newSubscribers: 0 };
    statsMap[d].newSubscribers++;
  }

  const result = Object.entries(statsMap)
    .map(([statDate, counts]) => ({ statDate, ...counts }))
    .sort((a, b) => a.statDate.localeCompare(b.statDate));

  return json(result, 200, cors);
}

async function regionalStats(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase.from('moments').select('region');
  if (error) return err(error.message, 500, cors);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.region] = (counts[row.region] ?? 0) + 1;
  }

  const result = Object.entries(counts).map(([region, momentCount]) => ({ region, momentCount }));
  return json(result, 200, cors);
}

async function categoryStats(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase.from('moments').select('category');
  if (error) return err(error.message, 500, cors);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }

  const result = Object.entries(counts).map(([category, momentCount]) => ({ category, momentCount }));
  return json(result, 200, cors);
}

async function revenueAnalytics(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [campaignsRes, txnsRes, txns30Res] = await Promise.all([
    supabase.from('campaigns').select('id', { count: 'exact', head: true }),
    supabase.from('budget_transactions').select('amount, recipient_count').eq('status', 'completed').eq('transaction_type', 'spend'),
    supabase.from('budget_transactions').select('amount').eq('status', 'completed').eq('transaction_type', 'spend').gte('created_at', thirtyDaysAgo),
  ]);

  const allTxns = txnsRes.data ?? [];
  const totalSpent = allTxns.reduce((s: number, t: Record<string, number>) => s + (t.amount ?? 0), 0);
  const totalRecipients = allTxns.reduce((s: number, t: Record<string, number>) => s + (t.recipient_count ?? 0), 0);
  const revenue30 = (txns30Res.data ?? []).reduce((s: number, t: Record<string, number>) => s + (t.amount ?? 0), 0);

  const { data: budgetData } = await supabase.from('campaigns').select('budget');
  const totalBudget = (budgetData ?? []).reduce((s: number, c: Record<string, number>) => s + (c.budget ?? 0), 0);

  const avgCost = allTxns.length > 0 ? totalSpent / allTxns.length : 0;
  const utilization = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) + '%' : '0%';
  const roi = totalSpent > 0 ? ((revenue30 / totalSpent) * 100).toFixed(1) + '%' : '—';
  const margin = revenue30 > 0 ? (((revenue30 - totalSpent) / revenue30) * 100).toFixed(1) + '%' : '—';

  return json({
    totalCampaigns: campaignsRes.count ?? 0,
    totalRevenue30Days: revenue30,
    totalBudgetAllocated: totalBudget,
    totalSpent,
    totalBroadcasts: allTxns.length,
    avgCostPerBroadcast: parseFloat(avgCost.toFixed(4)),
    roi,
    profitMargin: margin,
    budgetUtilization: utilization,
  }, 200, cors);
}

async function intentStats(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const [pendingRes, processingRes, failedRes, lastRes] = await Promise.all([
    supabase.from('moment_intents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('moment_intents').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
    supabase.from('moment_intents').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('moment_intents').select('updated_at').eq('status', 'sent').order('updated_at', { ascending: false }).limit(1),
  ]);

  return json({
    pending: pendingRes.count ?? 0,
    processing: processingRes.count ?? 0,
    failed: failedRes.count ?? 0,
    lastProcessedAt: lastRes.data?.[0]?.updated_at ?? null,
  }, 200, cors);
}
