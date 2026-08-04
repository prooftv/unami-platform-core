import { notFound } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { NoticeDetailClient } from './NoticeDetailClient';

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();

  const api = await getApiClient();
  if (!api) notFound();

  const [notice, linkedRecordsResult] = await Promise.all([
    api.notices.get(id).catch(() => null),
    api.records.list({ originNoticeId: id, limit: 50 }).catch(() => null),
  ]);

  if (!notice) notFound();

  return (
    <NoticeDetailClient
      notice={notice}
      linkedRecords={linkedRecordsResult?.data ?? []}
      session={session!}
    />
  );
}
