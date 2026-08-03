import { notFound, redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { AdvisoryDetailClient } from './AdvisoryDetailClient';

export default async function AdvisoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();
  if (session?.role === 'viewer') redirect('/dashboard');

  const api = await getApiClient();
  if (!api) notFound();

  const advisory = await api.moderation.getAdvisory(id).catch(() => null);
  if (!advisory) notFound();

  return <AdvisoryDetailClient advisory={advisory} />;
}
