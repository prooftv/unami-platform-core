import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@moments/ui';
import { Tag } from 'lucide-react';

export default async function SponsorsPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');
  if (session.role === 'moderator' || session.role === 'viewer') redirect('/dashboard');

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Sponsors"
        description="Manage sponsor profiles and tier assignments"
      />
      <EmptyState
        icon={Tag}
        title="Sponsors"
        description="Bronze, Silver, Gold and Platinum sponsors will appear here once the sponsors API client is connected."
      />
    </div>
  );
}
