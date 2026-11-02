# Unami Platform Core Architecture

> **Note:** This document reflects the actual implemented architecture as of Phase 19.
> The authoritative technical reference is `docs/context/ARCHITECTURE.md`.
> The authoritative decision log is `docs/context/decisions.md`.

---

## Actual Package Structure

Three packages exist. Three packages only. The packages planned in earlier drafts
(`packages/platform`, `packages/domain`, `packages/db`) were never built and are not planned.
Edge Functions serve the persistence role. Each application owns its domain.

```
packages/
├── ui/       @unami/ui     — design system, shell primitives, structural components
├── shared/   @unami/shared — platform contracts: RBAC, Language, Pagination, validators
└── api/      @unami/api    — typed HTTP clients for Edge Functions + governance node APIs
```

All three packages are frozen at v1.0. No new packages without a concrete cross-application requirement.

---

## Layered Architecture

Dependencies flow downward only.

```
Application Layer    apps/*
        ↓
API Layer            packages/api
        ↓
Shared Layer         packages/shared
```

`packages/ui` is horizontal — pure presentation, consumed by `apps/*`. It does not participate
in the data flow chain.

---

## Dependency Rules

| Package | Can Import | Cannot Import |
|---|---|---|
| `packages/ui` | React, TypeScript, Tailwind, shadcn/ui, `packages/shared` types | Supabase, auth, Next.js, domain concepts, app-specific terminology |
| `packages/shared` | TypeScript, Zod | Everything else — zero runtime dependencies |
| `packages/api` | `packages/shared`, fetch | React, Supabase admin, UI components, domain packages |
| `apps/*` | All packages | Nothing — apps compose, they do not reimplement platform capabilities |

---

## Data Flow

```
apps/admin or apps/umkhandlu or apps/uncip
  → packages/api (typed client)
    → supabase/functions/* (Edge Function, Deno)
      → Supabase DB (service role key, RLS enforced)

apps/web
  → packages/api → supabase/functions/* → Supabase DB
  → @sanity/client → Sanity CDN (read-only)

apps/umkhandlu
  → packages/api (governance-node client)
    → umkhandlu node /api/intelligence/* (read-only Bearer key)
```

No application calls Supabase directly. No exceptions.

---

## Application Inventory

| App | Domain | Supabase Project | Status |
|---|---|---|---|
| `apps/admin` | Moments admin | `dpydmpydyfrrdhuezvgi` | ✅ Complete |
| `apps/web` | Moments public PWA | `dpydmpydyfrrdhuezvgi` | ✅ Engineering complete |
| `apps/umkhandlu` | Unami Control Centre (read-only intelligence) | `ufsmpqxniswdnsywjzje` | ✅ Complete |
| `apps/uncip` | UNCIP v2 child safety platform | `tqragjtvcnsmumtaijds` | ✅ Complete |

One app = one Supabase project. Non-negotiable. See `docs/context/DATABASE_BOUNDARIES.md`.

---

## What `packages/ui` Actually Exports

**Shell primitives** (platform-generic, no app references):
`ThemeBootScript`, `ShellLayoutControls`, `ShellThemeSwitcher`, `ShellNavUser`,
`NavGroup`, `NavMainItem`, `NavMainLinkItem`, `NavMainParentItem`, `NavSubItem`, `NavBadge`,
`PreferencesStoreProvider`, `usePreferencesStore`, `PREFERENCE_DEFAULTS`, `PREFERENCE_REGISTRY`,
`THEME_PRESET_OPTIONS`, `fontOptions`

**Structural components** (used across all dashboard surfaces):
`PageHeader`, `KPIGrid`, `MetricCard`, `TablePagination`, `TableToolbar`, `BulkActionBar`,
`DataTable`, `EmptyState`, `ErrorState`, `PageSkeleton`, `TableSkeleton`, `StatusBadge`,
`AnalyticsCard`, `LineChart`, `BarChart`, `PieChart`, `AreaChart`, `ActivityFeed`, `QuickActions`

**Phase 3 stubs** (do not consume — kept for backwards compatibility only):
`AppShell`, `Sidebar`, `Header`, `MobileNav`, `ContentLayout`

---

## Domain Ownership

Each application owns its domain. Nothing leaks into `packages/`.

| Application | Domain location |
|---|---|
| Moments admin | `apps/admin/src/domain/moments/` |
| Moments public | `apps/web/src/domain/moments.ts` |
| Control Centre | `apps/umkhandlu/src/domain/umkhandlu/` |
| UNCIP | `apps/uncip/src/domain/uncip/` |

The deletion test: deleting any application leaves `packages/` compiling without modification.

---

## Governance Node Architecture

The platform connects to sovereign governance nodes via a read-only Intelligence API.

```
prooftv/Umkhandlu (governance node)
  → exposes GET /api/intelligence/* (Bearer key auth)
    → apps/umkhandlu (Control Centre) reads only
      → never writes, never governs
```

Node registry: `apps/umkhandlu/supabase/migrations/001_governance_nodes.sql`
Snapshot persistence: `apps/umkhandlu/supabase/migrations/003_node_snapshots.sql`
Polling: `apps/umkhandlu/src/app/api/poll-nodes/route.ts` (Vercel cron, every 15 min)
API contract: `docs/context/moments/GOVERNANCE_NODE_API.md`

---

## Platform Roadmap

```
Phase 16  Platform Independence          ✅ Complete
Phase 17  Moments Product Completion     ✅ Engineering Complete (ops gates remaining)
Phase 18  Unami Control Centre           ✅ Complete
Phase 19  UNCIP v2                       ✅ Complete
Phase 20  BeatsChain                     ⏳ Next
Phase 21  Multi-node Federation
Phase 22  Commercial Intelligence
Phase 23  National Institutional Memory
```

---

## Rules That Do Not Change

1. `packages/` is frozen at v1.0 — no new packages, no restructuring, no domain logic
2. Edge Functions are the only layer that touches the database
3. Frontend communicates through `packages/api` typed clients only
4. Domain ownership is absolute — each application owns its domain, nothing leaks into `packages/`
5. The deletion test must always pass
6. One app = one Supabase project
7. `packages/ui` has no Next.js dependency and must not acquire one
8. Platform grows from patterns proven across ≥2 apps — never from anticipated future needs
