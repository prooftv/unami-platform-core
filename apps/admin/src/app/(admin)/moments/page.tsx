import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { MomentsClient } from './MomentsClient';

export default async function MomentsPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');

  const api = await getApiClient();
  const result = api ? await api.moments.list({ limit: 20, page: 1 }).catch(() => null) : null;

  return <MomentsClient initialData={result} session={session} />;
}
