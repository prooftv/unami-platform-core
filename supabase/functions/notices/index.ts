import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { z } from 'https://esm.sh/zod@3';
import { requireAuth, corsHeaders, json, err, logAudit, checkRateLimit } from '../_shared/auth.ts';

const NOTICE_TYPES = [
  'meeting','announcement','resolution','alert','opportunity','employment','smme','project-update',
  'eia','rezoning','land-use','township','building','mining','liquor','telecom','estate','liquidation','pto',
] as const;

const NOTICE_STATUSES = ['draft','published','open','closed','approved','rejected','withdrawn','archived'] as const;

const CreateNoticeSchema = z.object({
  type:             z.enum(NOTICE_TYPES),
  title:            z.string().min(3).max(200),
  content:          z.string().min(10).max(5000),
  comment_deadline: z.string().datetime().nullable().optional(),
});

const UpdateNoticeSchema = z.object({
  title:            z.string().min(3).max(200).optional(),
  content:          z.string().min(10).max(5000).optional(),
  status:           z.enum(NOTICE_STATUSES).optional(),
  comment_deadline: z.string().datetime().nullable().optional(),
});

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/notices/, '');
  const method = req.method;

  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rateLimited = await checkRateLimit(supabase, ip, '/notices');
  if (rateLimited) return rateLimited;

  // GET /notices
  if (method === 'GET' && path === '') {
    const page   = parseInt(url.searchParams.get('page')  ?? '1');
    const limit  = parseInt(url.searchParams.get('limit') ?? '20');
    const status = url.searchParams.get('status');
    const type   = url.searchParams.get('type');
    const offset = (page - 1) * limit;

    let query = supabase.from('notices').select('*', { count: 'exact' });
    if (status) query = query.eq('status', status);
    if (type)   query = query.eq('type', type);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return err(error.message, 500, cors);

    return json({
      data,
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    }, 200, cors);
  }

  // GET /notices/:id
  if (method === 'GET' && /^\/[^/]+$/.test(path)) {
    const id = path.slice(1);
    const { data, error } = await supabase.from('notices').select('*').eq('id', id).single();
    if (error) return err('Notice not found', 404, cors);
    return json({ data }, 200, cors);
  }

  // POST /notices
  if (method === 'POST' && path === '') {
    if (!['superadmin', 'content_admin'].includes(context.role)) return err('Forbidden', 403, cors);

    const body = await req.json();
    const parsed = CreateNoticeSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 400, cors);

    const { data, error } = await supabase.from('notices').insert({
      type:             parsed.data.type,
      title:            parsed.data.title,
      content:          parsed.data.content,
      comment_deadline: parsed.data.comment_deadline ?? null,
      created_by:       context.userId,
    }).select().single();

    if (error) return err(error.message, 500, cors);
    await logAudit(supabase, context.userId, 'create', 'notice', data.id);
    return json({ data }, 201, cors);
  }

  // PUT /notices/:id
  if (method === 'PUT' && /^\/[^/]+$/.test(path)) {
    if (!['superadmin', 'content_admin'].includes(context.role)) return err('Forbidden', 403, cors);

    const id = path.slice(1);
    const body = await req.json();
    const parsed = UpdateNoticeSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 400, cors);

    const updates: Record<string, unknown> = {};
    if (parsed.data.title            !== undefined) updates.title            = parsed.data.title;
    if (parsed.data.content          !== undefined) updates.content          = parsed.data.content;
    if (parsed.data.status           !== undefined) updates.status           = parsed.data.status;
    if (parsed.data.comment_deadline !== undefined) updates.comment_deadline = parsed.data.comment_deadline;

    const { data, error } = await supabase
      .from('notices').update(updates).eq('id', id).select().single();
    if (error) return err(error.message, 500, cors);
    await logAudit(supabase, context.userId, 'update', 'notice', id, updates);
    return json({ data }, 200, cors);
  }

  return err('Not found', 404, cors);
});
