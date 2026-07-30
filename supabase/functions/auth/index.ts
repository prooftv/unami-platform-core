import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json, err } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'GET') return err('Method not allowed', 405, cors);

  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return err('Unauthorized', 401, cors);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Validate JWT server-side — never trust cookie claims alone
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return err('Unauthorized', 401, cors);

  // Load role from admin_roles
  const { data: roleData } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  // Load authority_id if this user is also an authority
  // user_identifier is TEXT (phone or user ID) — matches user.id for admin users
  const { data: authorityData } = await supabase
    .from('authority_profiles')
    .select('id')
    .eq('user_identifier', user.id)
    .eq('status', 'active')
    .maybeSingle();

  return json({
    id: user.id,
    email: user.email ?? '',
    role: roleData?.role ?? 'viewer',
    authority_id: authorityData?.id ?? null,
  }, 200, cors);
});
