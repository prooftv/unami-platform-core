import { notFound } from 'next/navigation';
import { getApiClient } from '@/lib/api/client';
import { getOperatorSession } from '@/lib/auth/operator';
import { BroadcastDetailClient } from './BroadcastDetailClient';

export default async function BroadcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const api = await getApiClient();
  if (!api) notFound();

  const session = await getOperatorSession();
  const broadcast = await api.broadcasts.get(id).catch(() => null);
  if (!broadcast) notFound();

  return <BroadcastDetailClient broadcast={broadcast} session={session!} />;
}
