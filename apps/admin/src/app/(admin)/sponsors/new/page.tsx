import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { SponsorFormClient } from '../[id]/edit/SponsorFormClient';

export default async function NewSponsorPage() {
  const session = await getOperatorSession();
  if (session?.role !== 'superadmin' && session?.role !== 'content_admin') redirect('/sponsors');
  return <SponsorFormClient sponsor={null} />;
}
