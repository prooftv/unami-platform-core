'use client';

import { Button } from '@/components/ui/button';

export type DashboardSection = 'overview' | 'operations' | 'publishing' | 'audience' | 'governance' | 'commercial' | 'intelligence' | 'platform';
const SECTIONS: { id: DashboardSection; label: string }[] = [
  { id: 'overview', label: 'Overview' }, { id: 'operations', label: 'Operations' }, { id: 'publishing', label: 'Publishing' },
  { id: 'audience', label: 'Audience' }, { id: 'governance', label: 'Governance' }, { id: 'commercial', label: 'Commercial' },
  { id: 'intelligence', label: 'Intelligence' }, { id: 'platform', label: 'Platform' },
];

export function DashboardTabs({ active, onChange }: { active: DashboardSection; onChange: (section: DashboardSection) => void }) {
  return (
    <div className="overflow-x-auto">
      <nav className="inline-flex min-w-max items-center rounded-lg bg-muted p-1 gap-0.5" aria-label="Dashboard sections">
        {SECTIONS.map(({ id, label }) => (
          <Button
            key={id}
            type="button"
            variant={active === id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange(id)}
            aria-current={active === id ? 'page' : undefined}
            className={active === id ? 'shadow-sm' : 'text-muted-foreground'}
          >
            {label}
          </Button>
        ))}
      </nav>
    </div>
  );
}
