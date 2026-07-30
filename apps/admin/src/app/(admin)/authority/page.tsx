import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@moments/ui';
import { Network } from 'lucide-react';

export default async function AuthorityPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');
  if (session.role === 'moderator' || session.role === 'viewer') redirect('/dashboard');

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Authority Profiles"
        description="Trusted community members with elevated content privileges"
      />
      <EmptyState
        icon={Network}
        title="Authority profiles"
        description="Community authority profiles will appear here. Levels 1–5 control blast radius and approval mode."
      />
    </div>
  );
}
