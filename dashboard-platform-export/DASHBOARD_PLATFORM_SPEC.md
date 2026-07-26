# Dashboard Platform Design Specification

---

## Purpose

This document defines the architecture of a reusable dashboard platform for
internal applications built within this ecosystem.

The dashboard platform is a shared UI foundation. It is not tied to any single
application, domain, or business workflow.

Applications consume the dashboard platform. They do not own it.

---

## Design Principles

The dashboard platform is domain-agnostic.

It contains no ecommerce logic, no municipal logic, and no workflow logic.
It provides only presentation patterns.

**Applications provide:**
- Navigation configuration
- Branding (logo, app name, color preset)
- Permission and role context
- API service layer
- Business modules and pages

**The dashboard platform provides:**
- Application shell and layout
- Navigation components
- Interaction patterns (loading, error, empty)
- Responsive behaviour
- Visual language and theme system

These boundaries are permanent. They do not shift per application.

---

## Component Ownership

### `packages/ui/dashboard` owns

- AppShell
- Sidebar
- Header
- MobileNav
- PageHeader
- MetricCard
- KPIGrid
- AnalyticsCard
- DataTable
- FilterBar
- ActivityFeed
- QuickActions
- StatusBadge
- EmptyState
- LoadingCard
- SectionTitle
- Breadcrumbs
- All chart wrappers
- All form primitives

### Each application owns

- Its navigation configuration
- Its page components
- Its service layer (API integrations)
- Its permission definitions
- Its business workflows

---

## Extension Rules

Applications may:
- ✓ Compose platform components
- ✓ Configure platform components via props
- ✓ Extend platform components locally for app-specific needs

Applications may not:
- ✗ Duplicate platform components
- ✗ Fork platform components
- ✗ Modify shared package behaviour directly

All changes to shared UI happen in `packages/ui` only.
This prevents divergence across applications.

---

## Package Structure

```
/
├── apps/
│   ├── operations/        # Ecommerce operations
│   ├── itpms/             # Municipal project management
│   ├── crm/               # Future CRM application
│   └── {any-future-app}/  # Any future internal application
│
└── packages/
    └── ui/
        └── dashboard/
            ├── shell/
            │   ├── AppShell
            │   ├── Sidebar
            │   ├── Header
            │   └── MobileNav
            ├── navigation/
            │   ├── navigation.types.ts   # NavigationItem, NavigationSection
            │   ├── Breadcrumbs
            │   └── PageHeader
            ├── layout/
            │   ├── PageShell
            │   └── SectionTitle
            ├── data-display/
            │   ├── MetricCard
            │   ├── KPIGrid
            │   └── ActivityFeed
            ├── charts/
            │   └── AnalyticsCard
            ├── tables/
            │   ├── DataTable
            │   └── FilterBar
            ├── feedback/
            │   ├── EmptyState
            │   ├── LoadingCard
            │   └── StatusBadge
            ├── forms/
            │   └── (shared form primitives)
            └── actions/
                └── QuickActions
```

---

## Application Shell

The shell uses named slots for maximum flexibility across applications.

```tsx
<AppShell>
  <SidebarSlot>
    <Sidebar navigation={appNavigation} branding={appBranding} />
  </SidebarSlot>
  <HeaderSlot>
    <Header search notifications userMenu />
  </HeaderSlot>
  <ContentSlot>
    {children}
  </ContentSlot>
  <FooterSlot />
</AppShell>
```

Each application mounts its own navigation and branding into the slots.
The shell itself never changes.

---

## Navigation Configuration

Navigation is defined as data, not hardcoded into the Sidebar.

```typescript
// packages/ui/dashboard/navigation/navigation.types.ts

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  permissions?: string[];
}

export interface NavigationSection {
  title?: string;
  items: NavigationItem[];
}
```

Each application exports its own navigation config:

```typescript
// apps/operations/src/config/navigation.ts
export const operationsNavigation: NavigationSection[] = [...]

// apps/itpms/src/config/navigation.ts
export const itpmsNavigation: NavigationSection[] = [...]
```

Same Sidebar component. Different navigation. No forking.

---

## Theme System

### Overview

The theme system is a complete preference engine. It handles theme mode,
color presets, fonts, layout options, and sidebar behaviour — all persisted
to cookies and applied before hydration to prevent flicker.

### Files to Carry Across

| File | Purpose |
|------|---------|
| `src/styles/presets/brutalist.css` | Neo Brutalism color preset |
| `src/styles/presets/soft-pop.css` | Soft Pop color preset |
| `src/styles/presets/tangerine.css` | Tangerine color preset |
| `src/lib/preferences/theme.ts` | Preset registry + ThemeMode/ThemePreset types (auto-generated) |
| `src/lib/preferences/theme-utils.ts` | `applyThemeMode`, `applyThemePreset`, system theme subscription |
| `src/lib/preferences/layout.ts` | Sidebar variant, collapsible, content layout, navbar style types |
| `src/lib/preferences/layout-utils.ts` | DOM attribute appliers for layout preferences |
| `src/lib/preferences/preferences-config.ts` | All preference keys, defaults, and persistence modes |
| `src/lib/preferences/preferences-storage.ts` | Persistence writer (cookie / localStorage / server-action) |
| `src/stores/preferences/preferences-store.ts` | Zustand vanilla store for all preferences |
| `src/stores/preferences/preferences-provider.tsx` | React context provider + DOM sync + system theme listener |
| `src/scripts/theme-boot.tsx` | Pre-hydration script — reads cookies and sets `data-*` attributes before React mounts |
| `src/scripts/generate-theme-presets.ts` | Build script — scans preset CSS files and auto-generates `theme.ts` |

