'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createApiClient } from '@moments/api';
import { createClient } from '@/lib/supabase/client';
import type { MediaRecord, AdminSession } from '@moments/api';
import { Upload, Trash2, ExternalLink, Image, FileAudio, FileVideo, File } from 'lucide-react';

async function getToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? '';
}

const TYPE_ICON: Record<string, React.ElementType> = {
  image: Image, audio: FileAudio, video: FileVideo, document: File,
};

const TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  image: 'default', audio: 'secondary', video: 'secondary', document: 'outline',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  initialData: MediaRecord[];
  session: AdminSession;
}

export function MediaClient({ initialData, session }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const canDelete = session.role === 'superadmin';
  const canUpload = session.role === 'superadmin' || session.role === 'content_admin';

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      const result = await api.media.upload(file);
      setFeedback(`Uploaded — ${result.mediaType} · ${result.url}`);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this media file? This cannot be undone.')) return;
    setDeleting(id);
    setError(null);
    try {
      const token = await getToken();
      const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
      await api.media.delete(id);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Media</h1>
          <p className="text-sm text-muted-foreground">Uploaded files stored in Supabase Storage — images, audio, video, documents</p>
        </div>
        {canUpload && (
          <div>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,audio/*,video/*,application/pdf" onChange={handleUpload} />
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        )}
      </div>

      {feedback && <p className="text-sm text-green-600 dark:text-green-400 break-all">{feedback}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {(['image', 'audio', 'video', 'document'] as const).map((type) => {
          const count = initialData.filter((m) => m.mediaType === type).length;
          const Icon = TYPE_ICON[type];
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground capitalize">{type}</CardTitle>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-xl font-semibold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>MIME</TableHead>
            <TableHead>Linked to</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No media uploaded yet.</TableCell>
            </TableRow>
          ) : initialData.map((m) => (
            <TableRow key={m.id}>
              <TableCell><Badge variant={TYPE_VARIANT[m.mediaType]}>{m.mediaType}</Badge></TableCell>
              <TableCell><span className="text-sm">{formatBytes(m.fileSize)}</span></TableCell>
              <TableCell><span className="text-xs text-muted-foreground">{m.mimeType ?? '—'}</span></TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {m.momentId ? `Moment` : m.messageId ? `Message` : '—'}
                </span>
              </TableCell>
              <TableCell><span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</span></TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {m.originalUrl && (
                    <a href={m.originalUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  {canDelete && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(m.id)} disabled={deleting === m.id}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
