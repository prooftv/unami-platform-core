import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');
  return <DashboardClient session={session} />;
}
