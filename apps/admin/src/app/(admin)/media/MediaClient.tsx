'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, KPIGrid, BulkActionBar } from '@moments/ui';
import { createApiClient } from '@moments/api';
import { getToken } from '@/lib/auth/token';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import type { MediaRecord, AdminSession } from '@moments/api';
import type { LucideIcon } from 'lucide-react';
import { Upload, Trash2, ExternalLink, Image, FileAudio, FileVideo, File } from 'lucide-react';

const TYPE_ICON: Record<string, LucideIcon> = {
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
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [, startTransition] = useTransition();

  const canDelete = session.role === 'superadmin';
  const canUpload = session.role === 'superadmin' || session.role === 'content_admin';

  const { selected, toggle, toggleAll, clear, selectedCount } =
    useBulkSelection<MediaRecord>((m) => m.id);

  function getApi(token: string) {
    return createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setFeedback(null);
    try {
      const token = await getToken();
      const result = await getApi(token).media.upload(file);
      setFeedback(`Uploaded — ${result.mediaType}`);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    setError(null);
    try {
      const token = await getToken();
      await getApi(token).media.delete(id);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function bulkDelete() {
    if (selectedCount === 0) return;
    if (!confirm(`Permanently delete ${selectedCount} file${selectedCount > 1 ? 's' : ''}?`)) return;
    setBulkPending(true);
    setError(null);
    try {
      const token = await getToken();
      const api = getApi(token);
      const ids = Array.from(selected);
      const results = await Promise.allSettled(ids.map((id) => api.media.delete(id)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      setFeedback(
        failed === 0
          ? `${ids.length} file${ids.length > 1 ? 's' : ''} deleted`
          : `${ids.length - failed} deleted, ${failed} failed`,
      );
      clear();
      startTransition(() => router.refresh());
    } finally {
      setBulkPending(false);
    }
  }

  const kpiItems = (['image', 'audio', 'video', 'document'] as const).map((type) => ({
    title: type.charAt(0).toUpperCase() + type.slice(1),
    value: initialData.filter((m) => m.mediaType === type).length,
    icon: TYPE_ICON[type],
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Media"
        description="Uploaded files stored in Supabase Storage — images, audio, video, documents"
        actions={
          canUpload ? (
            <>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/*,audio/*,video/*,application/pdf"
                onChange={handleUpload}
              />
              <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </>
          ) : undefined
        }
      />

      <KPIGrid items={kpiItems} columns={4} />

      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            {canDelete && (
              <TableHead className="w-10 pr-0">
                <input
                  type="checkbox"
                  checked={initialData.length > 0 && initialData.every((m) => selected.has(m.id))}
                  ref={(el) => {
                    if (el) el.indeterminate =
                      initialData.some((m) => selected.has(m.id)) &&
                      !initialData.every((m) => selected.has(m.id));
                  }}
                  onChange={() => toggleAll(initialData)}
                  className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                  aria-label="Select all"
                />
              </TableHead>
            )}
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>MIME</TableHead>
            <TableHead>Linked to</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canDelete ? 7 : 6} className="text-center text-muted-foreground py-8">
                No media uploaded yet.
              </TableCell>
            </TableRow>
          ) : initialData.map((m) => (
            <TableRow key={m.id} className={selected.has(m.id) ? 'bg-muted/60' : undefined}>
              {canDelete && (
                <TableCell className="w-10 pr-0">
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggle(m.id)}
                    className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                    aria-label="Select row"
                  />
                </TableCell>
              )}
              <TableCell><Badge variant={TYPE_VARIANT[m.mediaType]}>{m.mediaType}</Badge></TableCell>
              <TableCell><span className="text-sm">{formatBytes(m.fileSize)}</span></TableCell>
              <TableCell><span className="text-xs text-muted-foreground">{m.mimeType ?? '—'}</span></TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {m.momentId ? 'Moment' : m.messageId ? 'Message' : '—'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</span>
              </TableCell>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {canDelete && (
        <BulkActionBar
          selectedCount={selectedCount}
          entityLabel="file"
          onClear={clear}
          actions={[
            {
              label: bulkPending ? 'Deleting...' : 'Delete selected',
              icon: <Trash2 className="h-3.5 w-3.5" />,
              onClick: bulkDelete,
              disabled: bulkPending,
              variant: 'destructive',
            },
          ]}
        />
      )}
    </div>
  );
}
