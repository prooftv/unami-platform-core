# Platform Dashboard Shell

Constitutional specification for the Unami dashboard application foundation.

Every Unami dashboard application is built on this foundation.
This document defines what the platform owns, what the application owns, and the contract between them.

---

## Ownership Boundary

```
Platform Core owns:
├── ThemeBootScript           — pre-hydration preference boot
├── ShellNavMain types        — NavGroup, NavMainItem, NavMainLinkItem, NavMainParentItem
├── ShellLayoutControls       — preferences popover (theme, font, layout, sidebar)
├── ShellThemeSwitcher        — light/dark/system cycle button
├── ShellNavUser              — user menu with logout
├── ShellSearchDialog types   — ShellSearchItem type contract
├── PreferencesStoreProvider  — Zustand preferences store + provider
├── PREFERENCE_REGISTRY       — all preference definitions, defaults, persistence
├── FONT_CONFIG               — canonical font variable map (10 fonts)
├── PageHeader                — every page title/description/actions
├── KPIGrid + MetricCard      — every KPI row
├── TablePagination           — every paginated table footer
├── TableToolbar              — every search + filter toolbar
├── BulkActionBar             — every table with bulk selection
├── DataTable                 — static column tables with selection
├── EmptyState, ErrorState    — empty and error states
├── PageSkeleton, TableSkeleton — loading states
└── Charts, ActivityFeed, QuickActions — analytics and dashboard widgets

Application owns:
├── app-config.ts             — name, subtitle
├── sidebar-items.ts          — navigation configuration (imports types from @unami/ui)
├── nav-main.tsx              — NavMain component (uses @unami/ui types + app shadcn)
├── app-sidebar.tsx           — AppSidebar (icon, APP_CONFIG, sidebarItems)
├── nav-user.tsx              — NavUser (ROLE_LABELS, logout route)
├── search-dialog.tsx         — SearchDialog (wired to app sidebarItems)
├── (app)/layout.tsx          — shell layout (auth gate, SidebarProvider, header)
├── app/layout.tsx            — root layout (metadata, fontVars, PREFERENCE_DEFAULTS)
├── lib/fonts/registry.ts     — font instantiation (next/font/google)
├── lib/auth/operator.ts      — session validation (Supabase or mock)
├── server/server-actions.ts  — getPreference, cookie helpers (next/headers)
├── scripts/                  — DELETED — ThemeBootScript now from @unami/ui
├── domain/                   — all domain types, enums, validators
└── components/ui/            — app-local shadcn primitives
```

The constitutional test: deleting any application must leave `packages/` compiling without modification.

---

## What Cannot Move Into `packages/ui`

These files are structurally identical across apps but depend on Next.js APIs.
They stay in each application. They are documented here as templates, not extracted as components.

| File | Next.js dependency | Status |
|---|---|---|
| `nav-main.tsx` | `next/link`, `next/navigation` | Template — stays in app |
| `server-actions.ts` | `next/headers` | Template — stays in app |
| `lib/fonts/registry.ts` | `next/font/google` | Template — stays in app |
| `(app)/layout.tsx` | `next/headers`, `next/navigation` | Template — stays in app |
| `app/layout.tsx` | Next.js Metadata API | Template — stays in app |

---

## Mandatory shadcn Primitive Set

Every Unami dashboard application must include these shadcn components in `src/components/ui/`:

```
alert.tsx           alert-dialog.tsx    avatar.tsx
badge.tsx           breadcrumb.tsx      button.tsx
card.tsx            checkbox.tsx        collapsible.tsx
command.tsx         dialog.tsx          dropdown-menu.tsx
input.tsx           input-group.tsx     label.tsx
pagination.tsx      popover.tsx         progress.tsx
radio-group.tsx     scroll-area.tsx     select.tsx
separator.tsx       sheet.tsx           sidebar.tsx
skeleton.tsx        sonner.tsx          switch.tsx
table.tsx           tabs.tsx            textarea.tsx
toggle.tsx          toggle-group.tsx    tooltip.tsx
```

