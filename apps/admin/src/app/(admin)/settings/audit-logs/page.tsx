import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { AuditLogsClient } from './AuditLogsClient';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; resourceType?: string }>;
}) {
  const session = await getOperatorSession();
  if (session?.role !== 'superadmin') redirect('/settings');

  const { page: pageParam, resourceType } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const result = await api.settings.auditLogs({
    page,
    limit: 20,
    resourceType: resourceType || undefined,
  }).catch(() => null);

  return <AuditLogsClient initialData={result} currentPage={page} currentResourceType={resourceType ?? ''} />;
}
