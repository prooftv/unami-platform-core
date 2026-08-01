import { notFound, redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { SponsorFormClient } from './SponsorFormClient';

export default async function EditSponsorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();
  if (session?.role !== 'superadmin' && session?.role !== 'content_admin') redirect('/sponsors');

  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const sponsor = await api.sponsors.get(id).catch(() => null);
  if (!sponsor) notFound();

  return <SponsorFormClient sponsor={sponsor} />;
}
