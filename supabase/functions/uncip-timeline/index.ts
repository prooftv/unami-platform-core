import { z } from 'npm:zod@3';
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
  note:              z.string().max(2000).nullable().optional(),
  case_number:       z.string().max(100).nullable().optional(),
  sighting_location: z.string().max(500).nullable().optional(),
  sighting_lat:      z.number().nullable().optional(),
  sighting_lng:      z.number().nullable().optional(),
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
        alert_id:          alertId,
        actor_id:          profile.id,
        actor_role:        profile.role,
        actor_name:        profile.name ?? null,
        action:            parsed.data.action,
        note:              parsed.data.note ?? null,
        case_number:       parsed.data.action === 'authority_assigned_case'
                             ? (parsed.data.case_number ?? null)
                             : null,
        sighting_location: parsed.data.action === 'community_sighting_reported'
                             ? (parsed.data.sighting_location ?? null)
                             : null,
        sighting_lat:      parsed.data.action === 'community_sighting_reported'
                             ? (parsed.data.sighting_lat ?? null)
                             : null,
        sighting_lng:      parsed.data.action === 'community_sighting_reported'
                             ? (parsed.data.sighting_lng ?? null)
                             : null,
      })
      .select()
      .single();

    if (insertError) return err(insertError.message, 500, cors);

    // N2 — Dispatch notifications (post-commit, non-fatal)
    try {
      await dispatchNotifications(supabase, entry, profile.role);
    } catch (_) {
      // Notification failure never blocks the timeline entry
    }

    return json({ data: entry }, 201, cors);
  }

  return err('Not found', 404, cors);
});

// ---------------------------------------------------------------------------
// N2 — Notification dispatch
// Recipient resolution is institutional logic derived from the record model.
// Community is never a notification recipient.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function dispatchNotifications(supabase: any, entry: any, actorRole: string) {
  const alertId = entry.alert_id;

  // Fetch alert + child for jurisdiction/school resolution
  const { data: alert } = await supabase
    .from('uncip_alerts')
    .select('child_id, created_by')
    .eq('id', alertId)
    .single();
  if (!alert) return;

  const { data: child } = await supabase
    .from('uncip_children')
    .select('school_id')
    .eq('id', alert.child_id)
    .single();

  // Resolve recipient sets per action
  const recipientIds = new Set<string>();

  const addGuardians = async () => {
    const { data } = await supabase
      .from('uncip_guardian_links')
      .select('user_id')
      .eq('child_id', alert.child_id);
    (data ?? []).forEach((r: { user_id: string }) => recipientIds.add(r.user_id));
  };

  const addSchoolUsers = async () => {
    if (!child?.school_id) return;
    const { data } = await supabase
      .from('uncip_user_profiles')
      .select('id')
      .eq('school_id', child.school_id)
      .eq('role', 'school')
      .eq('is_active', true);
    (data ?? []).forEach((r: { id: string }) => recipientIds.add(r.id));
  };

  const addAuthorityUsers = async () => {
    if (!child?.school_id) return;
    // Jurisdiction: authority users at the school's station
    const { data: school } = await supabase
      .from('uncip_schools')
      .select('station_id')
      .eq('id', child.school_id)
      .single();
    if (!school?.station_id) return;
    const { data } = await supabase
      .from('uncip_user_profiles')
      .select('id')
      .eq('station_id', school.station_id)
      .eq('role', 'authority')
      .eq('is_active', true);
    (data ?? []).forEach((r: { id: string }) => recipientIds.add(r.id));
  };

  switch (entry.action) {
    case 'alert_raised':
      await addSchoolUsers();
      await addAuthorityUsers();
      break;
    case 'school_confirmed_last_seen':
      await addGuardians();
      await addAuthorityUsers();
      break;
    case 'authority_assigned_case':
      await addGuardians();
      break;
    case 'community_sighting_reported':
      await addGuardians();
      await addAuthorityUsers();
      break;
    case 'status_changed':
      await addGuardians();
      await addSchoolUsers();
      break;
    default:
      return; // note_added — no notification
  }

  // Remove the actor themselves from recipients
  recipientIds.delete(entry.actor_id);
  if (recipientIds.size === 0) return;

  // Resolve roles for each recipient
  const { data: profiles } = await supabase
    .from('uncip_user_profiles')
    .select('id, role')
    .in('id', [...recipientIds]);

  const roleMap = new Map<string, string>(
    (profiles ?? []).map((p: { id: string; role: string }) => [p.id, p.role])
  );

  const rows = [...recipientIds].map((id) => ({
    timeline_entry_id: entry.id,
    recipient_id:      id,
    recipient_role:    roleMap.get(id) ?? 'unknown',
  }));

  await supabase.from('uncip_notifications').insert(rows);
}
