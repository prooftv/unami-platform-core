import type { Metadata } from 'next';
import Link from 'next/link';
import { getSponsorPages } from '@/lib/sanity/queries';

export const metadata: Metadata = {
  title: 'Sponsors',
  description: 'Community partners and sponsors supporting Moments.',
};

export default async function SponsorsPage() {
  const sponsors = await getSponsorPages().catch(() => []);

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Sponsors</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Moments is supported by community partners who believe in the power of local information. Sponsors fund the platform and enable free access for all subscribers.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-2">How sponsorship works</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sponsors fund community moments in their area of interest. Sponsored content is clearly labelled and reviewed by our editorial team. Sponsors do not have access to subscriber data and cannot influence non-sponsored content.
        </p>
      </div>

      {sponsors.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {sponsors.map((sponsor) => (
            <Link
              key={sponsor._id}
              href={`/sponsors/${sponsor.slug.current}`}
              className="rounded-xl border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <p className="font-medium">{sponsor.title}</p>
              {sponsor.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{sponsor.description}</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Sponsor profiles coming soon.</p>
        </div>
      )}

      <div className="rounded-xl bg-primary text-primary-foreground p-6">
        <h2 className="font-semibold mb-2">Become a sponsor</h2>
        <p className="text-sm text-primary-foreground/80 mb-4">
          Support your community and reach engaged local audiences. Sponsorship packages available for businesses, NGOs, and government organisations.
        </p>
        <Link href="/contact" className="inline-flex items-center rounded-md bg-white text-primary px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-opacity">
          Get in touch
        </Link>
      </div>
    </div>
  );
}
