import type { Metadata } from 'next';
import { getAuthorityPages } from '@/lib/sanity/queries';

export const metadata: Metadata = {
  title: 'Community Authority',
  description: 'Community authorities and official notices on Moments.',
};

const FALLBACK_LEVELS = [
  { label: 'Community Leader', desc: 'Ward-level community representatives and neighbourhood leaders.' },
  { label: 'Local Authority', desc: 'Municipal officials and local government representatives.' },
  { label: 'Traditional Authority', desc: 'Traditional leaders and councils with community governance roles.' },
  { label: 'Provincial Authority', desc: 'Provincial government and regional governance bodies.' },
  { label: 'National Authority', desc: 'National government departments and agencies.' },
];

export default async function AuthorityPage() {
  const authorities = await getAuthorityPages().catch(() => []);

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
          {(authorities.length > 0 ? authorities : FALLBACK_LEVELS).map((item, i) => (
            <div key={'title' in item ? item._id : item.label} className="flex gap-4 rounded-xl border bg-card p-5">
              <div className="shrink-0 rounded-lg bg-primary/10 text-primary w-12 h-12 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <div>
                <p className="font-medium text-sm">{'title' in item ? item.title : item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {'description' in item ? item.description : (item as { desc: string }).desc}
                </p>
              </div>
            </div>
          ))}
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
