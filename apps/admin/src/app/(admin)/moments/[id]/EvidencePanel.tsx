'use client';

import { useState, useRef, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Paperclip, FileText, Image, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { EvidenceRecord } from '@unami/api';
import { uploadEvidenceAction } from '../_actions/moment-actions';
import { formatBytes } from '../_lib/moment-utils';

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx';

const FILE_ICON: Record<string, LucideIcon> = {
  image: Image,
  pdf: FileText,
  document: FileText,
};

interface Props {
  momentId: string;
  initialEvidence: EvidenceRecord[];
  canUpload: boolean;
}

export function EvidencePanel({ momentId, initialEvidence, canUpload }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [evidence] = useState<EvidenceRecord[]>(initialEvidence);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('momentId', momentId);
    setError(null);
    startTransition(async () => {
      const res = await uploadEvidenceAction(momentId, formData);
      if (res.error) { setError(res.error); return; }
      e.currentTarget?.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Evidence
          {evidence.length > 0 && <Badge variant="secondary" className="ml-auto">{evidence.length}</Badge>}
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
                  <a href={item.publicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">
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
              <Input id="evidence-title" name="title" placeholder="e.g. Site photograph, Attendance register" required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evidence-file">File <span className="text-destructive">*</span></Label>
              <input
                id="evidence-file"
                ref={fileRef}
                name="file"
                type="file"
                accept={ACCEPTED}
                required
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
              />
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, PDF, DOC, DOCX · max 10 MB</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="sm" disabled={isPending}>
              <Upload className="h-4 w-4 mr-2" />
              {isPending ? 'Uploading...' : 'Attach evidence'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
