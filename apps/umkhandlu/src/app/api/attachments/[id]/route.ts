import { type NextRequest, NextResponse } from 'next/server';
import { getOperatorSession } from '@/lib/auth/operator';
import { createServiceClient } from '@/lib/supabase/server';

const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'video/', 'application/zip', 'application/json'];
const SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOperatorSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();

  // Check storage_objects first (native Supabase Storage)
  const { data: storageObj } = await supabase
    .from('storage_objects')
    .select('id, bucket_id, storage_path, filename, mime_type, submission_id, notice_id, access_class, deleted_at')
    .eq('id', id)
    .single();

  if (storageObj) {
    if (storageObj.deleted_at) {
      return NextResponse.json({ error: 'File has been deleted.' }, { status: 410 });
    }

    // For public-assets, redirect to public URL
    if (storageObj.bucket_id === 'public-assets') {
      const { data } = supabase.storage.from('public-assets').getPublicUrl(storageObj.storage_path);
      return NextResponse.redirect(data.publicUrl);
    }

    // For private buckets, generate a short-lived signed URL and proxy through
    const { data: signedData, error: signError } = await supabase.storage
      .from(storageObj.bucket_id)
      .createSignedUrl(storageObj.storage_path, SIGNED_URL_EXPIRY_SECONDS);

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'Could not generate access URL.' }, { status: 500 });
    }

    const mime = storageObj.mime_type ?? 'application/octet-stream';
    const upstream = await fetch(signedData.signedUrl);
    if (!upstream.ok) {
      return NextResponse.json({ error: 'File retrieval failed.' }, { status: 502 });
    }

    const body = await upstream.arrayBuffer();

    await supabase.from('gis_audit_log').insert({
      table_name: 'storage_objects',
      record_id: storageObj.id,
      actor: session.email,
      action: 'update',
      reason: `Operator accessed file from ${storageObj.bucket_id}`,
      new_state: { accessed_by: session.email },
    });

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="${storageObj.filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // Fall back to field_submission_attachments (legacy GratisGIS records)
  const { data: attachment, error } = await supabase
    .from('field_submission_attachments')
    .select('id, filename, mime_type, gratisgis_url, submission_id')
    .eq('id', id)
    .single();

  if (error || !attachment) {
    return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
  }

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

  const mime = attachment.mime_type ?? 'application/octet-stream';
  const allowed = ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
  if (!allowed) {
    return NextResponse.json({ error: 'Attachment type not supported for preview.' }, { status: 415 });
  }

  try {
    const upstream = await fetch(sourceUrl, { headers: { 'User-Agent': 'Umkhandlu-CC/1.0' } });
    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream fetch failed: ${upstream.status}` }, { status: 502 });
    }

    const body = await upstream.arrayBuffer();

    await supabase.from('gis_audit_log').insert({
      table_name: 'field_submission_attachments',
      record_id: attachment.id,
      actor: session.email,
      action: 'update',
      reason: `Operator accessed GratisGIS attachment for submission ${attachment.submission_id}`,
      new_state: { accessed_by: session.email, submission_status: submission.status },
    });

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="${attachment.filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[attachment-proxy] fetch error:', err);
    return NextResponse.json({ error: 'Failed to retrieve attachment.' }, { status: 502 });
  }
}
