import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { z } from 'https://esm.sh/zod@3';
import { requireAuth, corsHeaders, json, err, logAudit, checkRateLimit } from '../_shared/auth.ts';

// ---------------------------------------------------------------------------
// Schemas — structural validation only.
// No application vocabulary. No type enums.
// The calling application owns type labels and validation rules.
// ---------------------------------------------------------------------------

const RECORD_STATUSES = ['pending', 'adopted', 'approved', 'resolved', 'rejected'] as const;

const TERMINAL_STATUSES = new Set(['adopted', 'approved', 'resolved', 'rejected']);

const CreateRecordSchema = z.object({
  type:             z.string().min(1).max(100),
  title:            z.string().min(3).max(200),
  content:          z.string().min(10).max(5000),
  approved_by:      z.string().nullable().optional(),
  parent_record_id: z.string().uuid().nullable().optional(),
  origin_notice_id: z.string().uuid().nullable().optional(),
  moment_id:        z.string().uuid().nullable().optional(),
});

const UpdateRecordSchema = z.object({
  title:       z.string().min(3).max(200).optional(),
  content:     z.string().min(10).max(5000).optional(),
  approved_by: z.string().nullable().optional(),
});

const StatusTransitionSchema = z.object({
  status: z.enum(RECORD_STATUSES),
});

// ---------------------------------------------------------------------------
// Public Supabase client — anon key, used for public GET routes only
// ---------------------------------------------------------------------------

function publicClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/records/, '');
  const method = req.method;

  // ------------------------------------------------------------------
  // Public GET routes — anon access, RLS enforces broadcasted+pwa filter
  // ------------------------------------------------------------------

  if (method === 'GET' && path === '') {
    const momentId = url.searchParams.get('moment_id');
    const page     = parseInt(url.searchParams.get('page')  ?? '1');
    const limit    = parseInt(url.searchParams.get('limit') ?? '20');
    const offset   = (page - 1) * limit;

    const supabase = publicClient();
    let query = supabase.from('records').select('*', { count: 'exact' });
    if (momentId) query = query.eq('moment_id', momentId);
    query = query.order('created_at', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return err(error.message, 500, cors);

    return json({
      data,
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    }, 200, cors);
  }

  if (method === 'GET' && /^\/[^/]+$/.test(path)) {
    const id = path.slice(1);
    const supabase = publicClient();
    const { data, error } = await supabase.from('records').select('*').eq('id', id).single();
    if (error) return err('Record not found', 404, cors);
    return json({ data }, 200, cors);
  }

  // GET /records/:id/lineage — walk the parent chain (public)
  if (method === 'GET' && /^\/[^/]+\/lineage$/.test(path)) {
    const id = path.split('/')[1];
    const supabase = publicClient();
    const chain: unknown[] = [];
    let currentId: string | null = id;

    while (currentId) {
      const { data, error } = await supabase
        .from('records').select('*').eq('id', currentId).single();
      if (error || !data) break;
      chain.push(data);
      currentId = (data as { parent_record_id: string | null }).parent_record_id;
    }

    return json({ data: chain }, 200, cors);
  }

  // ------------------------------------------------------------------
  // Authenticated routes
  // ------------------------------------------------------------------

  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimited = await checkRateLimit(supabase, ip, '/records');
  if (rateLimited) return rateLimited;

  // GET /records (authenticated — includes all statuses, origin_notice_id filter)
  if (method === 'GET' && path === '') {
    const page           = parseInt(url.searchParams.get('page')  ?? '1');
    const limit          = parseInt(url.searchParams.get('limit') ?? '20');
    const status         = url.searchParams.get('status');
    const type           = url.searchParams.get('type');
    const momentId       = url.searchParams.get('moment_id');
    const originNoticeId = url.searchParams.get('origin_notice_id');
    const offset         = (page - 1) * limit;

    let query = supabase.from('records').select('*', { count: 'exact' });
    if (status)         query = query.eq('status', status);
    if (type)           query = query.eq('type', type);
    if (momentId)       query = query.eq('moment_id', momentId);
    if (originNoticeId) query = query.eq('origin_notice_id', originNoticeId);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return err(error.message, 500, cors);

    return json({
      data,
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    }, 200, cors);
  }

  // GET /records/:id (authenticated)
  if (method === 'GET' && /^\/[^/]+$/.test(path)) {
    const id = path.slice(1);
    const { data, error } = await supabase.from('records').select('*').eq('id', id).single();
    if (error) return err('Record not found', 404, cors);
    return json({ data }, 200, cors);
  }

  // GET /records/:id/lineage (authenticated)
  if (method === 'GET' && /^\/[^/]+\/lineage$/.test(path)) {
    const id = path.split('/')[1];
    const chain: unknown[] = [];
    let currentId: string | null = id;

    while (currentId) {
      const { data, error } = await supabase
        .from('records').select('*').eq('id', currentId).single();
      if (error || !data) break;
      chain.push(data);
      currentId = (data as { parent_record_id: string | null }).parent_record_id;
    }

    return json({ data: chain }, 200, cors);
  }

  // POST /records
  if (method === 'POST' && path === '') {
    if (!['superadmin', 'content_admin'].includes(context.role)) return err('Forbidden', 403, cors);

    const body = await req.json();
    const parsed = CreateRecordSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 400, cors);

    const { data, error } = await supabase.from('records').insert({
      type:             parsed.data.type,
      title:            parsed.data.title,
      content:          parsed.data.content,
      approved_by:      parsed.data.approved_by ?? null,
      parent_record_id: parsed.data.parent_record_id ?? null,
      origin_notice_id: parsed.data.origin_notice_id ?? null,
      moment_id:        parsed.data.moment_id ?? null,
      created_by:       context.userId,
    }).select().single();

    if (error) return err(error.message, 500, cors);
    await logAudit(supabase, context.userId, 'create', 'record', data.id);
    return json({ data }, 201, cors);
  }

  // PUT /records/:id — content edits, pending status only
  if (method === 'PUT' && /^\/[^/]+$/.test(path)) {
    if (!['superadmin', 'content_admin'].includes(context.role)) return err('Forbidden', 403, cors);

    const id = path.slice(1);

    const { data: existing, error: fetchError } = await supabase
      .from('records').select('status').eq('id', id).single();
    if (fetchError) return err('Record not found', 404, cors);
    if (TERMINAL_STATUSES.has(existing.status)) return err('Record is immutable — status is terminal', 409, cors);

    const body = await req.json();
    const parsed = UpdateRecordSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 400, cors);

    const updates: Record<string, unknown> = {};
    if (parsed.data.title       !== undefined) updates.title       = parsed.data.title;
    if (parsed.data.content     !== undefined) updates.content     = parsed.data.content;
    if (parsed.data.approved_by !== undefined) updates.approved_by = parsed.data.approved_by;

    const { data, error } = await supabase
      .from('records').update(updates).eq('id', id).select().single();
    if (error) return err(error.message, 500, cors);
    await logAudit(supabase, context.userId, 'update', 'record', id, updates);
    return json({ data }, 200, cors);
  }

  // PUT /records/:id/status — status transitions only
  if (method === 'PUT' && /^\/[^/]+\/status$/.test(path)) {
    if (!['superadmin', 'content_admin'].includes(context.role)) return err('Forbidden', 403, cors);

    const id = path.split('/')[1];

    const { data: existing, error: fetchError } = await supabase
      .from('records').select('status').eq('id', id).single();
    if (fetchError) return err('Record not found', 404, cors);
    if (TERMINAL_STATUSES.has(existing.status)) return err('Record is immutable — status is terminal', 409, cors);

    const body = await req.json();
    const parsed = StatusTransitionSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 400, cors);
    if (parsed.data.status === 'pending') return err('Cannot transition back to pending', 400, cors);

    const { data, error } = await supabase
      .from('records').update({ status: parsed.data.status }).eq('id', id).select().single();
    if (error) return err(error.message, 500, cors);
    await logAudit(supabase, context.userId, 'status_transition', 'record', id, { status: parsed.data.status });
    return json({ data }, 200, cors);
  }

  return err('Not found', 404, cors);
});
