import type { Metadata } from 'next';
import { getPrivacyPage } from '@/lib/sanity/queries';
import { PortableText } from '@/components/PortableText';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Moments collects, uses, and protects your personal information.',
};

const FALLBACK = [
  { heading: 'Information we collect', body: 'When you subscribe to Moments via WhatsApp, we collect your phone number and the preferences you provide (region, categories, delivery schedule). We do not collect your name, email address, or any other personal information unless you voluntarily provide it.' },
  { heading: 'How we use your information', body: 'Your phone number is used solely to deliver Moments updates to you via WhatsApp. Your preferences are used to filter and personalise the content you receive. We do not use your information for advertising, profiling, or any purpose other than delivering the service you subscribed to.' },
  { heading: 'Data sharing', body: 'We do not sell, rent, or share your personal information with third parties. Sponsored content is delivered through our platform — sponsors do not receive subscriber data.' },
  { heading: 'Your rights (POPIA)', body: 'Under the Protection of Personal Information Act (POPIA), you have the right to access, correct, or delete your personal information. You may unsubscribe at any time by sending STOP to our WhatsApp number. To request deletion of your data, contact us directly.' },
  { heading: 'Data retention', body: 'We retain your subscription data for as long as you are subscribed. Upon unsubscription, your data is retained for 30 days for compliance purposes, then permanently deleted.' },
  { heading: 'Contact', body: 'For privacy-related enquiries, contact us via WhatsApp or through the Help page.' },
];

export default async function PrivacyPage() {
  const page = await getPrivacyPage().catch(() => null);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{page?.title ?? 'Privacy Policy'}</h1>
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
