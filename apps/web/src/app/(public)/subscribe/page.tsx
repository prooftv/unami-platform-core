import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Subscribe' };

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '27658295041';
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('START')}`;

export default function SubscribePage() {
  return (
    <div className="max-w-md space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subscribe to Moments</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Receive community updates directly on WhatsApp. No app required.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="space-y-2 text-sm">
          <p className="font-medium">How it works</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Tap the button below to open WhatsApp</li>
            <li>Send the pre-filled message</li>
            <li>Choose your region and interests</li>
            <li>Start receiving community moments</li>
          </ol>
        </div>

        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Subscribe via WhatsApp
        </a>

        <p className="text-xs text-muted-foreground text-center">
          Send STOP at any time to unsubscribe. POPIA compliant.
        </p>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Commands</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {[
            ['START', 'Subscribe'],
            ['STOP', 'Unsubscribe'],
            ['HELP', 'Show commands'],
            ['REGIONS', 'Change regions'],
            ['STATUS', 'Your settings'],
            ['RECENT', 'Latest moments'],
          ].map(([cmd, desc]) => (
            <div key={cmd} className="flex gap-2">
              <code className="font-mono font-medium text-foreground">{cmd}</code>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
