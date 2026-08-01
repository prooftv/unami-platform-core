import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { AuthorityFormClient } from '../[id]/edit/AuthorityFormClient';

export default async function NewAuthorityPage() {
  const session = await getOperatorSession();
  if (session?.role !== 'superadmin') redirect('/authority');
  return <AuthorityFormClient profile={null} />;
}
