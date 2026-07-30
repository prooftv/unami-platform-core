import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { AuthorityClient } from './AuthorityClient';

export default async function AuthorityPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');
  if (session.role === 'moderator' || session.role === 'viewer') redirect('/dashboard');

  const api = await getApiClient();
  const [profiles, auditLog, stats] = await Promise.all([
    api ? api.authority.list({ limit: 20, page: 1 }).catch(() => null) : null,
    api ? api.authority.auditLog({ limit: 10 }).catch(() => null) : null,
    api ? api.authority.stats().catch(() => null) : null,
  ]);

  return <AuthorityClient profiles={profiles} auditLog={auditLog} stats={stats} />;
}
