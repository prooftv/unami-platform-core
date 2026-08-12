'use client';

import { useRouter } from 'next/navigation';
import { MediaAttachment } from './MediaAttachment';
import type { RequestUploadInput } from '@unami/api';

interface Props {
  timelineEntryId: string;
  onRequestUpload: (
    timelineEntryId: string,
    mime: RequestUploadInput['mimeType'],
    size: number,
    label: string | null,
  ) => Promise<{ uploadUrl: string } | { error: string }>;
}

export function TimelineMediaUpload({ timelineEntryId, onRequestUpload }: Props) {
  const router = useRouter();
  return (
    <MediaAttachment
      onRequestUpload={(mime, size, label) => onRequestUpload(timelineEntryId, mime, size, label)}
      onUploaded={() => router.refresh()}
    />
  );
}
