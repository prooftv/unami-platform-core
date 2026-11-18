import { type NextRequest, NextResponse } from 'next/server';
import { getOperatorSession } from '@/lib/auth/operator';
import { createServiceClient } from '@/lib/supabase/server';

// Allowed MIME types for proxied attachments
const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'video/'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Require authenticated operator session — no anonymous access
  const session = await getOperatorSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch attachment record — verify it exists and belongs to a real submission
  const { data: attachment, error } = await supabase
    .from('field_submission_attachments')
    .select('id, filename, mime_type, gratisgis_url, submission_id')
    .eq('id', id)
    .single();

  if (error || !attachment) {
    return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
  }

  // Verify the parent submission exists (defence in depth)
  const { data: submission } = await supabase
    .from('field_submissions')
    .select('id, status')
    .eq('id', attachment.submission_id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found.' }, { status: 404 });
  }

  const sourceUrl = attachment.gratisgis_url;
  if (!sourceUrl) {
    return NextResponse.json({ error: 'Attachment has no source URL.' }, { status: 404 });
  }

  // Validate MIME type before proxying
  const mime = attachment.mime_type ?? 'application/octet-stream';
  const allowed = ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
  if (!allowed) {
    return NextResponse.json({ error: 'Attachment type not supported for preview.' }, { status: 415 });
  }

  // Proxy the file through the server — never expose the source URL to the client
  try {
    const upstream = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Umkhandlu-CC/1.0' },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream fetch failed: ${upstream.status}` },
        { status: 502 },
      );
    }

    const body = await upstream.arrayBuffer();

    // Log access for audit trail
    await supabase.from('gis_audit_log').insert({
      table_name: 'field_submission_attachments',
      record_id: attachment.id,
      actor: session.email,
      action: 'update', // closest available action — represents an access event
      reason: `Operator accessed attachment for submission ${attachment.submission_id}`,
      new_state: { accessed_by: session.email, submission_status: submission.status },
    });

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="${attachment.filename}"`,
        // Prevent caching of private evidence
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[attachment-proxy] fetch error:', err);
    return NextResponse.json({ error: 'Failed to retrieve attachment.' }, { status: 502 });
  }
}
