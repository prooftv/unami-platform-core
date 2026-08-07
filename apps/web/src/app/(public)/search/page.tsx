export const dynamic = 'force-dynamic';
import { getPublicApiClient } from '@/lib/api/client';
import { SearchClient } from '@/components/SearchClient';

export const metadata = { title: 'Search' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = q ?? '';
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = getPublicApiClient();
  const result = query
    ? await api.moments.list({ page, limit: 20, search: query }).catch(() => null)
    : null;

  return <SearchClient result={result} currentPage={page} query={query} />;
}
