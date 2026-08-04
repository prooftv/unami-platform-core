import type { Metadata } from 'next';
import { getAboutPage } from '@/lib/sanity/queries';
import { PortableText } from '@/components/PortableText';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Moments — the community information platform for South Africa.',
};

export default async function AboutPage() {
  const page = await getAboutPage().catch(() => null);

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{page?.title ?? 'About Moments'}</h1>
      </div>

      {page?.body ? (
        <div className="space-y-6">
          <PortableText value={page.body} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Content coming soon.</p>
        </div>
      )}

      <div className="rounded-xl bg-primary text-primary-foreground p-6">
        <h2 className="font-semibold mb-2">Join the community</h2>
        <p className="text-sm text-primary-foreground/80 mb-4">Subscribe to receive Moments in your region. Free. No app required.</p>
        <a href="/subscribe" className="inline-flex items-center rounded-md bg-white text-primary px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-opacity">
          Subscribe via WhatsApp
        </a>
      </div>
    </div>
  );
}
