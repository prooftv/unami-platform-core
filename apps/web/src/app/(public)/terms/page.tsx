import type { Metadata } from 'next';
import { getTermsPage } from '@/lib/sanity/queries';
import { PortableText } from '@/components/PortableText';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the Moments community platform.',
};

export default async function TermsPage() {
  const page = await getTermsPage().catch(() => null);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{page?.title ?? 'Terms of Service'}</h1>
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
          <p className="text-sm text-muted-foreground">Terms of service coming soon.</p>
        </div>
      )}
    </div>
  );
}
