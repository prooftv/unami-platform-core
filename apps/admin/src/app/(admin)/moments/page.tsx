import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { MomentsClient } from './MomentsClient';

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getOperatorSession();
  if (!session) redirect('/login');

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  const result = api ? await api.moments.list({ limit: 20, page }).catch(() => null) : null;

  return <MomentsClient initialData={result} session={session} currentPage={page} />;
}
