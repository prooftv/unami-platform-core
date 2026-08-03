import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { MomentsClient } from './MomentsClient';
import type { MomentStatus } from '@unami/shared';

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const session = await getOperatorSession();
  const { page: pageParam, status, search } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  const result = api
    ? await api.moments.list({
        limit: 20,
        page,
        status: status as MomentStatus | undefined,
        search: search || undefined,
      }).catch(() => null)
    : null;

  return (
    <MomentsClient
      initialData={result}
      session={session!}
      currentPage={page}
      currentStatus={status ?? ''}
      currentSearch={search ?? ''}
    />
  );
}