This is the UNCIP-validated complete set (31 components). Do not start with a subset.

---

## Shell Layout Template

Every application's `src/app/(app)/layout.tsx` follows this exact structure.
Copy this template. Replace the three product-specific values.

```tsx
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOperatorSession } from '@/lib/auth/operator';       // product-specific
import { getPreference } from '@/server/server-actions';
import { AppSidebar } from './dashboard/_components/sidebar/app-sidebar';
import { SearchDialog } from './dashboard/_components/header/search-dialog';
import { ShellThemeSwitcher, ShellLayoutControls } from '@unami/ui';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getOperatorSession();
  if (!session) redirect('/login');

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';
  const [variant, collapsible] = await Promise.all([
    getPreference('sidebar_variant'),
    getPreference('sidebar_collapsible'),
  ]);

  const user = { name: session.name ?? '', email: session.email, role: session.role };

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={{ '--sidebar-width': 'calc(var(--spacing) * 68)' } as React.CSSProperties}
    >
      <AppSidebar user={user} variant={variant} collapsible={collapsible} />
      <SidebarInset
        className={cn(
          '[html[data-content-layout=centered]_&>*]:mx-auto',
          '[html[data-content-layout=centered]_&>*]:w-full',
          '[html[data-content-layout=centered]_&>*]:max-w-screen-2xl',
          'peer-data-[variant=inset]:border',
          '[--dashboard-header-height:--spacing(12)]',
          'min-w-0 overflow-x-clip',
        )}
      >
        <header
          className={cn(
            'flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12',
            '[html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md',
          )}
        >
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
              />
              <SearchDialog />
            </div>
            <div className="flex items-center gap-2">
              <ShellLayoutControls />
              <ShellThemeSwitcher />
            </div>
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## Root Layout Template

Every application's `src/app/layout.tsx` follows this structure.
Replace `metadata` values only.

```tsx
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { fontVars } from '@/lib/fonts/registry';
import { PREFERENCE_DEFAULTS, PreferencesStoreProvider, ThemeBootScript } from '@unami/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'Product Name',          // ← product-specific
  description: 'Product tagline', // ← product-specific
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme_mode, theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } = PREFERENCE_DEFAULTS;

  return (
    <html
      lang="en"
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        <ThemeBootScript />
      </head>
      <body className={`${fontVars} min-h-screen antialiased`}>
        <TooltipProvider>
          <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
            {children}
            <Toaster />
          </PreferencesStoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
```

---

## Navigation Configuration Template

Every application's `src/navigation/sidebar/sidebar-items.ts` imports types from `@unami/ui`.

```ts
import { SomeIcon } from 'lucide-react';
import type { NavGroup } from '@unami/ui';

// Re-export types for local consumers (nav-main.tsx etc.)
export type { NavBadge, NavSubItem, NavMainLinkItem, NavMainParentItem, NavMainItem, NavGroup } from '@unami/ui';

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    items: [
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard', icon: SomeIcon },
    ],
  },
  // ... product navigation groups
];
```

---

## Settings Structure

Every application includes a settings section with this structure:

```
settings/
├── layout.tsx              — PageHeader + SettingsNav + content slot
├── page.tsx                — redirect to /settings/profile
├── _components/
│   └── settings-nav.tsx    — nav links (Profile, Appearance, Platform + product-specific)
├── profile/
│   └── page.tsx            — display name, email (read-only until auth phase)
├── appearance/
│   └── page.tsx            — full preferences form (AppearanceForm)
└── platform/
    └── page.tsx            — app name, version, environment info
```

---

## Mandatory Route States

Every route must have:

| File | Component | Notes |
|---|---|---|
| `loading.tsx` | `PageSkeleton` or `TableSkeleton` | Required on every route |
| `error.tsx` | `ErrorState` with retry | Required on data-fetching routes |
| `not-found.tsx` | `EmptyState` or custom | Required at app root |
| `global-error.tsx` | Minimal fallback | Required at app root |

---

## AppSidebar Template

Product-specific values: icon import, `APP_CONFIG.name`.
Everything else is identical across all applications.

```tsx
'use client';

