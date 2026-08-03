import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campaigns',
  description: 'Active community campaigns on Moments.',
};

export default function CampaignsPage() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Community campaigns are sponsored initiatives that run across multiple moments. They support local causes, awareness drives, and community programmes.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-2">What is a campaign?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A campaign is a series of related moments published by a sponsor over a defined period. Campaigns may target specific regions or categories. All campaign content is reviewed before broadcast.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Active Campaigns</h2>
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Active campaigns will appear here.</p>
          <p className="mt-1 text-xs text-muted-foreground">Campaign data will be connected in a future update.</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Past Campaigns</h2>
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">Completed campaigns will appear here.</p>
        </div>
      </div>
    </div>
  );
}
