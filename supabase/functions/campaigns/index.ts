import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3';
import { requireAuth, corsHeaders, json, err, logAudit, logError } from '../_shared/auth.ts';

const Region = ['KZN','WC','GP','EC','FS','LP','MP','NC','NW','National'] as const;
const Category = ['Education','Safety','Culture','Opportunity','Events','Health','Technology','Community'] as const;
const CampaignType = ['ad', 'activation', 'csr'] as const;
const ProjectHealth = ['green', 'amber', 'red'] as const;
const ProjectPhase = ['planning', 'procurement', 'construction', 'commissioning', 'operational'] as const;

const CreateCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(2000),
  category: z.enum(Category),
  sponsor_id: z.string().uuid().nullable().default(null),
  budget: z.coerce.number().nonnegative().default(0),
  target_regions: z.array(z.enum(Region)).min(1),
  target_categories: z.array(z.enum(Category)).default([]),
  media_urls: z.array(z.string().url()).default([]),
  scheduled_at: z.string().datetime().nullable().default(null),
  campaign_type: z.enum(CampaignType).default('ad'),
  project_reference: z.string().nullable().default(null),
  funding_source: z.string().nullable().default(null),
  contractor: z.string().nullable().default(null),
  beneficiaries: z.coerce.number().int().nonnegative().nullable().default(null),
});

const UpdateCampaignSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(10).max(2000).optional(),
  category: z.enum(Category).optional(),
  sponsor_id: z.string().uuid().nullable().optional(),
  budget: z.coerce.number().nonnegative().optional(),
  target_regions: z.array(z.enum(Region)).min(1).optional(),
  target_categories: z.array(z.enum(Category)).optional(),
  media_urls: z.array(z.string().url()).optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
  campaign_type: z.enum(CampaignType).optional(),
  project_health: z.enum(ProjectHealth).nullable().optional(),
  project_phase: z.enum(ProjectPhase).nullable().optional(),
  project_reference: z.string().nullable().optional(),
  funding_source: z.string().nullable().optional(),
  contractor: z.string().nullable().optional(),
  beneficiaries: z.coerce.number().int().nonnegative().nullable().optional(),
  impact_summary: z.string().nullable().optional(),
  lessons_learned: z.string().nullable().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

const AddProgressSchema = z.object({
  update: z.string().min(1).max(1000),
  date: z.string().optional(),
});

const CertifyDeliverableSchema = z.object({
  task: z.string().min(1).max(500),
  certifiedBy: z.string().min(1).max(200),
  percentageComplete: z.coerce.number().int().min(0).max(100),
  weightage: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().max(1000).default(''),
});

const CompleteSchema = z.object({
  impactSummary: z.string().min(1).max(2000),
  lessonsLearned: z.string().min(1).max(2000),
});

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/campaigns\/?/, '').split('/').filter(Boolean);

  try {
    // Public routes — anon access, CSR projects only
    if (req.method === 'GET' && parts[0] === 'public' && parts[1] === 'projects' && parts.length === 2) return await listPublicProjects(req, cors);
    if (req.method === 'GET' && parts[0] === 'public' && parts[1] === 'projects' && parts.length === 3) return await getPublicProject(req, parts[2], cors);

    if (req.method === 'GET' && parts.length === 0) return await listCampaigns(req, cors);
    if (req.method === 'GET' && parts[0] === 'budget') return await budgetOverview(req, cors);
    if (req.method === 'GET' && parts.length === 1) return await getCampaign(req, parts[0], cors);
    if (req.method === 'GET' && parts.length === 2 && parts[1] === 'transactions') return await getTransactions(req, parts[0], cors);
    if (req.method === 'GET' && parts.length === 2 && parts[1] === 'progress') return await getProgress(req, parts[0], cors);
    if (req.method === 'GET' && parts.length === 2 && parts[1] === 'deliverables') return await getDeliverables(req, parts[0], cors);
    if (req.method === 'POST' && parts.length === 0) return await createCampaign(req, cors);
    if (req.method === 'PUT' && parts.length === 1) return await updateCampaign(req, parts[0], cors);
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'approve') return await approveCampaign(req, parts[0], cors);
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'pause') return await pauseCampaign(req, parts[0], cors);
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'cancel') return await cancelCampaign(req, parts[0], cors);
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'progress') return await addProgress(req, parts[0], cors);
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'deliverables') return await certifyDeliverable(req, parts[0], cors);
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'complete') return await completeCampaign(req, parts[0], cors);
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

