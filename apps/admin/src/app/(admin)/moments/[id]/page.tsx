import { redirect, notFound } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { MomentDetailClient } from './MomentDetailClient';

export default async function MomentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();
  if (!session) redirect('/login');

  const api = await getApiClient();
  if (!api) redirect('/login');

  const moment = await api.moments.get(id).catch(() => null);
  if (!moment) notFound();

  return <MomentDetailClient moment={moment} session={session} />;
}