### How It Works

1. `ThemeBootScript` runs in `<head>` before hydration — reads cookies, sets `data-theme-mode`, `data-theme-preset`, `data-font`, `data-content-layout`, `data-navbar-style`, `data-sidebar-variant`, `data-sidebar-collapsible` on `<html>`
2. CSS variables in preset files activate via `[data-theme-preset="value"]` selectors
3. `PreferencesStoreProvider` mounts, reads DOM state, syncs to Zustand store
4. User changes a preference → store updates → DOM attribute updates → CSS variables update → `persistPreference()` writes to cookie
5. On next load, `ThemeBootScript` reads the cookie and restores the preference before React mounts

### Preferences

| Key | Type | Options | Default |
|-----|------|---------|--------|
| `theme_mode` | `light \| dark \| system` | Light, Dark, System | `light` |
| `theme_preset` | `default \| brutalist \| soft-pop \| tangerine` | Default, Brutalist, Soft Pop, Tangerine | `default` |
| `font` | `FontKey` | Geist, others from registry | `geist` |
| `content_layout` | `centered \| full-width` | Centered, Full Width | `centered` |
| `navbar_style` | `sticky \| scroll` | Sticky, Scroll | `sticky` |
| `sidebar_variant` | `sidebar \| inset \| floating` | Sidebar, Inset, Floating | `inset` |
| `sidebar_collapsible` | `icon \| offcanvas` | Icon, Offcanvas | `icon` |

### Adding a New Preset

1. Create `src/styles/presets/{name}.css` with `label:` and `value:` comments and CSS variable overrides
2. Run `npm run generate:presets` — `theme.ts` updates automatically
3. The new preset appears in the theme switcher immediately

### Status Colour Mapping (System-Wide)

| Status | Colour | Meaning |
|--------|--------|---------|
| success / active / on-track | Green | Healthy |
| warning / at-risk | Amber | Needs attention |
| error / critical / delayed | Red | Action required |
| neutral / inactive / completed | Gray | No action needed |

### Tokens

| Token | Description |
|-------|-------------|
| Brand | Primary, secondary, accent — defined per preset via CSS variables |
| Spacing | 4px base grid via Tailwind |
| Radius | Border radius scale via `--radius` CSS variable |
| Typography | Font family via `data-font` attribute |
| Status Colours | Green / Amber / Red / Gray — semantic, not preset-specific |
| Chart Palette | Consistent across light/dark via CSS variables |

---

## Standard Page Template

Every module page across every application follows this pattern:

```
PageHeader
  title
  description
  action buttons

FilterBar
  search
  filter controls

DataTable
  sortable columns
  pagination
  row actions

EmptyState (when no data)
```

No redesign per page. Columns and data change. Structure does not.

---

## Interaction Patterns

| State | Implementation |
|-------|---------------|
| Loading | `<Suspense>` + `LoadingCard` skeleton |
| Error | `error.tsx` boundary + retry action |
| Empty | `EmptyState` with icon, message, optional CTA |

All three states are required for every data-bearing page.

---

## Responsive Behaviour

- Sidebar collapses to icon-only on medium screens
- Sidebar becomes a drawer on mobile
- Content area reflows to full width when sidebar is collapsed
- Tables use `overflow-x-auto` with `whitespace-nowrap` cells
- KPIGrid collapses from 4-column to 2-column to 1-column

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js (App Router), TypeScript |
| Monorepo | pnpm Turborepo |
| UI Primitives | Shadcn UI |
| Styling | Tailwind CSS v4 |
| Tables | TanStack Table |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Linting | Biome |
| Deployment | Vercel |

---

## Architecture Rules

- Platform components are domain-agnostic — no business terms in component names
- Server components fetch data, client components render it
- No mock data in production — empty state on API failure
- `server-only` enforced on all server-side query files
- camelCase field names in all API responses
- ISO 8601 dates everywhere
- Bearer token injected via auth helpers — never hardcoded
- Build must pass before every commit

---

## Implementation Sequence

### Sprint 1 — Shell
1. Scaffold Turborepo with `packages/ui` and first app
2. Build `AppShell`, `Sidebar`, `Header`, `MobileNav`
3. Define `NavigationItem` and `NavigationSection` types
4. Wire navigation config into Sidebar
5. Apply theme system and verify light/dark toggle
6. Verify responsive behaviour

### Sprint 2 — Dashboard Page
1. Build `MetricCard`, `KPIGrid`
2. Build `AnalyticsCard` (chart wrapper)
3. Build `ActivityFeed`
4. Assemble first dashboard page with static data
5. Verify layout, spacing, and theme

### Sprint 3 — Module Pages
1. Build `DataTable`, `FilterBar`
2. Build `PageHeader`, `EmptyState`, `StatusBadge`, `LoadingCard`
3. Scaffold first module pages using standard page template
4. Verify all three states (loading, error, empty) on each page

### Sprint 4 — API Integration
1. Wire service layer for first application
2. Replace static data with live API data
3. Confirm loading and error states work end-to-end

---

## Current and Future Consumers

| Application | Domain | Status |
|-------------|--------|--------|
| ITPMS | Municipal project management | Active — first implementation |
| Operations | Ecommerce operations | In development |
| Umkhandlu | Municipal operations | Planned |
| Moments | Event management | Planned |
| Schools Portal | Education administration | Planned |
| CRM | Customer relationship management | Planned |

Each application consumes the same dashboard platform.
Each application owns only its domain-specific modules.

---

END OF SPECIFICATION
