'use client';

export type DashboardSection = 'overview' | 'operations' | 'publishing' | 'audience' | 'governance' | 'commercial' | 'intelligence' | 'platform';
const SECTIONS: { id: DashboardSection; label: string }[] = [
  { id: 'overview', label: 'Overview' }, { id: 'operations', label: 'Operations' }, { id: 'publishing', label: 'Publishing' },
  { id: 'audience', label: 'Audience' }, { id: 'governance', label: 'Governance' }, { id: 'commercial', label: 'Commercial' },
  { id: 'intelligence', label: 'Intelligence' }, { id: 'platform', label: 'Platform' },
];

export function DashboardTabs({ active, onChange }: { active: DashboardSection; onChange: (section: DashboardSection) => void }) {
  return (
    <div className="overflow-x-auto">
      <nav className="inline-flex min-w-max items-center rounded-lg bg-muted p-1" aria-label="Dashboard sections">
        {SECTIONS.map(({ id, label }) => <button key={id} type="button" onClick={() => onChange(id)} aria-current={active === id ? 'page' : undefined} className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${active === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{label}</button>)}
      </nav>
    </div>
  );
}
