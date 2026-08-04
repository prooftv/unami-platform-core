import type { Metadata } from 'next';
import { getHelpArticles } from '@/lib/sanity/queries';
import { PortableText } from '@/components/PortableText';

export const metadata: Metadata = {
  title: 'Help',
  description: 'How to use Moments — commands, preferences, and support.',
};

const FALLBACK_COMMANDS = [
  { cmd: 'START', desc: 'Subscribe to Moments' },
  { cmd: 'STOP', desc: 'Unsubscribe from all updates' },
  { cmd: 'HELP', desc: 'Show available commands' },
  { cmd: 'STATUS', desc: 'View your current subscription settings' },
  { cmd: 'REGIONS', desc: 'Update your region preferences' },
  { cmd: 'RECENT', desc: 'Receive the latest 5 moments' },
  { cmd: 'MYAUTHORITY', desc: 'Get updates from your local authority' },
  { cmd: 'PAUSE', desc: 'Pause updates for 24 hours' },
];

export default async function HelpPage() {
  const articles = await getHelpArticles().catch(() => []);

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Everything you need to know about using Moments.
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="space-y-6">
          {articles.map((article) => (
            <div key={article._id} className="rounded-xl border bg-card p-6">
              <h2 className="font-semibold mb-3">{article.title}</h2>
              {article.body && <PortableText value={article.body} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">WhatsApp Commands</h2>
            <div className="space-y-3">
              {FALLBACK_COMMANDS.map(({ cmd, desc }) => (
                <div key={cmd} className="flex items-start gap-4">
                  <code className="shrink-0 rounded bg-muted px-2 py-1 text-xs font-mono font-semibold text-foreground min-w-[100px]">
                    {cmd}
                  </code>
                  <span className="text-sm text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-3">How to subscribe</h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
              <li>Open WhatsApp on your phone</li>
              <li>Send <code className="font-mono text-foreground">START</code> to our number</li>
              <li>Follow the prompts to choose your region and interests</li>
              <li>You will receive a confirmation message</li>
            </ol>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-3">How to unsubscribe</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Send <code className="font-mono text-foreground">STOP</code> at any time to unsubscribe. POPIA compliant.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-3">Delivery schedules</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              {[['Instant','Receive moments as they are published'],['Morning','Daily digest at 7:00 AM'],['Evening','Daily digest at 6:00 PM'],['Weekly','Weekly summary every Monday']].map(([label, desc]) => (
                <div key={label} className="flex gap-3">
                  <span className="font-medium text-foreground w-20">{label}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-3">Privacy and data</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Moments only stores your phone number and preferences. We never share your data with third parties. All processing is POPIA compliant. See our{' '}
              <a href="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors">Privacy Policy</a> for full details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
