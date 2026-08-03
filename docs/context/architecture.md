# Architecture Context

## Project
Unami Platform Core v1.0 — a multi-application platform. Moments is the first product built on it.
The platform layer is complete and application-agnostic. Active work is Moments product completion.

## Repository
https://github.com/prooftv/unami-platform-core

## Stack
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Backend: Supabase Edge Functions (Deno)
- Database: PostgreSQL via Supabase (26 tables, fully migrated)
- Auth: Supabase Auth (JWT, RS256) + `@supabase/ssr` for Next.js
- Messaging: Meta WhatsApp Cloud API
- Validation: Zod (shared between frontend and Edge Functions)
- State: Zustand (vanilla store, SSR-safe)
- Monorepo: Turborepo + pnpm workspaces
- Admin shell: shadcn/ui dashboard (arhamkhnz/next-shadcn-admin-dashboard)

---

## Platform vs Application — The Core Distinction

The platform owns infrastructure. Applications own experience.

**Platform layer** (`packages/`) — shared by every application, contains no business domain:
- `@unami/ui` — design system primitives: Button, Card, Input, Table, Badge, Dialog, Charts, Theme Engine, Preferences, Loading/Empty/Error states
- `@unami/shared` — platform contracts: RBAC, Language, Pagination, Utilities, Formatting, Auth validators
- `@unami/api` — typed HTTP clients for Edge Functions

**Application layer** (`apps/`) — each application owns its shell, navigation, dashboard, domain, and workflows:
- `apps/admin` — Moments admin. Owns its sidebar, header, dashboard widgets, and `domain/moments/`
- `apps/web` — Moments public PWA. Owns its layout, public routing, and `domain/moments.ts`

**The test:** If Moments were deleted entirely, `packages/shared`, `packages/ui`, and `packages/api` must compile without modification. As of v1.0, this is true.

**What does NOT belong in `packages/ui`:**
- Sidebar navigation
- Dashboard widgets
- Application-specific layouts
- Any component that references a product domain

Each application builds its own shell. The platform provides the primitives to build with.

---

## Layer Boundaries

| Layer | Package | Status | Rule |
|---|---|---|---|
| Design system + primitives | `packages/ui` | ✅ Complete | No Supabase, no auth, no domain knowledge |
| Platform contracts | `packages/shared` | ✅ Complete | No React, no Next.js, no Supabase, no domain |
| API clients | `packages/api` | ✅ Complete | Typed HTTP only — domain types inlined as string literals |
| Edge Functions | `supabase/functions/` | ✅ Complete | Only layer that touches the database |
| Moments admin | `apps/admin` | ✅ Complete | Owns Moments domain, shell, all modules |
| Moments public PWA | `apps/web` | ✅ Complete | Owns public routing, no auth, no Supabase client |

---

## Domain Ownership (D-027)

`packages/shared` contains only platform-generic primitives:
`Language`, `ModerationStatus`, `MessageType`, `AdminRole`, `Pagination`, `PaginatedResponse`,
`AdminUser`, `SystemSetting`, `Message`, auth validators, settings validators, phone/formatting helpers.

Moments domain lives in the Moments applications:
- `apps/admin/src/domain/moments/` — enums, constants, types, validators, helpers
- `apps/web/src/domain/moments.ts` — Region/Category const objects for public routing only

`packages/api` inlines Moments domain types as string literal unions. No domain dependency.

Future applications follow the same pattern: each owns its domain, nothing leaks into `packages/`.

---

## Data Flow

```
apps/admin or apps/web
  → packages/api (typed client)
      createApiClient({ baseUrl, token: jwt })        ← admin: user JWT
      createPublicApiClient({ baseUrl, token: anon }) ← web: anon key
    → supabase/functions/* (Edge Function, Deno)
      → Supabase DB (service role key, RLS enforced)
```

No application code calls Supabase directly. No exceptions.

---

## Edge Functions (15 — Complete)

| Function | Routes | Auth |
|---|---|---|
| `auth` | `GET /auth` | JWT validation → role + authority_id |
| `moments` | `GET/POST/PUT/DELETE /moments`, `POST /moments/:id/schedule`, `GET/POST /moments/public` | requireAuth (admin), public (public routes) |
| `broadcast` | `POST /broadcast/:momentId` | requireAuth — content_admin+ |
| `retry-batches` | `POST /retry-batches` | requireAuth — content_admin+ |
| `broadcasts` | `GET /broadcasts`, `GET /broadcasts/:id` | requireAuth |
| `webhook` | `GET/POST /webhook` | HMAC-SHA256 verification |
| `moderation` | `GET /moderation/messages`, `/advisories`, `/stats`, `POST approve/reject` | requireAuth |
| `authority` | `GET /authority`, `/stats`, `/audit` | requireAuth |
| `subscribers` | `GET /subscribers`, `/stats` | requireAuth |
| `sponsors` | `GET /sponsors`, `/stats` | requireAuth |
| `campaigns` | `GET /campaigns`, `/budget` | requireAuth |
| `analytics` | `GET /analytics/dashboard`, `/daily`, `/regional`, `/categories`, `/revenue`, `/intents` | requireAuth |
| `settings` | `GET/POST /settings/flags`, `/system` | requireAuth — superadmin for writes |
| `media` | `POST /media`, `GET /media`, `DELETE /media/:id` | requireAuth |
| `user-profiles` | `GET /user-profiles`, `GET /user-profiles/:id` | requireAuth |

