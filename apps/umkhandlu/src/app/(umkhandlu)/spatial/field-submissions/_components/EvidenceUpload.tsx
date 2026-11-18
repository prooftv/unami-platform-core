'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  filename: string;
  sizeBytes: number;
}

export function EvidenceUpload({
  submissionId,
  onUploaded,
}: {
  submissionId: string;
  onUploaded?: (file: UploadedFile) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);

  async function handleFile(file: File) {
    setError(null);
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(
      `/api/upload?bucket=field-evidence&submissionId=${submissionId}`,
      { method: 'POST', body: form },
    );

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Upload failed.');
      return;
    }

    const record: UploadedFile = { id: data.id, filename: data.filename, sizeBytes: data.sizeBytes };
    setUploaded((prev) => [...prev, record]);
    onUploaded?.(record);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          startTransition(() => { void handleFile(file); });
          e.target.value = '';
        }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
        {pending ? 'Uploading…' : 'Upload evidence'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {uploaded.length > 0 && (
        <div className="space-y-1">
          {uploaded.map((f) => (
            <div key={f.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-green-600">✓</span>
              <a href={`/api/attachments/${f.id}`} target="_blank" rel="noopener noreferrer" className="underline">
                {f.filename}
              </a>
              <span>({Math.round(f.sizeBytes / 1024)}KB)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
