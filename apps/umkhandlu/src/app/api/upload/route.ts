import { type NextRequest, NextResponse } from 'next/server';
import { getOperatorSession } from '@/lib/auth/operator';
import { createServiceClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

const BUCKET_MAP = {
  'field-evidence': { maxBytes: 52_428_800, allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'] },
  'governance-evidence': { maxBytes: 52_428_800, allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip'] },
  'public-assets': { maxBytes: 10_485_760, allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'] },
  'spatial-exports': { maxBytes: 104_857_600, allowedMime: ['application/json', 'application/zip', 'text/plain', 'application/geo+json'] },
} as const;

type BucketId = keyof typeof BUCKET_MAP;

export async function POST(req: NextRequest) {
  const session = await getOperatorSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const bucketId = req.nextUrl.searchParams.get('bucket') as BucketId | null;
  if (!bucketId || !(bucketId in BUCKET_MAP)) {
    return NextResponse.json(
      { error: `bucket must be one of: ${Object.keys(BUCKET_MAP).join(', ')}` },
      { status: 400 },
    );
  }

  const submissionId = req.nextUrl.searchParams.get('submissionId') ?? undefined;
  const noticeId = req.nextUrl.searchParams.get('noticeId') ?? undefined;

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });

  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

  const config = BUCKET_MAP[bucketId];

  if (!config.allowedMime.includes(file.type as never)) {
    return NextResponse.json(
      { error: `MIME type ${file.type} not allowed in ${bucketId}.` },
      { status: 415 },
    );
  }

  if (file.size > config.maxBytes) {
    return NextResponse.json(
      { error: `File exceeds ${config.maxBytes / 1_048_576}MB limit for ${bucketId}.` },
      { status: 413 },
    );
  }

  const bytes = await file.arrayBuffer();
  const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
  const ext = file.name.split('.').pop() ?? 'bin';
  const storagePath = `${session.id}/${Date.now()}-${hash.slice(0, 8)}.${ext}`;

  const supabase = createServiceClient();

  const { error: uploadError } = await supabase.storage
    .from(bucketId)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[upload] storage error:', uploadError.message);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }

  const publicUrl = bucketId === 'public-assets'
    ? supabase.storage.from(bucketId).getPublicUrl(storagePath).data.publicUrl
    : null;

  const { data: record, error: metaError } = await supabase
    .from('storage_objects')
    .insert({
      bucket_id: bucketId,
      storage_path: storagePath,
      public_url: publicUrl,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      file_hash: hash,
      uploaded_by: session.email,
      submission_id: submissionId ?? null,
      notice_id: noticeId ?? null,
      access_class: bucketId === 'public-assets' ? 'approved-public' : 'private',
      migration_state: 'native',
    })
    .select('id')
    .single();

  if (metaError) {
    // Attempt cleanup — don't leave orphaned storage objects
    await supabase.storage.from(bucketId).remove([storagePath]);
    return NextResponse.json({ error: 'Metadata record failed.' }, { status: 500 });
  }

  await supabase.from('gis_audit_log').insert({
    table_name: 'storage_objects',
    record_id: record!.id,
    actor: session.email,
    action: 'create',
    reason: `File uploaded to ${bucketId}`,
    new_state: { bucket_id: bucketId, filename: file.name, size_bytes: file.size, hash },
  });

  return NextResponse.json({
    id: record!.id,
    bucket: bucketId,
    path: storagePath,
    publicUrl,
    filename: file.name,
    sizeBytes: file.size,
  }, { status: 201 });
}
