# Architecture Context

## Project
Moments v2 is a WhatsApp-first community information platform built on Unami Platform Core.
The platform infrastructure is complete. Active work is product workflow completion.

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

## Layer Boundaries

| Layer | Package | Status | Rule |
|---|---|---|---|
| Presentation | `packages/ui` | ✅ Complete | No Supabase, no auth, no app-specific logic |
| Shared primitives | `packages/shared` | ✅ Complete | No React, no Next.js, no Supabase |
| API contracts | `packages/api` | ✅ Complete | Frontend never calls Supabase directly |
| Edge Functions | `supabase/functions/` | ✅ Complete | Only layer that touches the database |
| Admin app | `apps/admin` | ✅ Shell complete, product workflows in progress | Consumes packages, never reimplements platform |
| Public PWA | `apps/web` | ✅ Complete | Consumes same packages, public read via anon key |

---

## Data Flow

```
apps/admin or apps/web
  → packages/api (typed client)
      createApiClient({ baseUrl, token: jwt })       ← admin: user JWT
      createPublicApiClient({ baseUrl, token: anon }) ← web: anon key
    → supabase/functions/* (Edge Function, Deno)
      → Supabase DB (service role key, RLS enforced)
```

No application code calls Supabase directly. No exceptions.

---

## Edge Functions (Complete)

| Function | Routes | Auth |
|---|---|---|
| `auth` | `GET /auth` | JWT validation → role + authority_id |
| `moments` | `GET/POST/PUT/DELETE /moments`, `POST /moments/:id/schedule`, `GET/POST /moments/public` | requireAuth (admin routes), public (public routes) |
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
| `retry-batches` | `POST /retry-batches` | requireAuth — content_admin+ |

---

## API Client (`packages/api`)

Two factories:
- `createApiClient({ baseUrl, token })` — authenticated, returns all 10 domain clients. Used by `apps/admin`.
- `createPublicApiClient({ baseUrl, token })` — uses anon key, returns `{ moments }` public client only. Used by `apps/web`.

All response types flow from `packages/shared` types — no duplication.

---

## Public PWA (`apps/web`)

**Shell:** `(public)/layout.tsx` — sticky nav header + footer with region/category links. No auth.

**Routes:**
- `/` — moment feed (broadcasted + publish_to_pwa=true), paginated
- `/moments/[id]` — moment detail, WhatsApp share button
- `/region/[region]` — feed filtered by region
- `/category/[category]` — feed filtered by category
- `/search` — keyword search across moments
- `/subscribe` — WhatsApp deep link opt-in flow

**Data access:** `getPublicApiClient()` — anon key, calls `/moments/public` endpoints only.
**No auth, no Supabase client, no `@supabase/ssr`.**

---

## Admin App (`apps/admin`)

**Shell:** `(admin)/layout.tsx` owns the full shell — auth guard, sidebar, header. All 11 routes inherit automatically.

**Routes:**
- `/dashboard` — 7-section command centre, 17 widgets, live data
- `/moments` — list, create, detail + broadcast trigger
- `/broadcasts` — delivery history (broken — see known issues)
- `/subscribers` — POPIA-masked list, KPIs, filters
- `/moderation` — approve/reject queue, advisories panel
- `/authority` — profiles table, audit log
- `/sponsors` — tier list, KPIs
- `/campaigns` — status list, budget utilisation
- `/settings` — feature flags, system settings, session info

**Component policy:**
- shadcn primitives from `src/components/ui/` directly
- `@moments/ui` chart components retained: `AnalyticsCard`, `LineChart`, `BarChart`, `PieChart`, `AreaChart`
- All wrapper components retired: `PageHeader`, `DataTable`, `KPIGrid`, `MetricCard`, `ActivityFeed`, `FormSection`, `ContentLayout`, `StatusBadge`, `QuickActions`

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

**Current Phase:** Phase 16.5 — Admin Completion — Complete

All admin frontend gaps closed. Sponsor selector wired in moment create/edit forms (data integrity fix). Campaign edit form added. Broadcast detail page with retry button. Advisory detail with full signal breakdown. Authority per-profile audit log. Media management page with upload/delete. Media API client added to `packages/api`.

**Session fixes applied (post Phase 16.5):**
- `service_role` granted SELECT/INSERT/UPDATE on all 26 tables via `001_grant_service_role_privileges.sql` — this was silently breaking all Edge Function DB queries
- 4 Edge Functions deployed that were missing: `broadcasts`, `retry-batches`, `media`, `user-profiles`
- `packages/api/src/clients/auth.ts` `me()` path corrected from `/auth/me` to `/auth`
- `apps/admin/src/lib/auth/operator.ts` debug `console.error` removed
- Superadmin `info@unamifoundation.org` confirmed working end-to-end
- D-023 recorded: no n8n — all automation Supabase-native (Edge Functions + pg_cron)
- D-024 recorded: bulk actions via client-side fan-out over existing single-ID endpoints

Next: Phase 16 — Platform Expansion (package rename, second application).

---

## What Is Frozen

- Database schema (add via new numbered migrations only)
- `packages/shared`, `packages/ui`, `packages/api` — no restructuring
- Admin shell — no redesigns
- Edge Function auth pattern — `requireAuth()` is the standard

## What Is Active

- Product workflow completion in `apps/admin`
- Bug fix: broadcasts list endpoint
- Future: `apps/web` public PWA
