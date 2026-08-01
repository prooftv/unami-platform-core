import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { CampaignsClient } from './CampaignsClient';

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getOperatorSession();
  if (session?.role === 'moderator' || session?.role === 'viewer') redirect('/dashboard');

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  const [listResult, budgetOverview] = await Promise.all([
    api ? api.campaigns.list({ limit: 20, page }).catch(() => null) : null,
    api ? api.campaigns.budgetOverview().catch(() => null) : null,
  ]);

  return <CampaignsClient initialData={listResult} budgetOverview={budgetOverview ?? []} currentPage={page} session={session!} />;
}
