import { z } from 'npm:zod@3';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireUNCIPAuth, corsHeaders, json, err, UNCIPRole } from '../_shared/uncip-auth.ts';

// ─── Constants ────────────────────────────────────────────────────────────────

const SIGNED_URL_TTL = 3600; // 1 hour

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── Upload permission tables ─────────────────────────────────────────────────

// Roles permitted to upload alert-level media
const ALERT_MEDIA_UPLOAD_ROLES: UNCIPRole[] = ['admin', 'parent', 'authority'];

// Roles permitted to upload timeline media, keyed by action
const TIMELINE_MEDIA_UPLOAD_PERMISSIONS: Record<string, UNCIPRole[]> = {
  school_confirmed_last_seen:   ['admin', 'school'],
  authority_assigned_case:      ['admin', 'authority'],
  community_sighting_reported:  ['admin', 'community'],
  note_added:                   ['admin', 'parent', 'school', 'authority', 'community'],
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const RequestUploadSchema = z.object({
  scope:             z.enum(['alert', 'timeline']),
  alert_id:          z.string().uuid(),
  timeline_entry_id: z.string().uuid().optional(),
  mime_type:         z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  file_size:         z.number().int().positive().max(MAX_FILE_SIZE),
  label:             z.string().max(200).nullable().optional(),
});

// ─── Service client ───────────────────────────────────────────────────────────

function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

function ext(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png',
    'image/webp': 'webp', 'application/pdf': 'pdf',
  };
  return map[mime] ?? 'bin';
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const url    = new URL(req.url);
  const path   = url.pathname.replace(/^\/uncip-media/, '');
  const method = req.method;

  const auth = await requireUNCIPAuth(req);
  if (auth instanceof Response) return auth;
  const { profile, supabase } = auth;

  const svc = serviceClient();

  // ── POST /uncip-media/upload — request a signed upload URL ──────────────────
  if (method === 'POST' && path === '/upload') {
    const body   = await req.json();
    const parsed = RequestUploadSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message, 422, cors);

    const { scope, alert_id, timeline_entry_id, mime_type, file_size, label } = parsed.data;

    // Verify alert is visible to this user (RLS on supabase client)
    const { data: alert, error: alertErr } = await supabase
      .from('uncip_alerts')
      .select('id, status, child_id')
      .eq('id', alert_id)
      .single();
    if (alertErr || !alert) return err('Alert not found', 404, cors);
    if (alert.status !== 'active') return err('Alert is not active', 409, cors);

    if (scope === 'alert') {
      // Check upload permission
      if (!ALERT_MEDIA_UPLOAD_ROLES.includes(profile.role)) {
        return err('Forbidden', 403, cors);
      }

      const fileId      = crypto.randomUUID();
      const storagePath = `${alert_id}/${fileId}.${ext(mime_type)}`;

      // Create signed upload URL via service client
      const { data: uploadData, error: uploadErr } = await svc.storage
        .from('alert-media')
        .createSignedUploadUrl(storagePath);
      if (uploadErr || !uploadData) return err('Failed to create upload URL', 500, cors);

      // Pre-register the media row (storage_path known before upload completes)
      const { data: mediaRow, error: insertErr } = await svc
        .from('uncip_alert_media')
        .insert({
          alert_id,
          uploaded_by:   profile.id,
          uploader_role: profile.role,
          storage_path:  storagePath,
          mime_type,
          file_size,
          label:         label ?? null,
        })
        .select()
        .single();
      if (insertErr) return err(insertErr.message, 500, cors);

      return json({ data: { media_id: mediaRow.id, upload_url: uploadData.signedUrl, path: storagePath } }, 201, cors);
    }

    if (scope === 'timeline') {
      if (!timeline_entry_id) return err('timeline_entry_id is required for timeline scope', 422, cors);

      // Fetch the timeline entry to check action type
      const { data: entry, error: entryErr } = await supabase
        .from('uncip_alert_timeline')
        .select('id, action, actor_id, actor_role')
        .eq('id', timeline_entry_id)
        .eq('alert_id', alert_id)
        .single();
      if (entryErr || !entry) return err('Timeline entry not found', 404, cors);

      // Check role is permitted for this action
      const permitted = TIMELINE_MEDIA_UPLOAD_PERMISSIONS[entry.action] ?? [];
      if (!permitted.includes(profile.role)) {
        return err(`Role '${profile.role}' may not attach media to '${entry.action}'`, 403, cors);
      }

      // Non-admin: can only attach to their own timeline entries
      if (profile.role !== 'admin' && entry.actor_id !== profile.id) {
        return err('Forbidden', 403, cors);
      }

      const fileId      = crypto.randomUUID();
      const storagePath = `${alert_id}/${timeline_entry_id}/${fileId}.${ext(mime_type)}`;

      const { data: uploadData, error: uploadErr } = await svc.storage
        .from('timeline-media')
        .createSignedUploadUrl(storagePath);
      if (uploadErr || !uploadData) return err('Failed to create upload URL', 500, cors);

      const { data: mediaRow, error: insertErr } = await svc
        .from('uncip_timeline_media')
        .insert({
          timeline_entry_id,
          alert_id,
          uploaded_by:   profile.id,
          uploader_role: profile.role,
          storage_path:  storagePath,
          mime_type,
          file_size,
          label:         label ?? null,
        })
        .select()
        .single();
      if (insertErr) return err(insertErr.message, 500, cors);

      return json({ data: { media_id: mediaRow.id, upload_url: uploadData.signedUrl, path: storagePath } }, 201, cors);
    }

    return err('Invalid scope', 422, cors);
  }

  // ── GET /uncip-media/signed?path=...&bucket=... — get a signed read URL ─────
  if (method === 'GET' && path === '/signed') {
    const storagePath = url.searchParams.get('path');
    const bucket      = url.searchParams.get('bucket');

    if (!storagePath || !bucket) return err('path and bucket are required', 400, cors);
    if (!['alert-media', 'timeline-media'].includes(bucket)) return err('Invalid bucket', 400, cors);

    // Verify the requester has access to this media row
    const table = bucket === 'alert-media' ? 'uncip_alert_media' : 'uncip_timeline_media';
    const { data: row, error: rowErr } = await supabase
      .from(table)
      .select('id, alert_id, uploader_role')
      .eq('storage_path', storagePath)
      .single();

    if (rowErr || !row) return err('Media not found', 404, cors);

    // Community: only signed URLs for community-uploaded timeline media
    if (profile.role === 'community' && bucket === 'timeline-media' && row.uploader_role !== 'community') {
      return err('Forbidden', 403, cors);
    }

    const { data: signedData, error: signedErr } = await svc.storage
      .from(bucket)
      .createSignedUrl(storagePath, SIGNED_URL_TTL);
    if (signedErr || !signedData) return err('Failed to create signed URL', 500, cors);

    return json({ data: { signed_url: signedData.signedUrl, expires_in: SIGNED_URL_TTL } }, 200, cors);
  }

  // ── GET /uncip-media/alert/:alertId — list alert-level media ────────────────
  if (method === 'GET' && /^\/alert\/[^/]+$/.test(path)) {
    const alertId = path.split('/')[2];
    const { data, error } = await supabase
      .from('uncip_alert_media')
      .select('id, alert_id, uploader_role, storage_path, mime_type, file_size, label, created_at')
      .eq('alert_id', alertId)
      .order('created_at', { ascending: true });
    if (error) return err(error.message, 500, cors);
    return json({ data }, 200, cors);
  }

  // ── GET /uncip-media/timeline/:entryId — list timeline-entry media ───────────
  if (method === 'GET' && /^\/timeline\/[^/]+$/.test(path)) {
    const entryId = path.split('/')[2];

    let query = supabase
      .from('uncip_timeline_media')
      .select('id, timeline_entry_id, alert_id, uploader_role, storage_path, mime_type, file_size, label, created_at')
      .eq('timeline_entry_id', entryId)
      .order('created_at', { ascending: true });

    // Community: only their own uploads
    if (profile.role === 'community') {
      query = query.eq('uploader_role', 'community');
    }

    const { data, error } = await query;
    if (error) return err(error.message, 500, cors);
    return json({ data }, 200, cors);
  }

  return err('Not found', 404, cors);
});
