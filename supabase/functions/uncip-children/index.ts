import { z } from 'https://esm.sh/zod@3';
import { requireUNCIPAuth, corsHeaders, json, err } from '../_shared/uncip-auth.ts';

const PROVINCES = ['eastern_cape','free_state','gauteng','kwazulu_natal','limpopo','mpumalanga','north_west','northern_cape','western_cape'] as const;

const CreateChildSchema = z.object({
  first_name:            z.string().min(1).max(100),
  last_name:             z.string().min(1).max(100),
  date_of_birth:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_of_birth must be YYYY-MM-DD'),
  gender:                z.enum(['male','female','other']),
  photo_url:             z.string().url().nullable().optional(),
  // Decision 1: nullable at registration
  identification_number: z.string().max(20).nullable().optional(),
  school_id:             z.string().uuid().nullable().optional(),
  address_street:        z.string().max(200).nullable().optional(),
  address_city:          z.string().max(100).nullable().optional(),
  address_province:      z.enum(PROVINCES).nullable().optional(),
  address_postal_code:   z.string().max(10).nullable().optional(),
});

const UpdateChildSchema = CreateChildSchema.partial();

const AddGuardianSchema = z.object({
  user_id:      z.string().uuid(),
  relationship: z.enum(['parent','grandparent','foster_carer','other']),
  is_primary:   z.boolean().optional().default(false),
});

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/uncip-children/, '');
  const method = req.method;

  const auth = await requireUNCIPAuth(req);
  if (auth instanceof Response) return auth;
  const { profile, supabase } = auth;

  // GET /uncip-children
  if (method === 'GET' && path === '') {
    const page   = parseInt(url.searchParams.get('page')  ?? '1');
    const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('uncip_children')
      .select('*, uncip_guardian_links(*)', { count: 'exact' })
      .order('last_name')
      .range(offset, offset + limit - 1);

    if (error) return err(error.message, 500, cors);
    return json({
      data,
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    }, 200, cors);
  }

  // GET /uncip-children/:id
  if (method === 'GET' && /^\/[^/]+$/.test(path)) {
    const id = path.slice(1);
    const { data, error } = await supabase
      .from('uncip_children')
      .select('*, uncip_guardian_links(*), uncip_child_medical(*)')
      .eq('id', id)
      .single();
    if (error) return err('Child not found', 404, cors);
    return json({ data }, 200, cors);
  }

  // POST /uncip-children — parent or admin
  if (method === 'POST' && path === '') {
    if (!['parent','admin'].includes(profile.role)) return err('Forbidden', 403, cors);

    const body = await req.json();
    const parsed = CreateChildSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422, cors);

    const { data: child, error: insertError } = await supabase
      .from('uncip_children')
      .insert({ ...parsed.data, created_by: profile.id })
      .select()
      .single();

    if (insertError) return err(insertError.message, 500, cors);

    // Auto-link registering parent as primary guardian
    if (profile.role === 'parent') {
      await supabase.from('uncip_guardian_links').insert({
        child_id:     child.id,
        user_id:      profile.id,
        relationship: 'parent',
        is_primary:   true,
      });
    }

    return json({ data: child }, 201, cors);
  }

  // PATCH /uncip-children/:id — guardian or admin
  if (method === 'PATCH' && /^\/[^/]+$/.test(path)) {
    const id = path.slice(1);

    const body = await req.json();
    const parsed = UpdateChildSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422, cors);

    const { data, error } = await supabase
      .from('uncip_children')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single();

    // RLS will return no rows if caller lacks access — treat as 404
    if (error || !data) return err('Child not found or access denied', 404, cors);
    return json({ data }, 200, cors);
  }

  // POST /uncip-children/:id/guardians — admin only
  // Parents are auto-linked at registration. Admin manages subsequent guardian links.
  if (method === 'POST' && /^\/[^/]+\/guardians$/.test(path)) {
    if (profile.role !== 'admin') return err('Forbidden', 403, cors);

    const id = path.split('/')[1];
    const body = await req.json();
    const parsed = AddGuardianSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422, cors);

    const { data, error } = await supabase
      .from('uncip_guardian_links')
      .insert({ child_id: id, ...parsed.data })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return err('Guardian link already exists', 409, cors);
      return err(error.message, 500, cors);
    }
    return json({ data }, 201, cors);
  }

  return err('Not found', 404, cors);
});