---

## API Client (`packages/api`)

Two factories:
- `createApiClient({ baseUrl, token })` — authenticated, returns all domain clients. Used by `apps/admin`.
- `createPublicApiClient({ baseUrl, token })` — anon key, returns `{ moments }` public client only. Used by `apps/web`.

Domain types (Region, Category, MomentStatus, etc.) are inlined as string literal unions in `packages/api/src/types/index.ts`.
No import from `apps/admin/domain`. The API package has no domain dependency.

---

## Moments Admin (`apps/admin`)

**Shell:** `(admin)/layout.tsx` owns the full shell — auth guard, sidebar, header. All routes inherit automatically.
The admin shell belongs to Moments. It is not extracted into `packages/ui`.

**Domain:** `apps/admin/src/domain/moments/` — all Moments-specific enums, constants, types, validators, helpers.

**Routes:** `/dashboard`, `/moments`, `/broadcasts`, `/subscribers`, `/moderation`, `/authority`, `/sponsors`, `/campaigns`, `/media`, `/settings`

**Component policy:**
- `@unami/ui` shared primitives for structural patterns: `PageHeader`, `KPIGrid`, `MetricCard`,
  `TableToolbar`, `TablePagination`, `BulkActionBar`, `DataTable`, `EmptyState`, `ErrorState`,
  `PageSkeleton`, `TableSkeleton`, `StatusBadge`, `AnalyticsCard`, `LineChart`, `BarChart`,
  `PieChart`, `AreaChart`, `ActivityFeed`, `QuickActions`
- shadcn primitives from `src/components/ui/` for low-level elements: `Input`, `Select`, `Label`,
  `Textarea`, `Dialog`, `Button`, `Badge`, `Card`, etc.
- Do NOT use from `@unami/ui` in admin: `AppShell`, `Sidebar`, `Header`, `MobileNav` — those are Phase 3 stubs

**Page layout standard (D-026):**

| Page type | Max width | Header | Structure |
|---|---|---|---|
| List | unconstrained | `PageHeader` (title, description, create button) | KPIGrid → TableToolbar → Table → TablePagination → BulkActionBar |
| Form (create/edit) | `max-w-2xl` | `PageHeader` (title, description, back in actions) | Cards per field group → submit row |
| Detail (view) | `max-w-3xl` | `PageHeader` (title, description, action buttons) | 2-col card grid → content card → history/table cards |

- `PageHeader` on every page — no inline `<h1>` or `<ArrowLeft>` beside headings
- Each form section in its own `Card` — no bare `<div>` with `<p className="text-sm font-medium">` labels
- `getToken` always from `@/lib/auth/token` — never copy-pasted
- Error: `text-destructive` — Success: `text-muted-foreground` — never raw colour classes

---

## Moments Public PWA (`apps/web`)

**Shell:** `(public)/layout.tsx` — sticky nav header + footer with region/category links. No auth.
**Domain:** `apps/web/src/domain/moments.ts` — Region/Category const objects for routing only.

**Routes:** `/` (feed), `/moments/[id]`, `/region/[region]`, `/category/[category]`, `/search`, `/subscribe`

**Data access:** `getPublicApiClient()` — anon key, calls `/moments/public` endpoints only.
No auth, no Supabase client, no `@supabase/ssr`.

---

## Database (26 Tables — Complete)

Core content: `moments`, `sponsors`, `campaigns`
Publishing pipeline: `moment_intents`, `broadcasts`, `broadcast_batches`
Community: `subscriptions`, `messages`, `advisories`, `moderation_audit`, `comments`, `whatsapp_comments`
Authority: `authority_profiles`, `authority_audit_log`
Admin: `admin_roles`, `user_profiles`
Assets: `media`, `moment_stats`
Analytics: `analytics_events`, `marketing_compliance`, `budget_transactions`
System: `system_settings`, `feature_flags`, `rate_limits`, `audit_logs`, `error_logs`

---

## Current Phase

**Phase 17A — Public PWA Completion**

Platform is v1.0 and frozen. `apps/web` is being built into the full Moments community
experience. Data source is Supabase via existing public API. Sanity CMS is Phase 17B.

Roadmap:
- 17A: Complete `apps/web` as the Moments public product (Supabase-driven)
- 17B: Sanity project setup, schema, Studio deployed
- 17C: Connect `apps/web` editorial pages to Sanity
- 17D: WhatsApp production credentials + reply handlers
- 18: Launch

---

## What Is Frozen

- Database schema (add via new numbered migrations only)
- `packages/shared`, `packages/ui`, `packages/api` — no restructuring, no new domain logic
- Admin shell — no redesigns, no extraction into packages
- Edge Function auth pattern — `requireAuth()` is the standard
- `packages/ui/src/shell/` — Phase 3 stubs, do not consume, do not extend

## What Is Active

- Phase 17A: `apps/web` — homepage, feed, detail, subscribe, static pages, PWA polish
- Phase 17B (next): Sanity project + schema + Studio
