import type { Metadata } from 'next';
import { getPublicApiClient } from '@/lib/api/client';
import { FeedClient } from '@/components/FeedClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Feed' };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = getPublicApiClient();
  const result = await api.moments.list({ page, limit: 20 }).catch(() => null);

  return (
    <FeedClient
      result={result}
      currentPage={page}
      baseUrl="/feed"
      heading="Community Moments"
      subheading="All broadcasted updates from across South Africa"
    />
  );
}
