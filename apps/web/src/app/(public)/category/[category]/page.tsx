import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicApiClient } from '@/lib/api/client';
import { FeedClient } from '@/components/FeedClient';
import { Category } from '@moments/shared';

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  return { title: `${category} Moments` };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { category } = await params;
  const { page: pageParam } = await searchParams;

  if (!Object.values(Category).includes(category as Category)) notFound();

  const page = Math.max(1, parseInt(pageParam ?? '1'));
  const api = getPublicApiClient();
  const result = await api.moments.list({ page, limit: 20, category: category as Category }).catch(() => null);

  return (
    <FeedClient
      result={result}
      currentPage={page}
      baseUrl={`/category/${category}`}
      heading={`${category}`}
      subheading={`Community moments in the ${category} category`}
    />
  );
}
