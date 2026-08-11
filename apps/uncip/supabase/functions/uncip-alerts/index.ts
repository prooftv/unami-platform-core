import { z } from 'https://esm.sh/zod@3';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { requireUNCIPAuth, corsHeaders, json, err, UNCIPRole } from '../_shared/uncip-auth.ts';

const CreateAlertSchema = z.object({
  child_id:           z.string().uuid(),
  alert_type:         z.enum(['missing','medical','danger','other']),
  description:        z.string().min(10).max(2000),
  last_seen_at:       z.string().datetime(),
  last_seen_location: z.string().min(1).max(500),
  last_seen_wearing:  z.string().max(500).nullable().optional(),
  contact_phone:      z.string().min(7).max(20),
});

const StatusTransitionSchema = z.object({
  status: z.enum(['resolved','cancelled','false_alarm']),
  note:   z.string().max(1000).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Permission rules from Decision 3
// ---------------------------------------------------------------------------

// Which roles may create which alert types
const ALERT_CREATE_PERMISSIONS: Record<UNCIPRole, string[]> = {
  admin:     ['missing','medical','danger','other'],
  parent:    ['missing','medical','danger','other'],
  school:    ['medical'],                            // Decision 3a
  authority: [],
  community: [],
};

// Which roles may perform which status transitions (Decision 3b)
const STATUS_TRANSITION_PERMISSIONS: Record<UNCIPRole, string[]> = {
  admin:     ['resolved','cancelled','false_alarm'],
  parent:    ['cancelled','false_alarm'],             // Decision 3b — no resolved
  school:    [],
  authority: ['resolved','cancelled','false_alarm'],
  community: [],
};

// ---------------------------------------------------------------------------
// Service client — used only for pre-flight checks that need elevated access
// ---------------------------------------------------------------------------

function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/uncip-alerts/, '');
  const method = req.method;

  const auth = await requireUNCIPAuth(req);
  if (auth instanceof Response) return auth;
  const { profile, supabase } = auth;

  // GET /uncip-alerts
  if (method === 'GET' && path === '') {
    const page      = parseInt(url.searchParams.get('page')  ?? '1');
    const limit     = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
    const offset    = (page - 1) * limit;
    const status    = url.searchParams.get('status');
    const alertType = url.searchParams.get('alert_type');
    const childId   = url.searchParams.get('child_id');

    let query = supabase
      .from('uncip_alerts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status)    query = query.eq('status', status);
    if (alertType) query = query.eq('alert_type', alertType);
    if (childId)   query = query.eq('child_id', childId);

    const { data, error, count } = await query;
    if (error) return err(error.message, 500, cors);
    return json({
      data,
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    }, 200, cors);
  }

  // GET /uncip-alerts/:id — includes timeline
  if (method === 'GET' && /^\/[^/]+$/.test(path)) {
    const id = path.slice(1);
    const { data, error } = await supabase
      .from('uncip_alerts')
      .select('*, uncip_alert_timeline(*)')
      .eq('id', id)
      .order('timestamp', { referencedTable: 'uncip_alert_timeline', ascending: true })
      .single();
    if (error) return err('Alert not found', 404, cors);
    return json({ data }, 200, cors);
  }

  // POST /uncip-alerts — create alert
  if (method === 'POST' && path === '') {
    const allowed = ALERT_CREATE_PERMISSIONS[profile.role];
    if (!allowed || allowed.length === 0) return err('Forbidden', 403, cors);

    const body = await req.json();
    const parsed = CreateAlertSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422, cors);

    // Role-level alert type permission (Decision 3a)
    if (!allowed.includes(parsed.data.alert_type)) {
      return err(`Role '${profile.role}' may not create alert type '${parsed.data.alert_type}'`, 403, cors);
    }

    // Decision 1: missing alert requires identification_number
    if (parsed.data.alert_type === 'missing') {
      const svc = serviceClient();
      const { data: child } = await svc
        .from('uncip_children')
        .select('identification_number')
        .eq('id', parsed.data.child_id)
        .single();

      if (!child?.identification_number) {
        return err(
          'A missing-child alert requires an identification number on the child record. Please update the child profile first.',
          422,
          cors,
        );
      }
    }

    // Insert alert
    const { data: alert, error: alertError } = await supabase
      .from('uncip_alerts')
      .insert({ ...parsed.data, created_by: profile.id })
      .select()
      .single();

    if (alertError) return err(alertError.message, 500, cors);

    // Insert alert_raised timeline entry
    await supabase.from('uncip_alert_timeline').insert({
      alert_id:   alert.id,
      actor_id:   profile.id,
      actor_role: profile.role,
      action:     'alert_raised',
    });

    return json({ data: alert }, 201, cors);
  }

  // PATCH /uncip-alerts/:id/status — status transition
  if (method === 'PATCH' && /^\/[^/]+\/status$/.test(path)) {
    const id = path.split('/')[1];

    const allowed = STATUS_TRANSITION_PERMISSIONS[profile.role];
    if (!allowed || allowed.length === 0) return err('Forbidden', 403, cors);

    const body = await req.json();
    const parsed = StatusTransitionSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422, cors);

    // Decision 3b: check role is permitted for this specific transition
    if (!allowed.includes(parsed.data.status)) {
      return err(`Role '${profile.role}' may not transition alert to '${parsed.data.status}'`, 403, cors);
    }

    // Fetch current alert to validate it's active
    const { data: existing, error: fetchError } = await supabase
      .from('uncip_alerts')
      .select('id, status, created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existing) return err('Alert not found', 404, cors);
    if (existing.status !== 'active') return err('Alert is already closed', 409, cors);

    // Parent can only transition their own alerts (Decision 3b)
    if (profile.role === 'parent' && existing.created_by !== profile.id) {
      return err('Forbidden', 403, cors);
    }

    const resolvedFields = parsed.data.status === 'resolved'
      ? { resolved_at: new Date().toISOString(), resolved_by: profile.id }
      : {};

    const { data: updated, error: updateError } = await supabase
      .from('uncip_alerts')
      .update({ status: parsed.data.status, ...resolvedFields })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) return err('Update failed', 500, cors);

    // Insert status_changed timeline entry
    await supabase.from('uncip_alert_timeline').insert({
      alert_id:   id,
      actor_id:   profile.id,
      actor_role: profile.role,
      action:     'status_changed',
      note:       parsed.data.note ?? `Status changed to ${parsed.data.status}`,
    });

    return json({ data: updated }, 200, cors);
  }

  return err('Not found', 404, cors);
});
