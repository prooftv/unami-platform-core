import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logAudit, logError } from '../_shared/auth.ts';

const ACCEPTED_MIME: Record<string, 'image' | 'document' | 'pdf'> = {
  'image/jpeg':                                                          'image',
  'image/png':                                                           'image',
  'image/webp':                                                          'image',
  'application/pdf':                                                     'pdf',
  'application/msword':                                                  'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/evidence\/?/, '').split('/').filter(Boolean);

  try {
    // GET /evidence?moment_id=:id — list evidence for a moment (public + authenticated)
    if (req.method === 'GET' && parts.length === 0) {
      return await listEvidence(req, cors);
    }

    // POST /evidence — upload (authenticated, content_admin+)
    if (req.method === 'POST' && parts.length === 0) {
      return await uploadEvidence(req, cors);
    }

    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await logError(supabase, 'evidence_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

// ---------------------------------------------------------------------------
// List — public (anon) and authenticated
// ---------------------------------------------------------------------------

async function listEvidence(req: Request, cors: Record<string, string>) {
  const momentId = new URL(req.url).searchParams.get('moment_id');
  if (!momentId) return err('moment_id required', 400, cors);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Verify moment exists and is accessible
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    // Public request — only broadcasted + publish_to_pwa moments
    const { data: moment } = await supabase
      .from('moments')
      .select('id')
      .eq('id', momentId)
      .eq('status', 'broadcasted')
      .eq('publish_to_pwa', true)
      .single();
    if (!moment) return err('Moment not found', 404, cors);
  }

  const { data, error } = await supabase
    .from('evidence')
    .select('id, moment_id, title, file_type, storage_path, public_url, file_size, mime_type, uploaded_by, created_at')
    .eq('moment_id', momentId)
    .order('created_at', { ascending: true });

  if (error) return err(error.message, 500, cors);

  // Map to camelCase
  const mapped = (data ?? []).map((r) => ({
    id:          r.id,
    momentId:    r.moment_id,
    title:       r.title,
    fileType:    r.file_type,
    storageP:    r.storage_path,
    publicUrl:   r.public_url,
    fileSize:    r.file_size,
    mimeType:    r.mime_type,
    uploadedBy:  r.uploaded_by,
    createdAt:   r.created_at,
  }));

  return json(mapped, 200, cors);
}

// ---------------------------------------------------------------------------
// Upload — authenticated, content_admin+
// ---------------------------------------------------------------------------

async function uploadEvidence(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const formData = await req.formData();
  const momentId = formData.get('moment_id') as string | null;
  const title    = formData.get('title') as string | null;
  const file     = formData.get('file') as File | null;

  if (!momentId || !title || !file) {
    return err('moment_id, title, and file are required', 400, cors);
  }
  if (title.trim().length < 2) return err('Title must be at least 2 characters', 400, cors);
  if (file.size > MAX_FILE_SIZE) return err('File exceeds 10 MB limit', 413, cors);

  const fileType = ACCEPTED_MIME[file.type];
  if (!fileType) return err(`Unsupported file type: ${file.type}`, 415, cors);

  // Verify moment exists
  const { data: moment } = await supabase
    .from('moments')
    .select('id')
    .eq('id', momentId)
    .single();
  if (!moment) return err('Moment not found', 404, cors);

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() ?? 'bin';
  const storagePath = `evidence/${momentId}/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: storageError } = await supabase.storage
    .from('evidence')
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (storageError) {
    await logError(supabase, 'evidence_upload', storageError.message, { momentId, storagePath });
    return err('File upload failed', 500, cors);
  }

  const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(storagePath);

  // Insert metadata row — evidence is immutable, no update/delete
  const { data: record, error: insertError } = await supabase
    .from('evidence')
    .insert({
      moment_id:    momentId,
      title:        title.trim(),
      file_type:    fileType,
      storage_path: storagePath,
      public_url:   publicUrl,
      file_size:    file.size,
      mime_type:    file.type,
      uploaded_by:  context.userId,
    })
    .select()
    .single();

  if (insertError || !record) {
    await logError(supabase, 'evidence_insert', insertError?.message ?? 'Insert failed', { momentId });
    return err('Failed to record evidence', 500, cors);
  }

  await logAudit(supabase, context.userId, 'upload_evidence', 'evidence', record.id, { momentId, title, fileType });

  return json({
    id:         record.id,
    momentId:   record.moment_id,
    title:      record.title,
    fileType:   record.file_type,
    storageP:   record.storage_path,
    publicUrl:  record.public_url,
    fileSize:   record.file_size,
    mimeType:   record.mime_type,
    uploadedBy: record.uploaded_by,
    createdAt:  record.created_at,
  }, 201, cors);
}
