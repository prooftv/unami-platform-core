'use client';

export type DashboardSection =
  | 'overview'
  | 'nodes'
  | 'governance'
  | 'commercial'
  | 'memory'
  | 'platform';

const SECTIONS: { id: DashboardSection; label: string }[] = [
  { id: 'overview',    label: 'Overview' },
  { id: 'nodes',       label: 'Nodes' },
  { id: 'governance',  label: 'Governance' },
  { id: 'commercial',  label: 'Commercial' },
  { id: 'memory',      label: 'Institutional Memory' },
  { id: 'platform',    label: 'Platform' },
];

export function DashboardTabs({
  active,
  onChange,
}: {
  active: DashboardSection;
  onChange: (section: DashboardSection) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <nav
        className="inline-flex min-w-max items-center rounded-lg bg-muted p-1"
        aria-label="Dashboard sections"
      >
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active === id ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
