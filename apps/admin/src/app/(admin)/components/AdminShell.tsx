'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppShell, Sidebar, Header } from '@moments/ui';
import type { NavigationSection } from '@moments/ui';
import type { AdminSession } from '@moments/api';
import {
  LayoutDashboard, Radio, Megaphone, Users, ShieldAlert,
  Network, Tag, Briefcase, Settings, LogOut,
  ChevronLeft, ChevronRight, SlidersHorizontal,
} from 'lucide-react';
import { PreferencesPanel } from './PreferencesPanel';
import { useSidebarCollapsible } from '@/lib/preferences/client';

const NAV: NavigationSection[] = [
  {
    title: 'Content',
    items: [
      { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
      { label: 'Moments',     href: '/moments',     icon: Radio },
      { label: 'Broadcasts',  href: '/broadcasts',  icon: Megaphone },
      { label: 'Campaigns',   href: '/campaigns',   icon: Briefcase },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Subscribers', href: '/subscribers', icon: Users },
      { label: 'Moderation',  href: '/moderation',  icon: ShieldAlert },
      { label: 'Authority',   href: '/authority',   icon: Network },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Sponsors',    href: '/sponsors',    icon: Tag },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings',    href: '/settings',    icon: Settings },
    ],
  },
];

const ROLE_LABELS: Record<AdminSession['role'], string> = {
  superadmin:    'Super Admin',
  content_admin: 'Content Admin',
  moderator:     'Moderator',
  viewer:        'Viewer',
};

interface AdminShellProps {
  session: AdminSession;
  children: React.ReactNode;
}

export function AdminShell({ session, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [collapsed, setCollapsed] = useSidebarCollapsible();

  async function handleLogout() {
    await fetch('/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            sections={NAV}
            activePath={pathname}
            collapsed={collapsed}
            header={
              collapsed ? (
                <Radio className="h-5 w-5 text-sidebar-foreground" />
              ) : (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight">Moments v2</span>
                  <span className="text-xs text-sidebar-foreground/50">Admin</span>
                </div>
              )
            }
            footer={
              <div className="space-y-1">
                {!collapsed && (
                  <div className="px-2 py-1">
                    <p className="text-xs font-medium truncate">{session.name ?? session.email}</p>
                    <p className="text-xs text-sidebar-foreground/50">{ROLE_LABELS[session.role]}</p>
                  </div>
                )}
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {collapsed
                    ? <ChevronRight className="h-4 w-4 shrink-0" />
                    : <><ChevronLeft className="h-4 w-4 shrink-0" /><span>Collapse</span></>
                  }
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Sign out</span>}
                </button>
              </div>
            }
          />
        }
        header={
          <Header
            title="Moments Admin"
            actions={
              <button
                onClick={() => setPrefsOpen(true)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Open preferences"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            }
            userArea={
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {ROLE_LABELS[session.role]}
              </span>
            }
          />
        }
      >
        {children}
      </AppShell>

      <PreferencesPanel open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </>
  );
}
