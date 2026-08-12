import { FileText, Image } from 'lucide-react';
import { getUNCIPClient } from '@/lib/auth/operator';
import type { UNCIPMediaRow } from '@unami/api';

interface Props {
  rows: UNCIPMediaRow[];
  bucket: 'alert-media' | 'timeline-media';
}

export async function MediaList({ rows, bucket }: Props) {
  if (rows.length === 0) return null;

  const client = await getUNCIPClient();

  // Fetch signed URLs for all rows in parallel
  const withUrls = await Promise.all(
    rows.map(async (row) => {
      const res = await client?.media.getSignedUrl(row.storagePath, bucket).catch(() => null);
      return { row, signedUrl: res?.data.signedUrl ?? null };
    }),
  );

  return (
    <ul className="space-y-1 mt-2">
      {withUrls.map(({ row, signedUrl }) => {
        const isImage = row.mimeType.startsWith('image/');
        const Icon    = isImage ? Image : FileText;
        return (
          <li key={row.id} className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            {signedUrl ? (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline truncate"
              >
                {row.label ?? row.mimeType}
              </a>
            ) : (
              <span className="text-muted-foreground truncate">{row.label ?? row.mimeType}</span>
            )}
            <span className="text-xs text-muted-foreground shrink-0">
              {(row.fileSize / 1024).toFixed(0)} KB
            </span>
          </li>
        );
      })}
    </ul>
  );
}
