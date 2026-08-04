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

  const isCSR = campaign.campaignType === 'csr';
  const [progressLog, deliverables] = isCSR
    ? await Promise.all([
        api.campaigns.progressLog(id).catch(() => []),
        api.campaigns.deliverables(id).catch(() => []),
      ])
    : [[], []];

  return (
    <CampaignDetailClient
      campaign={campaign}
      transactions={transactions}
      progressLog={progressLog}
      deliverables={deliverables}
      session={session!}
    />
  );
}
