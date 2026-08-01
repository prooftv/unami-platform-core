import { redirect } from 'next/navigation';
import { getApiClient } from '@/lib/api/client';
import { BroadcastsClient } from './BroadcastsClient';

export default async function BroadcastsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  const result = api ? await api.broadcasts.list({ limit: 20, page }).catch(() => null) : null;

  return <BroadcastsClient initialData={result} currentPage={page} />;
}
