import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3';
import { requireAuth, corsHeaders, json, err, logAudit, logError } from '../_shared/auth.ts';

// ---------------------------------------------------------------------------
// Validators (inline — Edge Functions cannot import from packages/shared)
// ---------------------------------------------------------------------------

const Region = ['KZN','WC','GP','EC','FS','LP','MP','NC','NW','National'] as const;
const Category = ['Education','Safety','Culture','Opportunity','Events','Health','Technology','Community'] as const;
const Language = ['eng','zul','xho','afr'] as const;
const UrgencyLevel = ['low','medium','high','urgent'] as const;
const MomentStatus = ['draft','scheduled','broadcasted','cancelled'] as const;
const ContentSource = ['admin','community','whatsapp','campaign'] as const;

const CreateMomentSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(2000),
  region: z.enum(Region),
  category: z.enum(Category),
  language: z.enum(Language).default('eng'),
  sponsor_id: z.string().uuid().nullable().default(null),
  is_sponsored: z.boolean().default(false),
  pwa_link: z.string().url().nullable().default(null),
  media_urls: z.array(z.string().url()).default([]),
  scheduled_at: z.string().datetime().nullable().default(null),
  urgency_level: z.enum(UrgencyLevel).default('low'),
  publish_to_pwa: z.boolean().default(true),
  publish_to_whatsapp: z.boolean().default(false),
});

const UpdateMomentSchema = CreateMomentSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  { message: 'At least one field required' },
);

const ListMomentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(MomentStatus).optional(),
  region: z.enum(Region).optional(),
  category: z.enum(Category).optional(),
  source: z.enum(ContentSource).optional(),
  search: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/moments\/?/, '').split('/').filter(Boolean);
  // parts[0] = moment id or 'public', parts[1] = sub-action or moment id

  try {
    // GET /moments/public — public feed (no auth, publish_to_pwa=true only)
    if (req.method === 'GET' && parts.length === 1 && parts[0] === 'public') {
      return await listPublicMoments(req, cors);
    }

    // GET /moments/public/:id — public detail
    if (req.method === 'GET' && parts.length === 2 && parts[0] === 'public') {
      return await getPublicMoment(req, parts[1], cors);
    }

    // GET /moments — list
    if (req.method === 'GET' && parts.length === 0) {
      return await listMoments(req, cors);
    }

    // GET /moments/:id
    if (req.method === 'GET' && parts.length === 1) {
      return await getMoment(req, parts[0], cors);
    }

    // GET /moments/:id/stats
    if (req.method === 'GET' && parts.length === 2 && parts[1] === 'stats') {
      return await getMomentStats(req, parts[0], cors);
    }

    // POST /moments — create
    if (req.method === 'POST' && parts.length === 0) {
      return await createMoment(req, cors);
    }

    // PUT /moments/:id — update
    if (req.method === 'PUT' && parts.length === 1) {
      return await updateMoment(req, parts[0], cors);
    }

    // DELETE /moments/:id
    if (req.method === 'DELETE' && parts.length === 1) {
      return await deleteMoment(req, parts[0], cors);
    }

    // POST /moments/:id/schedule
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'schedule') {
      return await scheduleMoment(req, parts[0], cors);
    }

    // POST /moments/:id/cancel
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'cancel') {
      return await cancelMoment(req, parts[0], cors);
    }

    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await logError(supabase, 'moments_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function listMoments(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = ListMomentsSchema.safeParse(params);
  if (!parsed.success) return err('Invalid query parameters', 400, cors);

  const { page, limit, status, region, category, source, search } = parsed.data;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('moments')
    .select('*, sponsors(display_name, logo_url, tier)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status)   query = query.eq('status', status);
  if (region)   query = query.eq('region', region);
  if (category) query = query.eq('category', category);
  if (source)   query = query.eq('content_source', source);
  if (search)   query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  return json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  }, 200, cors);
}

async function getMoment(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from('moments')
    .select('*, sponsors(display_name, logo_url, tier)')
    .eq('id', id)
    .single();

  if (error) return err('Moment not found', 404, cors);
  return json(data, 200, cors);
}

async function createMoment(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const body = await req.json();
  const parsed = CreateMomentSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'Validation failed', details: parsed.error.flatten() }, 400, cors);

  const { data, error } = await supabase
    .from('moments')
    .insert({ ...parsed.data, created_by: context.userId, status: 'draft' })
    .select()
    .single();

  if (error) return err(error.message, 500, cors);

  // Create moment_stats row
  await supabase.from('moment_stats').insert({ moment_id: data.id });

  await logAudit(supabase, context.userId, 'create', 'moment', data.id, parsed.data);
  return json(data, 201, cors);
}

