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
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Moments is a community information platform built for South Africa. We deliver local news, community updates, and important announcements directly to your WhatsApp — no app required.
        </p>
      </div>

      {page?.body ? (
        <div className="space-y-6">
          <PortableText value={page.body} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-2">What is Moments?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Moments connects communities with the information that matters to them. From safety alerts and health updates to local events and educational opportunities — Moments brings it all together in one trusted channel.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-2">How it works</h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Subscribe via WhatsApp by sending <code className="font-mono text-foreground">START</code></li>
              <li>Choose your region and topics of interest</li>
              <li>Receive curated community updates on your schedule</li>
              <li>Reply with commands to manage your preferences</li>
            </ol>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-2">Who publishes Moments?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Content is published by verified community administrators, authority figures, and trusted local organisations. All content is reviewed before broadcast to ensure accuracy and community standards.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-2">Community authorities</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Moments works with traditional authorities, community leaders, and local government to surface official notices and community governance updates. Authority-verified content is clearly marked.
            </p>
          </div>
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
