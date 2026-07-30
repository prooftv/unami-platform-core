# Project Status

Living engineering snapshot. Updated at every phase transition.
Read this first when resuming work or starting a new session.

---

## Current State

| Field | Value |
|---|---|
| Version | `v0.2.0-backend-live` |
| Phase | Phase 5 — Admin Application |
| Branch | `main` |
| Workspace | `/workspaces/unami-platform-core` |
| Remote | `origin` → `https://github.com/prooftv/unami-platform-core` |
| Build | ✅ Passing |
| Typecheck | ✅ Passing |

---

## Completed Milestones

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Turborepo monorepo, workspace config, TypeScript baseline | ✅ Done |
| Phase 2 | `packages/shared` — enums, types, validators, constants, helpers | ✅ Done |
| Phase 3 | `packages/ui` — theme engine, shell, navigation, component library | ✅ Done |
| Phase 3.5 | Dependency audit, typecheck fixes, production build verified | ✅ Done |
| Phase 4a | `docs/DATABASE_SCHEMA.md` — full schema specification | ✅ Done |
| Phase 4b | `supabase/migrations/000_initial_schema.sql` — initial migration | ✅ Done |
| Phase 4c | `docs/SCHEMA_MAPPING.md` — type → table → function → module map | ✅ Done |
| Phase 4d | Edge Functions — `moments`, `broadcast`, `webhook` | ✅ Done |
| Phase 4e | `packages/api` — typed API clients (`moments`, `broadcasts`, `auth`) | ✅ Done (commit d5bfaac) |
| Phase 4f | Supabase project linked, schema applied, Edge Functions deployed | ✅ Done |

---

## Current Phase — Phase 5: Admin Application

**Auth complete. Backend live. Next: Moments modules.**

### Completed
- ✅ Supabase Auth SSR (`@supabase/ssr`) in `apps/admin`
- ✅ Login page, auth callback, session middleware
- ✅ Protected route group `(admin)` — redirects unauthenticated users
- ✅ Operator session layer with role-aware context
- ✅ Admin shell with navigation (Dashboard / Moments / Broadcasts / Analytics / Settings)
- ✅ Deployed to Vercel: `https://moments-admin-delta.vercel.app`
- ✅ Supabase project linked (`dpydmpydyfrrdhuezvgi`)
- ✅ Schema applied (`000_initial_schema.sql` — 26 tables)
- ✅ Edge Functions deployed: `auth`, `moments`, `broadcast`, `webhook`
- ✅ Edge Function secrets set (`ADMIN_URL`, `WEB_URL`)

### Phase 5 Complete ✅
All 8 admin modules built and deployed:
- `/dashboard` — KPIs, quick actions, activity feed
- `/moments` — list with search/filter, `/moments/new` create form, `/moments/[id]` detail + broadcast
- `/broadcasts` — delivery history table
- `/subscribers` — structure ready, awaiting API client
- `/moderation` — structure ready, awaiting API client
- `/authority` — structure ready, awaiting API client
- `/sponsors` — structure ready, awaiting API client
- `/campaigns` — structure ready, awaiting API client
- `/settings` — system settings, feature flags, admin users (superadmin only)

### Phase 6 — In Progress

**6A — Dashboard Architecture** ✅
`docs/ADMIN_DASHBOARD_ARCHITECTURE.md` — complete blueprint defining:
- Dashboard philosophy (operational command centre, not CRUD)
- 7-section information architecture (Overview, Operations, Publishing, Audience, Governance, Commercial, Platform)
- 17 dashboard widgets fully specified
- Desktop / tablet / mobile layouts
- Preset-aware design rules (Brutalist, Soft Pop, Tangerine)
- Module → Dashboard data relationships
- Implementation roadmap: 6B (composition) → 6C (data providers) → 6D (live API) → 6E (module refinement)

**6B — Dashboard Composition** ✅
Operational command centre composed. 7 sections, 17 widgets, responsive grid, section tabs, all placeholder states. Commit `83452ce`.

