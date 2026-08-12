import { z } from 'npm:zod@3';
import { requireUNCIPAuth, corsHeaders, json, err } from '../_shared/uncip-auth.ts';

const CreateStationSchema = z.object({
  name:          z.string().min(1).max(200),
  province:      z.enum(['eastern_cape','free_state','gauteng','kwazulu_natal','limpopo','mpumalanga','north_west','northern_cape','western_cape']),
  district:      z.string().max(200).nullable().optional(),
  contact_phone: z.string().max(20).nullable().optional(),
  lat:           z.number().nullable().optional(),
  lng:           z.number().nullable().optional(),
});

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/uncip-stations/, '');
  const method = req.method;

  const auth = await requireUNCIPAuth(req);
  if (auth instanceof Response) return auth;
  const { profile, supabase } = auth;

  // GET /uncip-stations
  if (method === 'GET' && path === '') {
    const province = url.searchParams.get('province');
    let query = supabase.from('uncip_saps_stations').select('*').order('name');
    if (province) query = query.eq('province', province);
    const { data, error } = await query;
    if (error) return err(error.message, 500, cors);
    return json({ data }, 200, cors);
  }

  // GET /uncip-stations/:id
  if (method === 'GET' && /^\/[^/]+$/.test(path)) {
    const id = path.slice(1);
    const { data, error } = await supabase
      .from('uncip_saps_stations').select('*').eq('id', id).single();
    if (error) return err('Station not found', 404, cors);
    return json({ data }, 200, cors);
  }

  // POST /uncip-stations — admin only
  if (method === 'POST' && path === '') {
    if (profile.role !== 'admin') return err('Forbidden', 403, cors);
    const body = await req.json();
    const parsed = CreateStationSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422, cors);
    const { data, error } = await supabase
      .from('uncip_saps_stations').insert(parsed.data).select().single();
    if (error) return err(error.message, 500, cors);
    return json({ data }, 201, cors);
  }

  return err('Not found', 404, cors);
});
