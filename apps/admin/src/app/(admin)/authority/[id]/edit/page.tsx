import { notFound, redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { AuthorityFormClient } from './AuthorityFormClient';

export default async function EditAuthorityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();
  if (session?.role !== 'superadmin') redirect('/authority');

  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const [profile, auditLog] = await Promise.all([
    api.authority.get(id).catch(() => null),
    api.authority.auditLog({ limit: 20 }).catch(() => null),
  ]);
  if (!profile) notFound();

  // Filter audit entries for this specific profile
  const profileAudit = (auditLog?.data ?? []).filter((e) => e.authorityId === id);

  return <AuthorityFormClient profile={profile} auditLog={profileAudit} />;
}
