import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { CommentsClient } from './CommentsClient';
import { redirect } from 'next/navigation';

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const session = await getOperatorSession();
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const result = await api.moderation.listComments({
    page,
    limit: 20,
    status: status as 'pending' | 'approved' | 'flagged' | 'rejected' | undefined,
  }).catch(() => null);

  return <CommentsClient initialData={result} session={session!} currentPage={page} currentStatus={status ?? ''} />;
}
