import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Moments collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Information we collect</h2>
          <p>When you subscribe to Moments via WhatsApp, we collect your phone number and the preferences you provide (region, categories, delivery schedule). We do not collect your name, email address, or any other personal information unless you voluntarily provide it.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">How we use your information</h2>
          <p>Your phone number is used solely to deliver Moments updates to you via WhatsApp. Your preferences are used to filter and personalise the content you receive. We do not use your information for advertising, profiling, or any purpose other than delivering the service you subscribed to.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Data sharing</h2>
          <p>We do not sell, rent, or share your personal information with third parties. Sponsored content is delivered through our platform — sponsors do not receive subscriber data.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Your rights (POPIA)</h2>
          <p>Under the Protection of Personal Information Act (POPIA), you have the right to access, correct, or delete your personal information. You may unsubscribe at any time by sending <code className="font-mono text-foreground">STOP</code> to our WhatsApp number. To request deletion of your data, contact us directly.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Data retention</h2>
          <p>We retain your subscription data for as long as you are subscribed. Upon unsubscription, your data is retained for 30 days for compliance purposes, then permanently deleted.</p>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground">Contact</h2>
          <p>For privacy-related enquiries, contact us via WhatsApp or through the Help page.</p>
        </div>
      </div>
    </div>
  );
}
