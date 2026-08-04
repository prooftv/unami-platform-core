# Architecture Context

## Project
Unami Platform Core v1.0 — a multi-application platform. The platform is complete and frozen.
Active work is **Moments product completion** (Phase 17) — not platform engineering.
Phase 18 is the Unami Control Centre — the first validation of multi-application federation.

## Repository
https://github.com/prooftv/unami-platform-core

## Stack
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Backend: Supabase Edge Functions (Deno)
- Database: PostgreSQL via Supabase (26 tables, fully migrated)
- Auth: Supabase Auth (JWT, RS256) + `@supabase/ssr` for Next.js
- CMS: Sanity (Phase 17C — `apps/web` only, after content ownership frozen in 17B)
- Messaging: Meta WhatsApp Cloud API (Phase 17I — last)
- Validation: Zod (shared between frontend and Edge Functions)
- State: Zustand (vanilla store, SSR-safe)
- Monorepo: Turborepo + pnpm workspaces

---

## Platform vs Application — The Core Distinction

The platform owns infrastructure. Applications own experience.

**Platform layer** (`packages/`) — shared by every application, contains no business domain:
- `@unami/ui` — design system primitives: Button, Card, Input, Table, Badge, Dialog, Charts, Theme Engine, Preferences, Loading/Empty/Error states
- `@unami/shared` — platform contracts: RBAC, Language, Pagination, Utilities, Formatting, Auth validators
- `@unami/api` — typed HTTP clients for Edge Functions

**Application layer** (`apps/`) — each application owns its shell, navigation, domain, and workflows:
- `apps/admin` — Moments admin. Owns its sidebar, header, dashboard widgets, and `domain/moments/`
- `apps/web` — Moments public PWA. Owns its layout, public routing, and `domain/moments.ts`

**The test:** If Moments were deleted entirely, `packages/shared`, `packages/ui`, and `packages/api`
must compile without modification. As of v1.0, this is true.

---

## Layer Boundaries

| Layer | Package | Status | Rule |
|---|---|---|---|
| Design system + primitives | `packages/ui` | ✅ Frozen | No Supabase, no auth, no domain knowledge |
| Platform contracts | `packages/shared` | ✅ Frozen | No React, no Next.js, no Supabase, no domain |
| API clients | `packages/api` | ✅ Frozen | Typed HTTP only — domain types inlined as string literals |
| Edge Functions | `supabase/functions/` | ✅ Frozen | Only layer that touches the database |
| Moments admin | `apps/admin` | ✅ Complete | Owns Moments domain, shell, all modules |
| Moments public PWA | `apps/web` | 🔨 Active | Phase 17A complete — 17B next |

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

`apps/web` also queries Sanity directly (Phase 17C+):
```
apps/web
  → @sanity/client (GROQ queries)
    → Sanity CDN (read-only, public dataset)
```

No application code calls Supabase directly. No exceptions.
Sanity is read-only from `apps/web`. All Sanity writes happen in Sanity Studio.

---

## Two-Source Model (apps/web)

```
              SANITY CMS                        SUPABASE
                  │                                │
    Editorial Content (Phase 17C+)       Operational Content
    ─────────────────────────────        ───────────────────
    Homepage · Stories · Sponsors        Moments · Feed · Detail
    Help · About · Privacy               Region · Category · Search
    Authority editorial profiles         Participation · Evidence
                  │                      Broadcasts · Analytics
                  └──────────────┬───────────────────┘
                                 │
                          apps/web (PWA)
                    Same layout. Same design system.
```

The boundary between these two sources is defined in `docs/context/CONTENT_OWNERSHIP.md`.
That document is the Phase 17B deliverable. It is frozen before any CMS code is written.

---

## Content Ownership Boundary

See `docs/context/CONTENT_OWNERSHIP.md` for the full classification.

Summary:
- **Sanity** — editorial, curated, presentation: homepage, stories, sponsor pages, static pages, SEO
- **Supabase** — operational, records, evidence: moments, participation, evidence, analytics, intelligence
- **Edge Functions** — orchestration: all database access, business rules, webhook routing
- **apps/web** — composition: editorial + operational content in one Next.js application

---

