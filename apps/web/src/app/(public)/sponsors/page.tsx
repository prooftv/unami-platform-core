import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sponsors',
  description: 'Community partners and sponsors supporting Moments.',
};

const TIERS = [
  {
    tier: 'Platinum',
    description: 'Our highest-tier community partners. Platinum sponsors support Moments at the national level.',
    color: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
  },
  {
    tier: 'Gold',
    description: 'Gold sponsors support regional content and community initiatives.',
    color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  },
  {
    tier: 'Silver',
    description: 'Silver sponsors support category-specific content.',
    color: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
  },
  {
    tier: 'Bronze',
    description: 'Bronze sponsors support local community moments.',
    color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  },
];

export default function SponsorsPage() {
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

      <div className="space-y-6">
        {TIERS.map(({ tier, description, color }) => (
          <div key={tier} className={`rounded-xl border p-6 ${color}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{tier} Partners</h2>
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              Sponsor profiles will appear here
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-primary text-primary-foreground p-6">
        <h2 className="font-semibold mb-2">Become a sponsor</h2>
        <p className="text-sm text-primary-foreground/80 mb-4">
          Support your community and reach engaged local audiences. Sponsorship packages available for businesses, NGOs, and government organisations.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center rounded-md bg-white text-primary px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-opacity"
        >
          Get in touch
        </Link>
      </div>
    </div>
  );
}
