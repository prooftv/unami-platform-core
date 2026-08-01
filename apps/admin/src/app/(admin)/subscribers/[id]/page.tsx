import { notFound, redirect } from 'next/navigation';
import { getApiClient } from '@/lib/api/client';
import { SubscriberDetailClient } from './SubscriberDetailClient';

export default async function SubscriberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const [subscriber, stats] = await Promise.all([
    api.subscribers.get(id).catch(() => null),
    api.subscribers.stats().catch(() => null),
  ]);

  if (!subscriber) notFound();

  return <SubscriberDetailClient subscriber={subscriber} stats={stats} />;
}
