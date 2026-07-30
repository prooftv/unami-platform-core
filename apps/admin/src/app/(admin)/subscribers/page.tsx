import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@moments/ui';
import { Users } from 'lucide-react';

export default async function SubscribersPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Subscribers"
        description="WhatsApp subscribers who have opted in"
      />
      <EmptyState
        icon={Users}
        title="Subscriber data"
        description="Subscriber list will appear here once the subscribers API client is connected."
      />
    </div>
  );
}
