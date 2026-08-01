'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicMoment } from '@moments/api';
import type { PaginatedResponse } from '@moments/api';
const URGENCY_LABEL: Record<string, string> = {
  urgent: '🔴 Urgent',
  high: '🟠 High',
  medium: '🟡 Medium',
  low: '',
};

interface Props {
  result: PaginatedResponse<PublicMoment> | null;
  currentPage: number;
  baseUrl: string;
  heading: string;
  subheading?: string;
}

export function FeedClient({ result, currentPage, baseUrl, heading, subheading }: Props) {
  const router = useRouter();
  const moments = result?.data ?? [];
  const total = result?.pagination.total ?? 0;
  const totalPages = result?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        {subheading && <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>}
      </div>

      {moments.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No moments published yet.
        </div>
      ) : (
        <div className="space-y-4">
          {moments.map((m) => (
            <Link
              key={m.id}
              href={`/moments/${m.id}`}
              className="block rounded-lg border bg-card p-5 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">{m.region}</span>
                    <span>·</span>
                    <span>{m.category}</span>
                    {URGENCY_LABEL[m.urgencyLevel] && (
                      <>
                        <span>·</span>
                        <span>{URGENCY_LABEL[m.urgencyLevel]}</span>
                      </>
                    )}
                    {m.isSponsored && m.sponsor && (
                      <>
                        <span>·</span>
                        <span className="text-muted-foreground">In partnership with {m.sponsor.displayName}</span>
                      </>
                    )}
                  </div>
                  <p className="font-medium leading-snug">{m.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{m.content}</p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                </time>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} moments</span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => router.push(`${baseUrl}?page=${currentPage - 1}`)}
              className="rounded border px-3 py-1 text-xs disabled:opacity-40 hover:bg-accent transition-colors"
            >
              Previous
            </button>
            <span className="text-xs">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => router.push(`${baseUrl}?page=${currentPage + 1}`)}
              className="rounded border px-3 py-1 text-xs disabled:opacity-40 hover:bg-accent transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
