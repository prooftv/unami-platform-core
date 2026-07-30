import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { BroadcastsClient } from './BroadcastsClient';

export default async function BroadcastsPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');

  const api = await getApiClient();
  const result = api ? await api.broadcasts.list({ limit: 20, page: 1 }).catch(() => null) : null;

  return <BroadcastsClient initialData={result} />;
}
