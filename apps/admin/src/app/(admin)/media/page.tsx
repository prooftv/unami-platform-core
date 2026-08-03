import { getApiClient } from '@/lib/api/client';
import { getOperatorSession } from '@/lib/auth/operator';
import { MediaClient } from './MediaClient';

export default async function MediaPage() {
  const session = await getOperatorSession();
  const api = await getApiClient();
  const result = api ? await api.media.list().catch(() => null) : null;

  return <MediaClient initialData={result?.data ?? []} session={session!} />;
}
