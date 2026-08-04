'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Paperclip, FileText, Image, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import type { EvidenceRecord } from '@unami/api';

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx';

const FILE_ICON: Record<string, LucideIcon> = {
  image: Image,
  pdf: FileText,
  document: FileText,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  momentId: string;
  initialEvidence: EvidenceRecord[];
  canUpload: boolean;
}

export function EvidencePanel({ momentId, initialEvidence, canUpload }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>(initialEvidence);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  function getApi(token: string) {
    return createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) return;

    setUploading(true);
    setError(null);
    try {
      const token = await getToken();
      const record = await getApi(token).evidence.upload({ momentId, title: title.trim(), file });
      setEvidence((prev) => [...prev, record]);
      setTitle('');
      if (fileRef.current) fileRef.current.value = '';
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Evidence
          {evidence.length > 0 && (
            <Badge variant="secondary" className="ml-auto">{evidence.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed rounded-md px-4 py-3">
            No evidence attached to this moment.
          </p>
        ) : (
          <ul className="space-y-2">
            {evidence.map((item) => {
              const Icon = FILE_ICON[item.fileType] ?? Paperclip;
              return (
                <li key={item.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(item.fileSize)} · {new Date(item.createdAt).toLocaleDateString('en-ZA')}
                    </p>
                  </div>
                  <a
                    href={item.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    View
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        {canUpload && (
          <form onSubmit={handleUpload} className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <Label htmlFor="evidence-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="evidence-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Site photograph, Attendance register"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evidence-file">File <span className="text-destructive">*</span></Label>
              <input
                id="evidence-file"
                ref={fileRef}
                type="file"
                accept={ACCEPTED}
                required
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
              />
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, PDF, DOC, DOCX · max 10 MB</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="sm" disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Attach evidence'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
