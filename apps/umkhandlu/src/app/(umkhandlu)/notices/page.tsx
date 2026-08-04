import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { NoticesClient } from './NoticesClient';
import type { GovernanceNoticeStatus, GovernanceNoticeType } from '@unami/api';

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; type?: string }>;
}) {
  await getOperatorSession();
  const { page: pageParam, status, type } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  const result = api
    ? await api.notices.list({
        page,
        limit: 20,
        status: status as GovernanceNoticeStatus | undefined,
        type: type as GovernanceNoticeType | undefined,
      }).catch(() => null)
    : null;

  return (
    <NoticesClient
      initialData={result}
      currentPage={page}
      currentStatus={status ?? ''}
      currentType={type ?? ''}
    />
  );
}
