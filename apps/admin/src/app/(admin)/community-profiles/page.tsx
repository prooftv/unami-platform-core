import { getApiClient } from '@/lib/api/client';
import { CommunityProfilesClient } from './CommunityProfilesClient';

export default async function CommunityProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page: pageParam, search } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));

  const api = await getApiClient();
  const result = api
    ? await api.userProfiles.list({ page, limit: 20, search }).catch(() => null)
    : null;

  return <CommunityProfilesClient initialData={result} currentPage={page} />;
}
