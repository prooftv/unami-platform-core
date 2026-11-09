import Link from 'next/link';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  baseUrl: string;
  /** Additional query params to preserve (e.g. search, filter) */
  params?: Record<string, string>;
}

export function Pagination({ page, pageSize, total, baseUrl, params = {} }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function href(p: number) {
    const q = new URLSearchParams({ ...params, page: String(p) });
    return `${baseUrl}?${q}`;
  }

  if (totalPages <= 1 && total <= pageSize) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-3 text-sm text-muted-foreground">
      <p className="shrink-0">
        {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-muted transition-colors"
          >
            Previous
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium opacity-40 cursor-not-allowed">
            Previous
          </span>
        )}
        <span className="px-2 text-xs">
          {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-muted transition-colors"
          >
            Next
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium opacity-40 cursor-not-allowed">
            Next
          </span>
        )}
      </div>
    </div>
  );
}

/** Parse page from searchParams, defaulting to 1. */
export function parsePage(searchParams: Record<string, string | string[] | undefined>): number {
  const raw = searchParams.page;
  const n = parseInt(Array.isArray(raw) ? raw[0] : (raw ?? '1'), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export const PAGE_SIZE = 10;
