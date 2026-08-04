import { notFound, redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';
import { getApiClient } from '@/lib/api/client';
import { RecordDetailClient } from './RecordDetailClient';

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getOperatorSession();

  const api = await getApiClient();
  if (!api) redirect('/dashboard');

  const [record, lineage] = await Promise.all([
    api.records.get(id).catch(() => null),
    api.records.lineage(id).catch(() => []),
  ]);

  if (!record) notFound();

  return (
    <RecordDetailClient
      record={record}
      lineage={lineage}
      session={session!}
    />
  );
}
