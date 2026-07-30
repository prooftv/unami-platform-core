import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@moments/ui';
import { ShieldAlert } from 'lucide-react';

export default async function ModerationPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');
  if (session.role === 'viewer') redirect('/dashboard');

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Moderation"
        description="Review inbound messages and AI advisory flags"
      />
      <EmptyState
        icon={ShieldAlert}
        title="Moderation queue"
        description="Inbound WhatsApp messages and advisory flags will appear here once the moderation API client is connected."
      />
    </div>
  );
}