async function updateMoment(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  // Cannot update a broadcasted moment
  const { data: existing } = await supabase.from('moments').select('status').eq('id', id).single();
  if (!existing) return err('Moment not found', 404, cors);
  if (existing.status === 'broadcasted') return err('Cannot update a broadcasted moment', 409, cors);

  const body = await req.json();
  const parsed = UpdateMomentSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'Validation failed', details: parsed.error.flatten() }, 400, cors);

  const { data, error } = await supabase
    .from('moments')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);
  await logAudit(supabase, context.userId, 'update', 'moment', id, parsed.data);
  return json(data, 200, cors);
}

async function deleteMoment(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const { data: existing } = await supabase.from('moments').select('status').eq('id', id).single();
  if (!existing) return err('Moment not found', 404, cors);
  if (existing.status === 'broadcasted') return err('Cannot delete a broadcasted moment', 409, cors);

  const { error } = await supabase.from('moments').delete().eq('id', id);
  if (error) return err(error.message, 500, cors);

  await logAudit(supabase, context.userId, 'delete', 'moment', id);
  return json({ success: true }, 200, cors);
}

async function scheduleMoment(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const body = await req.json();
  const parsed = z.object({ scheduled_at: z.string().datetime() }).safeParse(body);
  if (!parsed.success) return json({ error: 'Validation failed', details: parsed.error.flatten() }, 400, cors);

  const { data: existing } = await supabase.from('moments').select('status').eq('id', id).single();
  if (!existing) return err('Moment not found', 404, cors);
  if (existing.status !== 'draft') return err('Only draft moments can be scheduled', 409, cors);

  const { data, error } = await supabase
    .from('moments')
    .update({ status: 'scheduled', scheduled_at: parsed.data.scheduled_at })
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);
  await logAudit(supabase, context.userId, 'schedule', 'moment', id, parsed.data);
  return json(data, 200, cors);
}

async function cancelMoment(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const { data: existing } = await supabase.from('moments').select('status').eq('id', id).single();
  if (!existing) return err('Moment not found', 404, cors);
  if (existing.status === 'broadcasted') return err('Cannot cancel a broadcasted moment', 409, cors);
  if (existing.status === 'cancelled') return err('Moment is already cancelled', 409, cors);

  const { data, error } = await supabase
    .from('moments')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (error) return err(error.message, 500, cors);
  await logAudit(supabase, context.userId, 'cancel', 'moment', id);
  return json(data, 200, cors);
}

// ---------------------------------------------------------------------------
// Public handlers (no auth — publish_to_pwa=true + broadcasted only)
// ---------------------------------------------------------------------------

const PublicListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  region: z.enum(Region).optional(),
  category: z.enum(Category).optional(),
  search: z.string().max(200).optional(),
});

async function listPublicMoments(req: Request, cors: Record<string, string>) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = PublicListSchema.safeParse(params);
  if (!parsed.success) return err('Invalid query parameters', 400, cors);

  const { page, limit, region, category, search } = parsed.data;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('moments')
    .select('id, title, content, region, category, language, urgency_level, is_sponsored, sponsor_id, pwa_link, media_urls, created_at, sponsors(display_name, logo_url, tier)', { count: 'exact' })
    .eq('status', 'broadcasted')
    .eq('publish_to_pwa', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (region)   query = query.eq('region', region);
  if (category) query = query.eq('category', category);
  if (search)   query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  return json({
    data,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function getPublicMoment(req: Request, id: string, cors: Record<string, string>) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await supabase
    .from('moments')
    .select('id, title, content, region, category, language, urgency_level, is_sponsored, sponsor_id, pwa_link, media_urls, created_at, sponsors(display_name, logo_url, tier)')
    .eq('id', id)
    .eq('status', 'broadcasted')
    .eq('publish_to_pwa', true)
    .single();

  if (error || !data) return err('Moment not found', 404, cors);
  return json(data, 200, cors);
}

async function getMomentStats(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from('moment_stats')
    .select('view_count, comment_count, share_count, reaction_count, updated_at')
    .eq('moment_id', id)
    .single();

  if (error) return err('Stats not found', 404, cors);
  return json(data, 200, cors);
}
