# Unami Platform Core

## What It Is

Unami Platform Core is the shared engineering foundation for a family of digital products.

The platform is complete at v1.0.0. All future work is application validation — building products
that prove the platform works, reveal what it still needs, and expand its capabilities only when
a concrete requirement demands it.

**Platform Core provides the consistency. Each application provides the meaning.**

```
                    UNAMI PLATFORM CORE
                           │
              ┌────────────┴────────────┐
              │  @unami/ui              │  Design system, shell primitives,
              │  @unami/shared          │  platform contracts, typed clients
              │  @unami/api             │
              └────────────┬────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Moments         Umkhandlu          UNCIP
       Product          Product           Product
          │                │                │
       domain            domain            domain
       auth              auth              auth
       navigation        navigation        navigation
       backend           backend           backend
```

---

## The Core Distinction

**Platform layer** (`packages/`) — shared by every application, contains no business domain:
- `@unami/ui` — design system primitives, shell infrastructure, theme engine, structural components
- `@unami/shared` — platform contracts: RBAC, Language, Pagination, Utilities, Auth validators
- `@unami/api` — typed HTTP clients for Edge Functions and governance node APIs

**Application layer** (`apps/`) — each application owns its shell configuration, domain, and workflows:
- `apps/admin` — Moments admin. Owns `domain/moments/`, shell, all admin modules.
- `apps/web` — Moments public PWA. Owns public routing, `domain/moments.ts`.
- `apps/umkhandlu` — Unami Control Centre. Read-only intelligence aggregation across governance nodes.
- `apps/uncip` — UNCIP v2. Child safety platform. Owns `domain/uncip/`.

**The deletion test:** Deleting any application must leave `packages/` compiling without modification.
This test must always pass. It is the constitutional proof of correct layer separation.

---

## What the Platform Owns

```
Platform Core owns:
├── ThemeBootScript           — pre-hydration preference boot
├── ShellLayoutControls       — preferences popover
├── ShellThemeSwitcher        — theme cycle button
├── ShellNavUser              — user menu with logout
├── Nav types                 — NavGroup, NavMainItem, NavMainLinkItem, NavMainParentItem
├── PreferencesStoreProvider  — Zustand preferences store
├── PREFERENCE_REGISTRY       — all preference definitions and defaults
├── FONT_CONFIG               — canonical font variable map
├── PageHeader                — every page title/description/actions
├── KPIGrid + MetricCard      — every KPI row
├── TablePagination           — every paginated table footer
├── TableToolbar              — every search + filter toolbar
├── BulkActionBar             — every table with bulk selection
├── DataTable                 — static column tables with selection
├── EmptyState, ErrorState    — empty and error states
├── PageSkeleton, TableSkeleton — loading states
└── Charts, ActivityFeed, QuickActions — analytics and dashboard widgets
```

## What Applications Own

```
Applications own:
├── app-config.ts             — name, subtitle
├── sidebar-items.ts          — navigation configuration
├── nav-main.tsx              — NavMain component (Next.js dependency)
├── app-sidebar.tsx           — AppSidebar (icon, branding)
├── nav-user.tsx              — NavUser (role labels, logout route)
├── search-dialog.tsx         — SearchDialog (wired to app navigation)
├── (app)/layout.tsx          — shell layout (auth gate, SidebarProvider)
├── app/layout.tsx            — root layout (metadata, fonts)
├── lib/fonts/registry.ts     — font instantiation (next/font/google)
├── lib/auth/operator.ts      — session validation
├── server/server-actions.ts  — getPreference, cookie helpers
├── domain/                   — all domain types, enums, validators
└── components/ui/            — app-local shadcn primitives
```

---

## What the Platform Does Not Own

The platform never contains:
- Navigation items for any specific application
- Domain vocabulary from any application (children, moments, records, nodes)
- Authentication implementations
- Business rules or workflows
- Application-specific components
- Supabase calls (in `packages/ui` or `packages/shared`)
- Next.js imports (in `packages/ui` or `packages/shared`)

---

## Two Repositories. One Ecosystem.

Platform Core is one of two repositories in the Unami ecosystem.

**Repository 1: `umkhandlu`** (governance node)
- Sovereign, self-contained, independently deployed
- Owns governance workflows, records, notices, evidence, participation
- Exposes read-only intelligence APIs consumed by the Control Centre
- Platform Core never writes to it

**Repository 2: `unami-platform-core`** (this repository)
- Platform foundation + consuming applications
- Consumes governance node APIs — never writes to them
- Full ecosystem diagram: `docs/context/ECOSYSTEM.md`

---

## Platform Roadmap

```
Phase 16  Platform Independence          ✅ Complete
Phase 17  Moments Product Completion     ✅ Engineering Complete
Phase 18  Unami Control Centre           ✅ Complete
Phase 19  UNCIP v2                       ⏳ Active
Phase 20  Multi-node Federation
Phase 21  Commercial Intelligence
Phase 22  National Institutional Memory
```

Current state: `PROJECT_STATUS.md`

---

## Rules That Do Not Change

1. `packages/` is frozen at v1.0 — no new packages, no restructuring, no domain logic
2. Edge Functions are the only layer that touches the database
3. Frontend communicates through `packages/api` typed clients only
4. Domain ownership is absolute — each application owns its domain, nothing leaks into `packages/`
5. The deletion test must always pass
6. No new platform application begins without an explicit phase definition
7. Platform grows from proven application requirements — never from anticipated future needs
