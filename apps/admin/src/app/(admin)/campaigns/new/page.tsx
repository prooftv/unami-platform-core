import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { CampaignFormClient } from './CampaignFormClient';

export default async function NewCampaignPage() {
  const session = await getOperatorSession();
  if (session?.role !== 'superadmin' && session?.role !== 'content_admin') redirect('/campaigns');

  const api = await getApiClient();
  const sponsors = api ? await api.sponsors.list({ limit: 100, active: true }).catch(() => null) : null;

  return <CampaignFormClient sponsors={sponsors?.data ?? []} />;
}
