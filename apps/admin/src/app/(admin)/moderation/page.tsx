import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { ModerationClient } from './ModerationClient';

export default async function ModerationPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');
  if (session.role === 'viewer') redirect('/dashboard');

  const api = await getApiClient();
  const [messages, advisories, stats] = await Promise.all([
    api ? api.moderation.listMessages({ limit: 20, page: 1, status: 'pending' }).catch(() => null) : null,
    api ? api.moderation.listAdvisories({ limit: 10, escalated: true }).catch(() => null) : null,
    api ? api.moderation.stats().catch(() => null) : null,
  ]);

  return <ModerationClient messages={messages} advisories={advisories} stats={stats} session={session} />;
}
