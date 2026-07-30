import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@moments/ui';
import { Briefcase } from 'lucide-react';

export default async function CampaignsPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');
  if (session.role === 'moderator' || session.role === 'viewer') redirect('/dashboard');

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Campaigns"
        description="Sponsored broadcast campaigns with budget tracking"
      />
      <EmptyState
        icon={Briefcase}
        title="Campaigns"
        description="Campaigns require approval before publishing. They will appear here once the campaigns API client is connected."
      />
    </div>
  );
}
