import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { ErrorLogsClient } from './ErrorLogsClient';

export default async function ErrorLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; severity?: string }>;
}) {
  const session = await getOperatorSession();
  if (session?.role !== 'superadmin') redirect('/settings');

  const { page: pageParam, severity } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const result = await api.settings.errorLogs({
    page,
    limit: 20,
    severity: severity || undefined,
  }).catch(() => null);

  return <ErrorLogsClient initialData={result} currentPage={page} currentSeverity={severity ?? ''} />;
}
