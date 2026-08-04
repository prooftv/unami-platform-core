import type { Metadata } from 'next';
import { getTermsPage } from '@/lib/sanity/queries';
import { PortableText } from '@/components/PortableText';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the Moments community platform.',
};

const FALLBACK = [
  { heading: 'Acceptance of terms', body: 'By subscribing to Moments or using this website, you agree to these terms. If you do not agree, please do not use the service.' },
  { heading: 'The service', body: 'Moments is a community information platform that delivers local news and updates via WhatsApp. The service is provided free of charge to subscribers. Standard WhatsApp data rates may apply.' },
  { heading: 'Content', body: 'Content published on Moments is provided by verified administrators and community authorities. While we review content before broadcast, we do not guarantee the accuracy of all information. Always verify critical information through official sources.' },
  { heading: 'Acceptable use', body: 'You may not use Moments to distribute spam, misinformation, or harmful content. Abuse of the WhatsApp command system may result in suspension of your subscription.' },
  { heading: 'Sponsored content', body: 'Some Moments are sponsored by community partners. Sponsored content is clearly labelled. Sponsors do not influence editorial decisions or have access to subscriber data.' },
  { heading: 'Changes to terms', body: 'We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.' },
];

export default async function TermsPage() {
  const page = await getTermsPage().catch(() => null);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{page?.title ?? 'Terms of Service'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {page?.lastUpdated ?? new Date().getFullYear()}
        </p>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        {page?.body ? (
          <PortableText value={page.body} />
        ) : (
          FALLBACK.map(({ heading, body }) => (
            <div key={heading} className="rounded-xl border bg-card p-6 space-y-3">
              <h2 className="font-semibold text-foreground">{heading}</h2>
              <p>{body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