import Link from 'next/link';
import { SomeIcon } from 'lucide-react'; // ← product icon
import { useShallow } from 'zustand/react/shallow';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
         SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { APP_CONFIG } from '@/config/app-config';
import { sidebarItems } from '@/navigation/sidebar/sidebar-items';
import { usePreferencesStore } from '@unami/ui';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { name: string; email: string; role: string };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href="/dashboard">
                <SomeIcon />
                <span className="font-semibold text-base">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser name={user.name} email={user.email} role={user.role} />
      </SidebarFooter>
    </Sidebar>
  );
}
```

---

## New Application Checklist

When scaffolding a new Unami dashboard application:

```
□ Copy shell layout template → src/app/(app)/layout.tsx
□ Copy root layout template → src/app/layout.tsx
□ Copy nav-main.tsx from umkhandlu/uncip (clean version, no Moments-specific UI)
□ Copy nav-user.tsx — update ROLE_LABELS for product roles
□ Copy search-dialog.tsx — update placeholder string
□ Copy server-actions.ts — no changes needed
□ Copy lib/fonts/registry.ts — no changes needed
□ Create app-config.ts — set name and subtitle
□ Create sidebar-items.ts — import types from @unami/ui, define product navigation
□ Create app-sidebar.tsx — set product icon
□ Create lib/auth/operator.ts — implement session validation (or mock for UI phase)
□ Install all 31 shadcn primitives
□ Create settings/ structure (layout, nav, profile, appearance, platform)
□ Add loading.tsx to every route
□ Add error.tsx to data-fetching routes
□ Add not-found.tsx and global-error.tsx at app root
□ Verify TypeScript: zero errors
□ Verify boundary: deleting this app leaves packages/ compiling
```

---

## What `@unami/ui` Exports for Shell Consumers

```ts
// Shell primitives
ThemeBootScript           // pre-hydration script tag
ShellLayoutControls       // preferences popover
ShellThemeSwitcher        // theme cycle button
ShellNavUser              // user menu
ShellSearchItem           // type for search dialog items

// Nav types
NavGroup
NavMainItem
NavMainLinkItem
NavMainParentItem
NavSubItem
NavBadge

// Preferences
PreferencesStoreProvider
usePreferencesStore
PREFERENCE_DEFAULTS
PREFERENCE_REGISTRY
THEME_PRESET_OPTIONS
fontOptions               // from FONT_CONFIG

// Structural components
PageHeader
KPIGrid, MetricCard
TablePagination, TableToolbar, BulkActionBar, DataTable
EmptyState, ErrorState
PageSkeleton, TableSkeleton
StatusBadge
AnalyticsCard, LineChart, BarChart, PieChart, AreaChart
ActivityFeed, QuickActions
```

---

## Extraction History

| Date | What moved | From → To |
|---|---|---|
| Phase 19 Step 0 | `ThemeBootScript` | All three apps → `packages/ui/src/shell/` |
| Phase 19 Step 0 | Nav types (`NavGroup` etc.) | All three apps → `packages/ui/src/shell/nav-types.ts` |
| Phase 19 Step 0 | `ShellLayoutControls` | All three apps (local copy) → `packages/ui/src/shell/` (already existed, apps now consume directly) |
| Phase 19 Step 0 | `FONT_CONFIG` | Already in `packages/ui/src/fonts/registry.ts` — apps confirmed consuming |

---

## What Stays in Each App (Never Extracted)

These files are structurally identical but depend on Next.js. They are templates, not shared components.

- `nav-main.tsx` — needs `next/link`, `next/navigation`, app-local shadcn sidebar
- `server-actions.ts` — needs `next/headers`
- `lib/fonts/registry.ts` — needs `next/font/google`
- `(app)/layout.tsx` — needs `next/headers`, `next/navigation`, async server component
- `app/layout.tsx` — needs Next.js Metadata API

The rule: if it imports from `next/`, it stays in the application.
