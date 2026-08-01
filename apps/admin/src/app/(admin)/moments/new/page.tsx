import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { CreateMomentClient } from './CreateMomentClient';

export default async function NewMomentPage() {
  const session = await getOperatorSession();
  if (session?.role === 'moderator' || session?.role === 'viewer') redirect('/moments');
  return <CreateMomentClient />;
}
