# Architecture

Technical structure of Unami Platform Core. Current state as of Phase 19.

---

## Stack

| Concern | Technology |
|---|---|
| Application framework | Next.js, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Component primitives | shadcn/ui (Radix UI) |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT RS256) + `@supabase/ssr` |
| CMS | Sanity (`apps/web` only) |
| Messaging | Meta WhatsApp Cloud API (Moments only) |
| Validation | Zod (shared frontend + Edge Functions) |
| State | Zustand (vanilla store, SSR-safe) |
| Monorepo | Turborepo + pnpm workspaces |

---

## Repository Structure

```
unami-platform-core/
├── apps/
│   ├── admin/          Next.js — Moments admin dashboard
│   ├── web/            Next.js — Moments public PWA
│   ├── umkhandlu/      Next.js — Unami Control Centre (read-only intelligence)
│   └── uncip/          Next.js — UNCIP v2 (child safety platform)
├── packages/
│   ├── ui/             @unami/ui — design system, shell primitives, structural components
│   ├── shared/         @unami/shared — platform contracts, enums, validators
│   └── api/            @unami/api — typed HTTP clients
├── supabase/
│   ├── functions/      Edge Functions (Deno) — only layer that touches the database
│   └── migrations/     000 (immutable baseline) through current numbered migration
└── docs/
    ├── context/        Constitutional documents
    ├── abstractions/   Umkhandlu governance abstraction pack (13 documents)
    └── reference/      Historical and archived material
```

---

## Layer Boundaries

| Layer | Package | Rule |
|---|---|---|
| Design system + shell | `packages/ui` | No Supabase, no auth, no Next.js, no domain knowledge |
| Platform contracts | `packages/shared` | No React, no Next.js, no Supabase, no domain logic |
| API clients | `packages/api` | Typed HTTP only — domain types inlined as string literals |
| Edge Functions | `supabase/functions/` | Only layer that touches the database |
| Moments admin | `apps/admin` | Owns Moments domain, shell, all admin modules |
| Moments public PWA | `apps/web` | No auth, no Supabase client, Sanity + API |
| Control Centre | `apps/umkhandlu` | Read-only, no write operations, no CRUD screens |
| UNCIP | `apps/uncip` | Owns UNCIP domain, mock auth during UI phase |

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

## `packages/ui` — What It Exports

Three categories:

**Shell primitives** (platform-generic, no app references):
`ThemeBootScript`, `ShellLayoutControls`, `ShellThemeSwitcher`, `ShellNavUser`,
`ShellSearchItem` (type), `NavGroup`, `NavMainItem`, `NavMainLinkItem`, `NavMainParentItem`,
`NavSubItem`, `NavBadge`, `PreferencesStoreProvider`, `usePreferencesStore`,
`PREFERENCE_DEFAULTS`, `PREFERENCE_REGISTRY`, `THEME_PRESET_OPTIONS`, `fontOptions`

**Structural components** (used across all dashboard surfaces):
`PageHeader`, `KPIGrid`, `MetricCard`, `TablePagination`, `TableToolbar`, `BulkActionBar`,
`DataTable`, `EmptyState`, `ErrorState`, `PageSkeleton`, `TableSkeleton`, `StatusBadge`,
`AnalyticsCard`, `LineChart`, `BarChart`, `PieChart`, `AreaChart`, `ActivityFeed`, `QuickActions`

**Phase 3 stubs** (do not consume — kept for backwards compatibility only):
`AppShell`, `Sidebar`, `Header`, `MobileNav`, `ContentLayout`

---

## `packages/shared` — What It Contains

Platform-generic primitives only:
`Language`, `ModerationStatus`, `MessageType`, `AdminRole`, `Pagination`, `PaginatedResponse`,
`AdminUser`, `SystemSetting`, `Message`, auth validators, settings validators,
phone/formatting/failOpen helpers.

No Moments domain. No UNCIP domain. No application-specific logic.

---

## `packages/api` — What It Contains

Two client factories:
- `createApiClient({ baseUrl, token })` — authenticated, all domain clients. Used by `apps/admin`.
- `createPublicApiClient({ baseUrl, token })` — anon key, public moments client. Used by `apps/web`.

Domain types (Region, Category, MomentStatus, etc.) are inlined as string literal unions.
No import from any application domain. The API package has no domain dependency.

---

## Edge Functions (18 — Complete)

All Moments Edge Functions are complete and frozen. UNCIP Edge Functions are Phase 19 Step 7+.

| Function | Purpose |
|---|---|
| `auth` | JWT validation → role + authority_id |
| `moments` | Moments CRUD + public read routes |
| `broadcast` | Broadcast pipeline |
| `retry-batches` | Failed broadcast retry |
| `broadcasts` | Broadcast history |
| `webhook` | WhatsApp webhook (HMAC-SHA256) |
| `moderation` | Message moderation queue |
| `authority` | Authority profiles |
| `subscribers` | Subscriber management |
| `sponsors` | Sponsor management |
| `campaigns` | Campaign + project tracking |
| `analytics` | Dashboard analytics |
| `settings` | System settings + feature flags |
| `media` | Media upload + management |
| `user-profiles` | User profile management |
| `participation` | Public participation engine |
| `evidence` | Evidence capture |
| `records` | Community records |
| `notices` | Platform notices |

---

## Database (Migrations 000–008)

`000_initial_schema.sql` — immutable baseline. Never modify.
All changes go in new numbered migration files.

Current tables: 26 Moments tables + platform tables added in 006–008.
Schema reference: `docs/DATABASE_SCHEMA.md`

---

## Dashboard Shell Pattern

Every Unami dashboard application follows the same shell pattern.
The pattern is documented in `docs/context/PLATFORM_DASHBOARD_SHELL.md`.

Key rule: files that import from `next/*` stay in each application.
`packages/ui` has no Next.js dependency and must not acquire one.

---

## Domain Ownership

Each application owns its domain. Nothing leaks into `packages/`.

| Application | Domain location |
|---|---|
| Moments admin | `apps/admin/src/domain/moments/` |
| Moments public | `apps/web/src/domain/moments.ts` |
| Control Centre | `apps/umkhandlu/src/domain/umkhandlu/` |
| UNCIP | `apps/uncip/src/domain/uncip/` |

The test: deleting any application leaves `packages/` compiling without modification.

---

## What Is Frozen

- `packages/shared`, `packages/ui`, `packages/api` — no restructuring, no new domain logic
- `supabase/migrations/000_initial_schema.sql` — immutable, never modify
- Moments Edge Functions — complete, no new routes without a concrete requirement
- Admin shell — no redesigns, no extraction into packages
- `packages/ui/src/shell/AppShell`, `Sidebar`, `Header`, `MobileNav` — Phase 3 stubs, do not consume
