'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/settings/profile',    label: 'Profile' },
  { href: '/settings/appearance', label: 'Appearance' },
  { href: '/settings/platform',   label: 'Platform' },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
            pathname === href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
