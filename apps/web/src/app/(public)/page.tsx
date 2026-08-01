import { getPublicApiClient } from '@/lib/api/client';
import { FeedClient } from '@/components/FeedClient';

export default async function HomePage({
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
      baseUrl="/"
      heading="Community Moments"
      subheading="Broadcasted updates from across South Africa"
    />
  );
}
