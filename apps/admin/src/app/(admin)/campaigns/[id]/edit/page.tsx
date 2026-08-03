import { notFound, redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { CampaignEditClient } from './CampaignEditClient';

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();
  if (session?.role !== 'superadmin' && session?.role !== 'content_admin') redirect('/campaigns');

  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const [campaign, sponsors] = await Promise.all([
    api.campaigns.get(id).catch(() => null),
    api.sponsors.list({ limit: 100, active: true }).catch(() => null),
  ]);

  if (!campaign) notFound();
  if (campaign.status === 'completed' || campaign.status === 'cancelled') redirect(`/campaigns/${id}`);

  return <CampaignEditClient campaign={campaign} sponsors={sponsors?.data ?? []} />;
}
