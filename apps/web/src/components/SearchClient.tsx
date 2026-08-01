'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { PublicMoment, PaginatedResponse } from '@moments/api';
import { FeedClient } from '@/components/FeedClient';

interface Props {
  result: PaginatedResponse<PublicMoment> | null;
  currentPage: number;
  query: string;
}

export function SearchClient({ result, currentPage, query }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(search)}&page=1`);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find moments by keyword</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search moments..."
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Search
        </button>
      </form>

      {query && (
        <FeedClient
          result={result}
          currentPage={currentPage}
          baseUrl={`/search?q=${encodeURIComponent(query)}`}
          heading={`Results for "${query}"`}
          subheading={result ? `${result.pagination.total} moments found` : undefined}
        />
      )}
    </div>
  );
}
