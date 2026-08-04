import type { Metadata } from 'next';
import { getPrivacyPage } from '@/lib/sanity/queries';
import { PortableText } from '@/components/PortableText';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Moments collects, uses, and protects your personal information.',
};

export default async function PrivacyPage() {
  const page = await getPrivacyPage().catch(() => null);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{page?.title ?? 'Privacy Policy'}</h1>
        {page?.lastUpdated && (
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {page.lastUpdated}</p>
        )}
      </div>

      {page?.body ? (
        <div className="space-y-6">
          <PortableText value={page.body} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Privacy policy coming soon.</p>
        </div>
      )}
    </div>
  );
}
