import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { RecordsClient } from './RecordsClient';
import type { GovernanceRecordStatus, GovernanceRecordType } from '@unami/api';

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; type?: string }>;
}) {
  const session = await getOperatorSession();
  const { page: pageParam, status, type } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  const result = api
    ? await api.records.list({
        page,
        limit: 20,
        status: status as GovernanceRecordStatus | undefined,
        type: type as GovernanceRecordType | undefined,
      }).catch(() => null)
    : null;

  return (
    <RecordsClient
      initialData={result}
      session={session!}
      currentPage={page}
      currentStatus={status ?? ''}
      currentType={type ?? ''}
    />
  );
}
