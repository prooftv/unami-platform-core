import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logError } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/user-profiles\/?/, '').split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && parts.length === 0) return await listProfiles(req, cors);
    if (req.method === 'GET' && parts.length === 1) return await getProfile(req, parts[0], cors);
    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await logError(supabase, 'user_profiles_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

function mapProfile(row: Record<string, unknown>) {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    reputationScore: row.reputation_score,
    totalComments: row.total_comments,
    totalFeatured: row.total_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listProfiles(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit ?? '20')));
  const search = params.search ?? '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .order('reputation_score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.or(`display_name.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500, cors);

  return json({
    data: (data ?? []).map(mapProfile),
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  }, 200, cors);
}

async function getProfile(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return err('Profile not found', 404, cors);
  return json(mapProfile(data), 200, cors);
}
