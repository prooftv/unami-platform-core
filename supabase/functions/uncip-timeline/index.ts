import { z } from 'https://esm.sh/zod@3';
import { requireUNCIPAuth, corsHeaders, json, err, UNCIPRole } from '../_shared/uncip-auth.ts';

const AddTimelineEntrySchema = z.object({
  action: z.enum([
    'alert_raised',
    'school_confirmed_last_seen',
    'authority_assigned_case',
    'community_sighting_reported',
    'status_changed',
    'note_added',
  ]),
  note: z.string().max(2000).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Decision 3 — approved permission table
// ---------------------------------------------------------------------------

const TIMELINE_ACTION_PERMISSIONS: Record<UNCIPRole, string[]> = {
  admin:     ['alert_raised','school_confirmed_last_seen','authority_assigned_case','community_sighting_reported','status_changed','note_added'],
  parent:    ['alert_raised','status_changed','note_added'],
  school:    ['alert_raised','school_confirmed_last_seen','note_added'],
  authority: ['authority_assigned_case','status_changed','note_added'],
  community: ['community_sighting_reported','note_added'],
};

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/uncip-timeline/, '');
  const method = req.method;

  const auth = await requireUNCIPAuth(req);
  if (auth instanceof Response) return auth;
  const { profile, supabase } = auth;

  // GET /uncip-timeline?alert_id=:id — read timeline for an alert
  if (method === 'GET' && path === '') {
    const alertId = url.searchParams.get('alert_id');
    if (!alertId) return err('alert_id is required', 400, cors);

    const { data, error } = await supabase
      .from('uncip_alert_timeline')
      .select('*')
      .eq('alert_id', alertId)
      .order('timestamp', { ascending: true });

    if (error) return err(error.message, 500, cors);
    return json({ data }, 200, cors);
  }

  // POST /uncip-timeline — append timeline entry
  if (method === 'POST' && path === '') {
    const body = await req.json();

    // alert_id comes from body for POST
    const alertId = body?.alert_id;
    if (!alertId || typeof alertId !== 'string') return err('alert_id is required', 400, cors);

    const parsed = AddTimelineEntrySchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422, cors);

    // Check role permission for this action (Decision 3)
    const allowed = TIMELINE_ACTION_PERMISSIONS[profile.role];
    if (!allowed.includes(parsed.data.action)) {
      return err(`Role '${profile.role}' may not perform action '${parsed.data.action}'`, 403, cors);
    }

    // Verify alert exists and is visible to this user (RLS handles scope)
    const { data: alert, error: alertError } = await supabase
      .from('uncip_alerts')
      .select('id, status, created_by')
      .eq('id', alertId)
      .single();

    if (alertError || !alert) return err('Alert not found', 404, cors);

    // status_changed via timeline endpoint is note-only — actual status transitions
    // go through PATCH /uncip-alerts/:id/status
    if (parsed.data.action === 'status_changed') {
      return err('Use PATCH /uncip-alerts/:id/status for status transitions', 400, cors);
    }

    // alert_raised should only be inserted by the alerts function at creation time
    if (parsed.data.action === 'alert_raised') {
      return err('alert_raised is created automatically when an alert is raised', 400, cors);
    }

    const { data: entry, error: insertError } = await supabase
      .from('uncip_alert_timeline')
      .insert({
        alert_id:   alertId,
        actor_id:   profile.id,
        actor_role: profile.role,
        action:     parsed.data.action,
        note:       parsed.data.note ?? null,
      })
      .select()
      .single();

    if (insertError) return err(insertError.message, 500, cors);
    return json({ data: entry }, 201, cors);
  }

  return err('Not found', 404, cors);
});
