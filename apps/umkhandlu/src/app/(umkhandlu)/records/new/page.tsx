import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { CreateRecordClient } from './CreateRecordClient';

export default async function NewRecordPage() {
  const session = await getOperatorSession();
  if (session?.role === 'moderator' || session?.role === 'viewer') redirect('/records');

  const api = await getApiClient();
  // Fetch recent notices to allow linking origin notice
  const notices = api
    ? await api.notices.list({ limit: 50 }).catch(() => null)
    : null;

  return <CreateRecordClient notices={notices?.data ?? []} />;
}