async function getTransactions(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data: existing } = await supabase.from('campaigns').select('id').eq('id', id).single();
  if (!existing) return err('Campaign not found', 404, cors);

  const { data, error } = await supabase
    .from('budget_transactions')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false });

  if (error) return err(error.message, 500, cors);

  const mapped = (data ?? []).map((t: Record<string, unknown>) => ({
    id: t.id,
    transactionType: t.transaction_type,
    amount: t.amount,
    recipientCount: t.recipient_count,
    costPerRecipient: t.cost_per_recipient,
    status: t.status,
    createdAt: t.created_at,
  }));

  return json(mapped, 200, cors);
}

async function createCampaign(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const body = await req.json();
  const parsed = CreateCampaignSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'Validation failed', details: parsed.error.flatten() }, 400, cors);

  const { data, error } = await supabase
    .from('campaigns')
    .insert({ ...parsed.data, created_by: context.userId, status: 'pending_review' })
    .select()
    .single();

  if (error) return err(error.message, 500, cors);
  await logAudit(supabase, context.userId, 'create', 'campaign', data.id, parsed.data);
  return json(data, 201, cors);
}
  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const { data: existing } = await supabase.from('campaigns').select('status').eq('id', id).single();
  if (!existing) return err('Campaign not found', 404, cors);
  if (['active', 'completed'].includes(existing.status as string)) {
    return err('Cannot update an active or completed campaign', 409, cors);
  }

  const body = await req.json();
  const parsed = UpdateCampaignSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'Validation failed', details: parsed.error.flatten() }, 400, cors);

  const { data, error } = await supabase
    .from('campaigns')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);
  await logAudit(supabase, context.userId, 'update', 'campaign', id, parsed.data);
  return json(data, 200, cors);
}

async function approveCampaign(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const { data: existing } = await supabase.from('campaigns').select('status').eq('id', id).single();
  if (!existing) return err('Campaign not found', 404, cors);
  if (existing.status !== 'pending_review' && existing.status !== 'paused') {
    return err('Campaign must be pending_review or paused to approve', 409, cors);
  }

  const newStatus = existing.status === 'paused' ? 'active' : 'approved';
  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);
  await logAudit(supabase, context.userId, 'approve', 'campaign', id, { newStatus });
  return json(data, 200, cors);
}

async function pauseCampaign(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const { data: existing } = await supabase.from('campaigns').select('status').eq('id', id).single();
  if (!existing) return err('Campaign not found', 404, cors);
  if (existing.status !== 'active') return err('Only active campaigns can be paused', 409, cors);

  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);
  await logAudit(supabase, context.userId, 'pause', 'campaign', id);
  return json(data, 200, cors);
}

async function cancelCampaign(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const { data: existing } = await supabase.from('campaigns').select('status').eq('id', id).single();
  if (!existing) return err('Campaign not found', 404, cors);
  if (existing.status === 'completed') return err('Cannot cancel a completed campaign', 409, cors);
  if (existing.status === 'cancelled') return err('Campaign is already cancelled', 409, cors);

  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);
  await logAudit(supabase, context.userId, 'cancel', 'campaign', id);
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

// ---------------------------------------------------------------------------
// Public routes — anon access, CSR projects only
// ---------------------------------------------------------------------------

function publicClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
}

async function listPublicProjects(req: Request, cors: Record<string, string>) {
  const url = new URL(req.url);
  const page   = parseInt(url.searchParams.get('page')  ?? '1');
  const limit  = parseInt(url.searchParams.get('limit') ?? '20');
  const health = url.searchParams.get('health');
  const region = url.searchParams.get('region');
  const offset = (page - 1) * limit;

  const supabase = publicClient();
  let query = supabase
    .from('campaigns')
    .select('*, sponsor:sponsors(display_name, logo_url)', { count: 'exact' })
    .eq('campaign_type', 'csr')
    .in('status', ['active', 'completed', 'published']);

  if (health) query = query.eq('project_health', health);
  if (region) query = query.contains('target_regions', [region]);
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  return json({
    data,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function getPublicProject(req: Request, id: string, cors: Record<string, string>) {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, sponsor:sponsors(display_name, logo_url)')
    .eq('id', id)
    .eq('campaign_type', 'csr')
    .in('status', ['active', 'completed', 'published'])
    .single();

  if (error) return err('Project not found', 404, cors);
  return json({ data }, 200, cors);
}
