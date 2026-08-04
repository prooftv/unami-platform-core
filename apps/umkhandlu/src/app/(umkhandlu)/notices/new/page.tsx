import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { CreateNoticeClient } from './CreateNoticeClient';

export default async function NewNoticePage() {
  const session = await getOperatorSession();
  if (session?.role === 'moderator' || session?.role === 'viewer') redirect('/notices');

  return <CreateNoticeClient />;
}
