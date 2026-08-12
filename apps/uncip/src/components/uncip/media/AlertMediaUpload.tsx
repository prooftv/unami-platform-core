'use client';

import { useRouter } from 'next/navigation';
import { MediaAttachment } from './MediaAttachment';
import type { RequestUploadInput } from '@unami/api';

interface Props {
  onRequestUpload: (
    mime: RequestUploadInput['mimeType'],
    size: number,
    label: string | null,
  ) => Promise<{ uploadUrl: string } | { error: string }>;
}

export function AlertMediaUpload({ onRequestUpload }: Props) {
  const router = useRouter();
  return (
    <MediaAttachment
      onRequestUpload={onRequestUpload}
      onUploaded={() => router.refresh()}
    />
  );
}
