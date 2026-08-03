import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { CreateMomentClient } from './CreateMomentClient';

export default async function NewMomentPage() {
  const session = await getOperatorSession();
  if (session?.role === 'moderator' || session?.role === 'viewer') redirect('/moments');
  const api = await getApiClient();
  const sponsors = api ? await api.sponsors.list({ limit: 100, active: true }).catch(() => null) : null;
  return <CreateMomentClient sponsors={sponsors?.data ?? []} />;
}
