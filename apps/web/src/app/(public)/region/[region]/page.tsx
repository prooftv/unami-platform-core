import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicApiClient } from '@/lib/api/client';
import { FeedClient } from '@/components/FeedClient';
import { Region } from '@/domain/moments';

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params;
  return { title: `${region} Moments` };
}

export default async function RegionPage({
  params,
  searchParams,
}: {
  params: Promise<{ region: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { region } = await params;
  const { page: pageParam } = await searchParams;

  if (!Object.values(Region).includes(region as Region)) notFound();

  const page = Math.max(1, parseInt(pageParam ?? '1'));
  const api = getPublicApiClient();
  const result = await api.moments.list({ page, limit: 20, region: region as Region }).catch(() => null);

  return (
    <FeedClient
      result={result}
      currentPage={page}
      baseUrl={`/region/${region}`}
      heading={`${region} Moments`}
      subheading={`Community updates from ${region}`}
    />
  );
}
