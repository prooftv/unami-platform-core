import { notFound, redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { MessageDetailClient } from './MessageDetailClient';

export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();
  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const message = await api.moderation.getMessage(id).catch(() => null);
  if (!message) notFound();

  return <MessageDetailClient message={message} session={session!} />;
}
