import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { SponsorsClient } from './SponsorsClient';

export default async function SponsorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getOperatorSession();
  if (session?.role === 'moderator' || session?.role === 'viewer') redirect('/dashboard');

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  const [listResult, stats] = await Promise.all([
    api ? api.sponsors.list({ limit: 20, page }).catch(() => null) : null,
    api ? api.sponsors.stats().catch(() => null) : null,
  ]);

  return <SponsorsClient initialData={listResult} stats={stats} currentPage={page} session={session!} />;
}
