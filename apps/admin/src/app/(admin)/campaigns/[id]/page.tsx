import { notFound, redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { CampaignDetailClient } from './CampaignDetailClient';

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();
  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const [campaign, transactions] = await Promise.all([
    api.campaigns.get(id).catch(() => null),
    api.campaigns.transactions(id).catch(() => []),
  ]);

  if (!campaign) notFound();

  return <CampaignDetailClient campaign={campaign} transactions={transactions} session={session!} />;
}
