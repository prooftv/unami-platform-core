import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the Moments community platform.',
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Acceptance of terms</h2>
          <p>By subscribing to Moments or using this website, you agree to these terms. If you do not agree, please do not use the service.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">The service</h2>
          <p>Moments is a community information platform that delivers local news and updates via WhatsApp. The service is provided free of charge to subscribers. Standard WhatsApp data rates may apply.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Content</h2>
          <p>Content published on Moments is provided by verified administrators and community authorities. While we review content before broadcast, we do not guarantee the accuracy of all information. Always verify critical information through official sources.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Acceptable use</h2>
          <p>You may not use Moments to distribute spam, misinformation, or harmful content. Abuse of the WhatsApp command system may result in suspension of your subscription.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Sponsored content</h2>
          <p>Some Moments are sponsored by community partners. Sponsored content is clearly labelled. Sponsors do not influence editorial decisions or have access to subscriber data.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Changes to terms</h2>
          <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
        </div>
      </div>
    </div>
  );
}
