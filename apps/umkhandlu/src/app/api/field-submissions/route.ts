import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Shared secret between GratisGIS webhook and CC.
// Set FIELD_SUBMISSION_WEBHOOK_SECRET in Vercel env vars.
function verifySecret(req: NextRequest): boolean {
  const secret = process.env.FIELD_SUBMISSION_WEBHOOK_SECRET;
  if (!secret) return false;
  const provided = req.headers.get('x-webhook-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '');
  return provided === secret;
}

const VALID_ACTIVITY_TYPES = new Set([
  'locality_mapping',
  'infrastructure_inventory',
  'community_facilities',
  'development_monitoring',
  'notice_site_verification',
]);

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).gratisgis_submission_id !== 'string' ||
    typeof (body as Record<string, unknown>).gratisgis_collection_id !== 'string' ||
    typeof (body as Record<string, unknown>).activity_type !== 'string' ||
    typeof (body as Record<string, unknown>).collector_display_name !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Missing required fields: gratisgis_submission_id, gratisgis_collection_id, activity_type, collector_display_name.' },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;

  if (!VALID_ACTIVITY_TYPES.has(payload.activity_type as string)) {
    return NextResponse.json(
      { error: `Invalid activity_type. Must be one of: ${[...VALID_ACTIVITY_TYPES].join(', ')}.` },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // Idempotent upsert — safe to retry
  const { data: existing } = await supabase
    .from('field_submissions')
    .select('id, status')
    .eq('gratisgis_submission_id', payload.gratisgis_submission_id as string)
    .single();

  if (existing) {
    return NextResponse.json({ id: existing.id, status: existing.status, duplicate: true });
  }

  // Resolve or create collector record
  let collectorId: string | null = null;
  if (typeof payload.gratisgis_user_id === 'string' && payload.gratisgis_user_id) {
    const { data: collector } = await supabase
      .from('field_collectors')
      .select('id')
      .eq('gratisgis_user_id', payload.gratisgis_user_id)
      .single();

    if (collector) {
      collectorId = collector.id;
    } else {
      const { data: newCollector } = await supabase
        .from('field_collectors')
        .insert({
          gratisgis_user_id: payload.gratisgis_user_id,
          display_name: payload.collector_display_name as string,
          email: typeof payload.collector_email === 'string' ? payload.collector_email : null,
        })
        .select('id')
        .single();
      collectorId = newCollector?.id ?? null;
    }
  }

  const { data: submission, error } = await supabase
    .from('field_submissions')
    .insert({
      gratisgis_submission_id: payload.gratisgis_submission_id,
      gratisgis_collection_id: payload.gratisgis_collection_id,
      gratisgis_layer_id: typeof payload.gratisgis_layer_id === 'string' ? payload.gratisgis_layer_id : null,
      collector_id: collectorId,
      collector_display_name: payload.collector_display_name,
      activity_type: payload.activity_type,
      geometry_geojson: payload.geometry ?? null,
      geometry_type: typeof payload.geometry_type === 'string' ? payload.geometry_type : null,
      gps_accuracy_metres: typeof payload.gps_accuracy_metres === 'number' ? payload.gps_accuracy_metres : null,
      attributes: (typeof payload.attributes === 'object' && payload.attributes !== null) ? payload.attributes : {},
      status: 'pending',
      idempotency_key: payload.gratisgis_submission_id as string,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[field-submissions] insert error:', error.message);
    return NextResponse.json({ error: 'Failed to record submission.' }, { status: 500 });
  }

  // Record received event
  await supabase.from('field_submission_events').insert({
    submission_id: submission!.id,
    event_type: 'received',
    actor_type: 'system',
    metadata: {
      gratisgis_submission_id: payload.gratisgis_submission_id,
      gratisgis_collection_id: payload.gratisgis_collection_id,
    },
  });

  // Insert attachments if provided
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  if (attachments.length > 0) {
    await supabase.from('field_submission_attachments').insert(
      attachments
        .filter((a): a is Record<string, unknown> => typeof a === 'object' && a !== null)
        .map((a) => ({
          submission_id: submission!.id,
          gratisgis_attachment_id: String(a.id ?? ''),
          filename: String(a.filename ?? 'attachment'),
          mime_type: typeof a.mime_type === 'string' ? a.mime_type : null,
          size_bytes: typeof a.size_bytes === 'number' ? a.size_bytes : null,
          gratisgis_url: String(a.url ?? ''),
          caption: typeof a.caption === 'string' ? a.caption : null,
        })),
    );
  }

  return NextResponse.json({ id: submission!.id, status: 'pending' }, { status: 201 });
}
