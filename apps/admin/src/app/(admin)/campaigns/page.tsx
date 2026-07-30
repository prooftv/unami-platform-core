import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { CampaignsClient } from './CampaignsClient';

export default async function CampaignsPage() {
  const session = await getOperatorSession();
  if (!session) redirect('/login');
  if (session.role === 'moderator' || session.role === 'viewer') redirect('/dashboard');

  const api = await getApiClient();
  const [listResult, budgetOverview] = await Promise.all([
    api ? api.campaigns.list({ limit: 20, page: 1 }).catch(() => null) : null,
    api ? api.campaigns.budgetOverview().catch(() => null) : null,
  ]);

  return <CampaignsClient initialData={listResult} budgetOverview={budgetOverview ?? []} />;
}