**6C — Widget Data Providers** ✅
6 new typed API clients (subscribers, moderation, authority, sponsors, campaigns, analytics). Server-side providers fetch all dashboard data in parallel. All widgets accept real typed props — zero hardcoded data. Commit `611bea3`.

**6D — Live API Integration** ✅
6 Edge Functions deployed to `dpydmpydyfrrdhuezvgi`: `subscribers`, `moderation`, `authority`, `sponsors`, `campaigns`, `analytics`. All dashboard widgets now wired to live Supabase data. Commit `26d7ff7`.
Wire all widgets to live Supabase data, Realtime for P0 widgets.

**6E — Module Refinement** (next)
Elevate all 8 modules from structure to full operational workspaces.

---

## Repository Layout

```
unami-platform-core/
├── apps/
│   ├── admin/          Next.js 16 — Moments admin dashboard (UI showcase currently)
│   └── web/            Next.js 16 — Moments public PWA (not yet built)
├── packages/
│   ├── ui/             @moments/ui — reusable component library (complete)
│   ├── shared/         @moments/shared — enums, types, validators, constants (complete)
│   └── api/            @moments/api — typed API clients (complete)
├── supabase/
│   ├── functions/      Edge Functions (complete — moments, broadcast, webhook)
│   └── migrations/
│       └── 000_initial_schema.sql   ← baseline, do not modify
├── docs/
│   ├── DATABASE_SCHEMA.md           ← source of truth for schema
│   ├── SCHEMA_MAPPING.md            ← type → table → function → module
│   └── reference/                   ← historical only, never import from here
```

---

## Package Naming Note

Current package scope is `@moments/*`. Before v1.0, rename to `@unami/*`.
Deferred — do not interrupt active development for this.

---

## Deferred Work

| Item | Reason deferred |
|---|---|
| Rename `@moments/*` → `@unami/*` | Not blocking. Do before second application onboards. |
| Moments public PWA (`apps/web`) | After admin is working end-to-end |
| n8n workflows | After Edge Functions are stable in production |
| WhatsApp integration (live) | After webhook Edge Function is deployed |
| Spree Operations Dashboard | After Moments is working end-to-end |

---

## Known Technical Debt

| Item | Location | Notes |
|---|---|---|
| Moments-domain logic in shared package | `packages/shared/src/` | Refactor to `apps/moments/domain` when second app onboards. |
| UI showcase in admin app | `apps/admin/src/app/ui/` | Replace with real Moments admin modules after auth is complete. |
| Root redirect goes to `/ui` | `apps/admin/src/app/page.tsx` | Replace with auth-aware redirect after login is implemented. |

---

## Definition of Done — Phase 5 (Admin Application)

- [x] Authentication working in `apps/admin` (login, session, middleware)
- [x] Protected routes — unauthenticated users redirected to `/login`
- [x] Role-aware session context (superadmin / content_admin / moderator / viewer)
- [x] Real admin shell replacing UI showcase root
- [x] Admin user created and can log in end-to-end
- [x] Moments list module (`/moments`)
- [x] Moments create module (`/moments/new`)
- [x] Moment detail + broadcast trigger (`/moments/[id]`)
- [x] Broadcasts history (`/broadcasts`)
- [x] Subscribers module (`/subscribers`)
- [x] Moderation module (`/moderation`)
- [x] Authority profiles (`/authority`)
- [x] Sponsors (`/sponsors`)
- [x] Campaigns (`/campaigns`)
- [x] Settings — system config, feature flags, admin users (`/settings`)

---

## Rules — Do Not Violate

1. All work happens in `/workspaces/unami-platform-core`, pushed to `origin`.
2. `/workspaces/moments-v2` is reference only. Never edit it.
3. `supabase/migrations/000_initial_schema.sql` is the baseline. Never modify it.
4. `docs/DATABASE_SCHEMA.md` is the schema source of truth. Change the doc first, then write a migration.
5. `packages/ui` has no Supabase imports, no auth, no application-specific logic.
6. `packages/shared` has no React, no Next.js, no Supabase.
7. Edge Functions are the only code that touches the database directly.
8. Frontend communicates through `packages/api` typed clients only.
