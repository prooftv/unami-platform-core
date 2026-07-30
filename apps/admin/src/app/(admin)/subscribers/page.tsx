import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { SubscribersClient } from './SubscribersClient';

export default async function SubscribersPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');

  const api = await getApiClient();
  const [listResult, stats] = await Promise.all([
    api ? api.subscribers.list({ limit: 20, page: 1 }).catch(() => null) : null,
    api ? api.subscribers.stats().catch(() => null) : null,
  ]);

  return <SubscribersClient initialData={listResult} stats={stats} />;
}
