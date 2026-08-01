import { notFound, redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { EditMomentClient } from './EditMomentClient';

export default async function EditMomentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();

  if (session?.role !== 'superadmin' && session?.role !== 'content_admin') {
    redirect(`/moments/${id}`);
  }

  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const moment = await api.moments.get(id).catch(() => null);
  if (!moment) notFound();

  if (moment.status === 'broadcasted' || moment.status === 'cancelled') {
    redirect(`/moments/${id}`);
  }

  return <EditMomentClient moment={moment} />;
}
