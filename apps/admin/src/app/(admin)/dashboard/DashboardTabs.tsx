'use client';

export type DashboardSection =
  | 'overview'
  | 'operations'
  | 'publishing'
  | 'audience'
  | 'governance'
  | 'commercial'
  | 'platform';

const SECTIONS: { id: DashboardSection; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'operations', label: 'Operations' },
  { id: 'publishing', label: 'Publishing' },
  { id: 'audience', label: 'Audience' },
  { id: 'governance', label: 'Governance' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'platform', label: 'Platform' },
];

type DashboardTabsProps = {
  active: DashboardSection;
  onChange: (section: DashboardSection) => void;
};

export function DashboardTabs({ active, onChange }: DashboardTabsProps) {
  return (
    <div className="border-b overflow-x-auto">
      <nav className="flex min-w-max">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ' +
              (active === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border')
            }
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
