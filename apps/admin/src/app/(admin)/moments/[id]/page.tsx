import { notFound, redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { MomentDetailClient } from './MomentDetailClient';

export default async function MomentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();

  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const [moment, broadcastsResult, stats] = await Promise.all([
    api.moments.get(id).catch(() => null),
    api.broadcasts.list({ limit: 10, page: 1, momentId: id }).catch(() => null),
    api.moments.stats(id).catch(() => null),
  ]);

  if (!moment) notFound();

  return (
    <MomentDetailClient
      moment={moment}
      session={session!}
      broadcasts={broadcastsResult?.data ?? []}
      stats={stats}
    />
  );
}
