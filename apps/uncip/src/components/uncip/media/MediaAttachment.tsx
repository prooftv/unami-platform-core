'use client';

/**
 * MediaAttachment — single-file upload for alert or timeline media.
 *
 * Flow:
 * 1. User selects a file (jpeg/png/webp/pdf, max 10 MB)
 * 2. Component calls the server action to get a signed upload URL
 * 3. File is PUT directly to Supabase Storage via the signed URL
 * 4. On success, parent is notified via onUploaded()
 *
 * No public URLs. All access via signed read URLs generated server-side.
 */

import { useRef, useState } from 'react';
import { Paperclip, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AllowedMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
const ALLOWED: AllowedMime[] = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  /** Server action: requests a signed upload URL from the Edge Function */
  onRequestUpload: (mime: AllowedMime, size: number, label: string | null) => Promise<{ uploadUrl: string } | { error: string }>;
  onUploaded: () => void;
}

type State = 'idle' | 'uploading' | 'done' | 'error';

export function MediaAttachment({ onRequestUpload, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState]   = useState<State>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [label, setLabel]   = useState('');

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type as AllowedMime)) {
      setMessage('Only JPEG, PNG, WebP, or PDF files are allowed.');
      setState('error');
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage('File must be 10 MB or smaller.');
      setState('error');
      return;
    }

    setState('uploading');
    setMessage(null);

    const result = await onRequestUpload(
      file.type as AllowedMime,
      file.size,
      label.trim() || null,
    );

    if ('error' in result) {
      setState('error');
      setMessage(result.error);
      return;
    }

    // PUT the file directly to the signed upload URL
    const putRes = await fetch(result.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!putRes.ok) {
      setState('error');
      setMessage('Upload failed. Please try again.');
      return;
    }

    setState('done');
    setMessage('Uploaded.');
    setLabel('');
    if (inputRef.current) inputRef.current.value = '';
    onUploaded();
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor="mediaLabel">Attachment label (optional)</Label>
        <Input
          id="mediaLabel"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Sighting photo"
          maxLength={200}
          disabled={state === 'uploading'}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={state === 'uploading'}
          onClick={() => inputRef.current?.click()}
        >
          {state === 'uploading'
            ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
            : <Paperclip className="h-4 w-4 mr-1" />}
          {state === 'uploading' ? 'Uploading…' : 'Attach file'}
        </Button>
        {state === 'done'  && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        {state === 'error' && <AlertCircle  className="h-4 w-4 text-destructive" />}
        {message && <span className="text-xs text-muted-foreground">{message}</span>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