## Edge Functions (15 — Complete, Frozen)

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
**Domain:** `apps/admin/src/domain/moments/` — all Moments-specific enums, constants, types, validators, helpers.
**Routes:** `/dashboard`, `/moments`, `/broadcasts`, `/subscribers`, `/moderation`, `/authority`, `/sponsors`, `/campaigns`, `/media`, `/settings`

**Component policy:**
- `@unami/ui` shared primitives for structural patterns: `PageHeader`, `KPIGrid`, `MetricCard`,
  `TableToolbar`, `TablePagination`, `BulkActionBar`, `DataTable`, `EmptyState`, `ErrorState`,
  `PageSkeleton`, `TableSkeleton`, `StatusBadge`, `AnalyticsCard`, `LineChart`, `BarChart`,
  `PieChart`, `AreaChart`, `ActivityFeed`, `QuickActions`
- shadcn primitives from `src/components/ui/` for low-level elements
- Do NOT use from `@unami/ui` in admin: `AppShell`, `Sidebar`, `Header`, `MobileNav` — Phase 3 stubs

---

## Moments Public PWA (`apps/web`)

**Shell:** `(public)/layout.tsx` — sticky nav, mobile drawer, theme toggle, structured footer.
**Domain:** `apps/web/src/domain/moments.ts` — Region/Category const objects for routing only.

**Routes (Phase 17A complete):**
`/` (homepage), `/feed`, `/moments/[id]`, `/region/[region]`, `/category/[category]`,
`/search`, `/subscribe`, `/about`, `/help`, `/privacy`, `/terms`,
`/sponsors`, `/campaigns`, `/authority`, `/offline`, `/_not-found`

**Data access:**
- `getPublicApiClient()` — anon key, calls `/moments/public` endpoints
- `@sanity/client` — GROQ queries to Sanity CDN (Phase 17C+, after 17B content ownership frozen)
- No auth, no Supabase client, no `@supabase/ssr`

---

## Database (26 Tables — Complete, Frozen)

Core content: `moments`, `sponsors`, `campaigns`
Publishing pipeline: `moment_intents`, `broadcasts`, `broadcast_batches`
Community: `subscriptions`, `messages`, `advisories`, `moderation_audit`, `comments`, `whatsapp_comments`
Authority: `authority_profiles`, `authority_audit_log`
Admin: `admin_roles`, `user_profiles`
Assets: `media`, `moment_stats`
Analytics: `analytics_events`, `marketing_compliance`, `budget_transactions`
System: `system_settings`, `feature_flags`, `rate_limits`, `audit_logs`, `error_logs`

Future tables (Phase 17D+) are classified in `docs/abstractions/umkhandlu/10_DATABASE_IMPACT.md`.
No table is added until a concrete product requirement in an active phase demands it.

---

## Umkhandlu Abstraction Pack

The governance domain has been distilled into 13 constitutional documents in `docs/abstractions/umkhandlu/`.
These documents are the architectural reference for all governance, records, participation, evidence,
and intelligence work from Phase 17D onward.

The critical bridge: `09_PLATFORM_MAPPING.md` — classifies every concept as platform-generic or domain-specific.
The implementation sequence: `12_IMPLEMENTATION_ROADMAP.md`.

---

## Current Phase

**Phase 17B — Content Ownership Constitution**

Phase 17A (public PWA foundation) is complete.
Phase 17B deliverable: `docs/context/CONTENT_OWNERSHIP.md` — the frozen boundary between Sanity and Supabase.
No CMS code is written until this document is complete and committed.

Full roadmap: 17A ✅ → 17B → 17C → 17D → 17E → 17F → 17G → 17H → 17I → 17J → 18

---

## What Is Frozen

- Database schema (add via new numbered migrations only)
- `packages/shared`, `packages/ui`, `packages/api` — no restructuring, no new domain logic
- Admin shell — no redesigns, no extraction into packages
- Edge Function auth pattern — `requireAuth()` is the standard
- `packages/ui/src/shell/` — Phase 3 stubs, do not consume, do not extend

## What Is Active

- Phase 17B: `CONTENT_OWNERSHIP.md` — freeze the Sanity/Supabase boundary
- Phase 17C (next): Sanity project, schemas, Studio, `@sanity/client` in `apps/web`
