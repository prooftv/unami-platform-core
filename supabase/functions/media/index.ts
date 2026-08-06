import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { requireAuth, corsHeaders, json, err, logError } from '../_shared/auth.ts';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'audio/mpeg', 'audio/ogg', 'audio/wav',
  'video/mp4', 'video/webm',
  'application/pdf',
]);

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16 MB
const STORAGE_BUCKET = 'moments-media';

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/media\/?/, '').split('/').filter(Boolean);

  try {
    // POST /media — upload file
    if (req.method === 'POST' && parts.length === 0) {
      return await uploadMedia(req, cors);
    }

    // GET /media — list media records
    if (req.method === 'GET' && parts.length === 0) {
      return await listMedia(req, cors);
    }

    // DELETE /media/:id — delete media record + storage object
    if (req.method === 'DELETE' && parts.length === 1) {
      return await deleteMedia(req, parts[0], cors);
    }

    return err('Not found', 404, cors);
  } catch (e) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await logError(supabase, 'media_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});

async function uploadMedia(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const contentType = req.headers.get('Content-Type') ?? '';
  if (!contentType.startsWith('multipart/form-data')) {
    return err('Expected multipart/form-data', 400, cors);
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const momentId = formData.get('moment_id') as string | null;
  const messageId = formData.get('message_id') as string | null;

  if (!file) return err('No file provided', 400, cors);
  if (!ALLOWED_MIME_TYPES.has(file.type)) return err('Unsupported file type', 415, cors);
  if (file.size > MAX_FILE_SIZE) return err('File exceeds 16 MB limit', 413, cors);

  const ext = file.name.split('.').pop() ?? 'bin';
  const storagePath = `${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) return err(uploadError.message, 500, cors);

  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  const mediaType = file.type.startsWith('image/') ? 'image'
    : file.type.startsWith('audio/') ? 'audio'
    : file.type.startsWith('video/') ? 'video'
    : 'document';

  const { data: record, error: dbError } = await supabase
    .from('media')
    .insert({
      moment_id: momentId ?? null,
      message_id: messageId ?? null,
      media_type: mediaType,
      storage_path: storagePath,
      original_url: publicUrl,
      file_size: file.size,
      mime_type: file.type,
      processed: true,
    })
    .select()
    .single();

  if (dbError) return err(dbError.message, 500, cors);

  return json({ id: record.id, url: publicUrl, storagePath, mediaType }, 201, cors);
}

async function listMedia(req: Request, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin', 'content_admin', 'moderator', 'viewer']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const momentId = params.moment_id;
  const messageId = params.message_id;

  let query = supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (momentId) query = query.eq('moment_id', momentId);
  if (messageId) query = query.eq('message_id', messageId);

  const { data, error } = await query;
  if (error) return err(error.message, 500, cors);

  return json({ data }, 200, cors);
}

async function deleteMedia(req: Request, id: string, cors: Record<string, string>) {
  const auth = await requireAuth(req, ['superadmin']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  const { data: record } = await supabase
    .from('media')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (!record) return err('Media not found', 404, cors);

  // Delete from storage first
  if (record.storage_path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([record.storage_path]);
  }

  const { error } = await supabase.from('media').delete().eq('id', id);
  if (error) return err(error.message, 500, cors);

  return json({ success: true }, 200, cors);
}
