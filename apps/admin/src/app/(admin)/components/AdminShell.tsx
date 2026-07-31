'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppShell, Sidebar, Header, MobileNav, Badge } from '@moments/ui';
import type { NavigationSection } from '@moments/ui';
import type { AdminSession } from '@moments/api';
import {
  Bell, Briefcase, ChevronLeft, ChevronRight, Command, LayoutDashboard, LogOut,
  Megaphone, Menu, Network, Plus, Radio, Search, Settings, ShieldAlert,
  SlidersHorizontal, Tag, Users, X,
} from 'lucide-react';
import { PreferencesPanel } from './PreferencesPanel';
import { useSidebarCollapsible } from '@/lib/preferences/client';

const NAV: NavigationSection[] = [
  { title: 'Workspace', items: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Moments', href: '/moments', icon: Radio },
    { label: 'Broadcasts', href: '/broadcasts', icon: Megaphone },
    { label: 'Campaigns', href: '/campaigns', icon: Briefcase },
  ] },
  { title: 'Operations', items: [
    { label: 'Subscribers', href: '/subscribers', icon: Users },
    { label: 'Moderation', href: '/moderation', icon: ShieldAlert },
    { label: 'Authority', href: '/authority', icon: Network },
    { label: 'Sponsors', href: '/sponsors', icon: Tag },
  ] },
  { title: 'System', items: [{ label: 'Settings', href: '/settings', icon: Settings }] },
];

const ROLE_LABELS: Record<AdminSession['role'], string> = { superadmin: 'Super Admin', content_admin: 'Content Admin', moderator: 'Moderator', viewer: 'Viewer' };
const PAGE_LABELS: Record<string, string> = { dashboard: 'Dashboard', moments: 'Moments', broadcasts: 'Broadcasts', campaigns: 'Campaigns', subscribers: 'Subscribers', moderation: 'Moderation', authority: 'Authority', sponsors: 'Sponsors', settings: 'Settings' };

function CommandPalette({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (href: string) => void }) {
  const [query, setQuery] = useState('');
  const items = useMemo(() => NAV.flatMap((section) => section.items).filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query]);
  useEffect(() => { if (!open) setQuery(''); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-[12vh] backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="command-title" className="w-full max-w-xl overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="command-title" className="sr-only">Command palette</h2>
        <div className="flex items-center gap-3 border-b px-4"><Search className="size-4 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages and actions…" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"><X className="size-4" /></button></div>
        <div className="max-h-80 overflow-y-auto p-2">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Navigation</p>
          {items.map((item) => { const Icon = item.icon; return <button key={item.href} type="button" onClick={() => onNavigate(item.href)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground">{Icon && <Icon className="size-4" />}<span>{item.label}</span><span className="ml-auto text-xs text-muted-foreground">Open</span></button>; })}
          {items.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No matching destinations.</p>}
        </div>
        <div className="flex items-center gap-4 border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground"><span>↑↓ Navigate</span><span>↵ Open</span><span>esc Close</span></div>
      </div>
    </div>
  );
}

export function AdminShell({ session, children }: { session: AdminSession; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [collapsed, setCollapsed] = useSidebarCollapsible();
  const pageTitle = PAGE_LABELS[pathname.split('/').filter(Boolean)[0] ?? 'dashboard'] ?? 'Moments';

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen((value) => !value); }
      if (event.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navigate = (href: string) => { setCommandOpen(false); setMobileOpen(false); router.push(href); };
  const handleLogout = async () => { await fetch('/auth/logout', { method: 'POST' }); router.push('/login'); };
  const sidebarFooter = (
    <div className="flex flex-col gap-1">
      {!collapsed && <div className="flex items-center gap-3 px-2 py-2"><div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">{(session.name ?? session.email).slice(0, 2).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-medium">{session.name ?? session.email}</p><p className="truncate text-[11px] text-sidebar-foreground/50">{ROLE_LABELS[session.role]}</p></div></div>}
      <button type="button" onClick={() => setCollapsed(!collapsed)} className="flex h-9 w-full items-center gap-3 rounded-md px-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight className="size-4" /> : <><ChevronLeft className="size-4" /><span>Collapse sidebar</span></>}</button>
      <button type="button" onClick={handleLogout} className="flex h-9 w-full items-center gap-3 rounded-md px-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><LogOut className="size-4" />{!collapsed && <span>Sign out</span>}</button>
    </div>
  );
  const sidebar = <Sidebar sections={NAV} activePath={pathname} collapsed={collapsed} onNavigate={navigate} header={collapsed ? <Radio className="size-5" /> : <div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Radio className="size-4" /></div><div><p className="text-sm font-semibold tracking-tight">Moments</p><p className="text-[11px] text-sidebar-foreground/50">Operations platform</p></div></div>} footer={sidebarFooter} />;

  return (
    <>
      <AppShell sidebar={sidebar} header={<Header leading={<button type="button" onClick={() => setMobileOpen(true)} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden" aria-label="Open navigation"><Menu className="size-4" /></button>} title={<div className="flex items-center gap-2"><span className="hidden text-muted-foreground sm:inline">Workspace</span><span className="hidden text-muted-foreground sm:inline">/</span><span>{pageTitle}</span></div>} actions={<><button type="button" onClick={() => setCommandOpen(true)} className="hidden h-9 w-56 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-accent lg:flex"><Search className="size-4" /><span>Search</span><span className="ml-auto flex items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px]"><Command className="size-3" />K</span></button><button type="button" onClick={() => router.push('/moments/new')} className="hidden h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 sm:flex"><Plus className="size-4" />New moment</button><button type="button" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground" aria-label="Notifications"><Bell className="size-4" /></button><button type="button" onClick={() => setPrefsOpen(true)} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground" aria-label="Open preferences"><SlidersHorizontal className="size-4" /></button></>} userArea={<Badge variant="outline" className="hidden sm:inline-flex">{ROLE_LABELS[session.role]}</Badge>} />}>{children}</AppShell>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)}><Sidebar sections={NAV} activePath={pathname} onNavigate={navigate} className="static h-full w-full border-0" footer={sidebarFooter} /></MobileNav>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onNavigate={navigate} />
      <PreferencesPanel open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </>
  );
}
