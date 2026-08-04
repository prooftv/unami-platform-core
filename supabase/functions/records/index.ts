import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3';
import { requireAuth, corsHeaders, json, err, logAudit, checkRateLimit } from '../_shared/auth.ts';

const RECORD_TYPES = [
  'minutes','resolution','community-decision','land-allocation','dispute-resolution',
  'report','infrastructure-concern','project-outcome','policy','agenda',
  'public-notice','external-resource',
] as const;

const RECORD_STATUSES = ['pending','adopted','approved','resolved','rejected'] as const;

const CreateRecordSchema = z.object({
  type:             z.enum(RECORD_TYPES),
  title:            z.string().min(3).max(200),
  content:          z.string().min(10).max(5000),
  parent_record_id: z.string().uuid().nullable().optional(),
  origin_notice_id: z.string().uuid().nullable().optional(),
});

const UpdateRecordSchema = z.object({
  title:       z.string().min(3).max(200).optional(),
  content:     z.string().min(10).max(5000).optional(),
  status:      z.enum(RECORD_STATUSES).optional(),
  approved_by: z.string().nullable().optional(),
});

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/records/, '');
  const method = req.method;

  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimited = await checkRateLimit(supabase, ip, '/records');
  if (rateLimited) return rateLimited;

  // GET /records
  if (method === 'GET' && path === '') {
    const page  = parseInt(url.searchParams.get('page')  ?? '1');
    const limit = parseInt(url.searchParams.get('limit') ?? '20');
    const status = url.searchParams.get('status');
    const type   = url.searchParams.get('type');
    const offset = (page - 1) * limit;

    const originNoticeId = url.searchParams.get('origin_notice_id');

    let query = supabase.from('records').select('*', { count: 'exact' });
    if (status)         query = query.eq('status', status);
    if (type)           query = query.eq('type', type);
    if (originNoticeId) query = query.eq('origin_notice_id', originNoticeId);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return err(error.message, 500, cors);

    return json({
      data,
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    }, 200, cors);
  }

  // GET /records/:id
  if (method === 'GET' && /^\/[^/]+$/.test(path)) {
    const id = path.slice(1);
    const { data, error } = await supabase.from('records').select('*').eq('id', id).single();
    if (error) return err('Record not found', 404, cors);
    return json({ data }, 200, cors);
  }

  // GET /records/:id/lineage — walk the parent chain
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
      parent_record_id: parsed.data.parent_record_id ?? null,
      origin_notice_id: parsed.data.origin_notice_id ?? null,
      created_by:       context.userId,
    }).select().single();

    if (error) return err(error.message, 500, cors);
    await logAudit(supabase, context.userId, 'create', 'record', data.id);
    return json({ data }, 201, cors);
  }

  // PUT /records/:id
  if (method === 'PUT' && /^\/[^/]+$/.test(path)) {
    if (!['superadmin', 'content_admin'].includes(context.role)) return err('Forbidden', 403, cors);

    const id = path.slice(1);
    const body = await req.json();
    const parsed = UpdateRecordSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 400, cors);

    const updates: Record<string, unknown> = {};
    if (parsed.data.title       !== undefined) updates.title       = parsed.data.title;
    if (parsed.data.content     !== undefined) updates.content     = parsed.data.content;
    if (parsed.data.status      !== undefined) updates.status      = parsed.data.status;
    if (parsed.data.approved_by !== undefined) updates.approved_by = parsed.data.approved_by;

    const { data, error } = await supabase
      .from('records').update(updates).eq('id', id).select().single();
    if (error) return err(error.message, 500, cors);
    await logAudit(supabase, context.userId, 'update', 'record', id, updates);
    return json({ data }, 200, cors);
  }

  return err('Not found', 404, cors);
});
