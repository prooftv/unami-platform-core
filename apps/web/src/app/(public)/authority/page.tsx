import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Authority',
  description: 'Community authorities and official notices on Moments.',
};

const LEVELS = [
  { level: 'Level 1', label: 'Community Leader', desc: 'Ward-level community representatives and neighbourhood leaders.' },
  { level: 'Level 2', label: 'Local Authority', desc: 'Municipal officials and local government representatives.' },
  { level: 'Level 3', label: 'Traditional Authority', desc: 'Traditional leaders and councils with community governance roles.' },
  { level: 'Level 4', label: 'Provincial Authority', desc: 'Provincial government and regional governance bodies.' },
  { level: 'Level 5', label: 'National Authority', desc: 'National government departments and agencies.' },
];

export default function AuthorityPage() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Authority</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Moments works with verified community authorities to surface official notices, governance updates, and important announcements from trusted local leaders.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-2">What is a community authority?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Community authorities are verified individuals or organisations with recognised governance roles in their communities. Authority-verified content is reviewed and approved before broadcast, ensuring accuracy and accountability.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Authority Levels</h2>
        <div className="space-y-3">
          {LEVELS.map(({ level, label, desc }) => (
            <div key={level} className="flex gap-4 rounded-xl border bg-card p-5">
              <div className="shrink-0 rounded-lg bg-primary/10 text-primary w-12 h-12 flex items-center justify-center text-xs font-bold">
                {level.split(' ')[1]}
              </div>
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Authority Notices</h2>
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Authority profiles and notices will appear here.</p>
          <p className="mt-1 text-xs text-muted-foreground">Authority data will be connected in a future update.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-2">MYAUTHORITY command</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          WhatsApp subscribers can send <code className="font-mono text-foreground">MYAUTHORITY</code> to receive the latest notices from their local authority based on their registered region.
        </p>
      </div>
    </div>
  );
}
