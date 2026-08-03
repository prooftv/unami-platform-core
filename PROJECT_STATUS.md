# Project Status

Living engineering snapshot. Updated at every phase transition.
Read this first when resuming work or starting a new session.

---

## Current State

| Field | Value |
|---|---|
| Version | `v0.9.0-platform-standardised` |
| Phase | Phase 16 — Platform Expansion (in progress) |
| Branch | `main` |
| Workspace | `/workspaces/unami-platform-core` |
| Remote | `origin` → `https://github.com/prooftv/unami-platform-core` |
| Last commit | `d6ddbce` |
| Build | ✅ Passing |
| Typecheck | ✅ Passing |

---

## Platform Completion Summary

The infrastructure phase is complete. The platform is no longer the bottleneck.

| Layer | Status | Completeness |
|---|---|---|
| Database (26 tables) | ✅ Complete | 100% |
| Edge Functions (15 functions) | ✅ Complete | 100% |
| `packages/shared` | ✅ Complete | 100% |
| `packages/ui` | ✅ Complete | 100% |
| `packages/api` | ✅ Complete | 100% |
| `apps/admin` shell + dashboard | ✅ Complete | 100% |
| `apps/web` public PWA | ⚠️ Not started | 0% |

---

## Completed Phases (Infrastructure)

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Turborepo monorepo, workspace config, TypeScript baseline | ✅ Done |
| Phase 2 | `packages/shared` — enums, types, validators, constants, helpers | ✅ Done |
| Phase 3 | `packages/ui` — theme engine, shell, navigation, component library | ✅ Done |
| Phase 3.5 | Dependency audit, typecheck fixes, production build verified | ✅ Done |
| Phase 4a | `docs/DATABASE_SCHEMA.md` — full schema specification | ✅ Done |
| Phase 4b | `supabase/migrations/000_initial_schema.sql` — 26 tables | ✅ Done |
| Phase 4c | `docs/SCHEMA_MAPPING.md` — type → table → function → module map | ✅ Done |
| Phase 4d–4f | All 11 Edge Functions deployed, Supabase project linked | ✅ Done |
| Phase 5 | Admin application — auth, 11 modules, all wired to live API | ✅ Done |
| Phase 6A–6E | Dashboard — 7 sections, 17 widgets, live data, all modules operational | ✅ Done |
| Phase 7A–7E | Operational UX — themes, charts, realtime, settings CRUD | ✅ Done |
| Phase 8A–8E | Shell identity, shadcn tokens, sidebar restructure | ✅ Done |
| Phase 9A–9E | Frontend shell reset — shadcn primitives, auth cleanup, dead code removed | ✅ Done |

---

## Product Roadmap (Active)

### Phase 10 — Moments Workflow ✅
| Task | Status |
|---|---|
| Fix `GET /broadcasts` — add list handler to broadcast Edge Function | ✅ |
| Moment edit form (`/moments/[id]/edit`) | ✅ |
| Moment cancel action | ✅ |
| Schedule UI — datetime picker wired to `api.moments.schedule()` | ✅ |
| Broadcast history per moment on detail page | ✅ |
| Moment analytics (views, reach) from `moment_stats` | ✅ |
| Draft list view (filter by status=draft) | ✅ |

---

### Phase 11 — Community Management ✅
| Task | Status |
|---|---|
| Subscriber detail view | ✅ |
| Manual opt-out from admin | ✅ |
| Message thread view (conversation per phone number) | ✅ |
| Advisory detail — full signal breakdown | ✅ |
| Authority profile create/edit/suspend | ✅ |
| Comments moderation (`comments`, `whatsapp_comments` tables) | ✅ |

---

### Phase 12 — Commercial ✅
| Task | Status |
|---|---|
| Sponsor create/edit form | ✅ |
| Campaign create form | ✅ |
| Campaign approval workflow (status transitions) | ✅ |
| Budget transaction history per campaign | ✅ |
| Revenue dashboard widgets | ✅ |

---

### Phase 13 — Platform Hardening ✅
| Task | Status |
|---|---|
| Rate limiting enforcement in Edge Functions | ✅ |
| Broadcast retry logic for failed batches | ✅ |
| `media` upload endpoint and storage management | ✅ |
| `user_profiles` admin management | ✅ |
| Audit log viewer in admin | ✅ |
| Error log viewer in admin | ✅ |

---

### Phase 14 — Public Experience (`apps/web`) ✅
| Task | Status |
|---|---|
| Public PWA scaffold (layout, theme, fonts) | ✅ |
| Public read endpoints in moments Edge Function (`/moments/public`) | ✅ |
| `createPublicApiClient` in `packages/api` | ✅ |
| Moment feed page (broadcasted, publish_to_pwa=true) | ✅ |
| Moment detail page | ✅ |
| Region pages | ✅ |
| Category pages | ✅ |
| Search | ✅ |
| Subscribe flow (WhatsApp deep link) | ✅ |
| PWA manifest | ✅ |
| Service worker (offline support) | ✅ |

---

### Phase 15 — Automation & Production ✅
| Task | Status |
|---|---|
| WhatsApp Cloud API production credentials | ✅ |
| Live webhook end-to-end test | ⏳ (requires production credentials) |
| n8n workflow — intent executor | ⏳ (external) |
| n8n workflow — scheduled broadcast trigger | ⏳ (external) |
| n8n workflow — HELP/STATUS/STOP auto-reply | ⏳ (external) |
| n8n workflow — weekly digest generator | ⏳ (external) |
| Rate limiting enforcement in Edge Functions | ✅ |
| Broadcast retry logic for failed batches | ✅ |
| `media` upload endpoint and storage management | ✅ |
| Service worker (offline support for PWA) | ✅ |
| `user_profiles` admin management | ✅ |

---

### Phase 16.5 — Admin Completion ✅
**Goal:** Every admin module has full CRUD. All frontend gaps closed.

| Task | Status |
|---|---|
| Moment create/edit form — sponsor selector wired to `sponsorId` | ✅ |
| Campaign edit form (`/campaigns/[id]/edit`) | ✅ |
| Broadcast detail page (`/broadcasts/[id]`) with retry button | ✅ |
| Advisory detail page (`/moderation/advisories/[id]`) — full signal breakdown | ✅ |
| Authority per-profile audit log on edit page | ✅ |
| Media management page (`/media`) — upload, list, delete | ✅ |
| Media API client (`packages/api/src/clients/media.ts`) | ✅ |

### Phase 16.6 — Shared UI Standardisation ✅
**Goal:** All admin modules use shared primitives. No inline reimplementation of structural patterns.

| Task | Status |
|---|---|
| `packages/ui` — `StatusBadge` variants corrected (D-014) | ✅ |
| `packages/ui` — `MetricCard` `success` variant fixed, `compact` prop added | ✅ |
| `packages/ui` — `KPIGrid` `items` prop added (data-driven usage) | ✅ |
| `packages/ui` — `TablePagination` `variant` prop added (text/icon) | ✅ |
| `packages/ui` — `DataTable` checkbox selection props added (backwards compatible) | ✅ |
| `packages/ui` — `LoadingStates` replaced with `TableSkeleton`, `KPICardsSkeleton`, `PageSkeleton` | ✅ |
| `packages/ui` — `BulkActionBar` new component | ✅ |
| `apps/admin` — `useBulkSelection` hook | ✅ |
| `apps/admin` — `getToken` shared util (`lib/auth/token.ts`) | ✅ |
| `apps/admin` — `loading.tsx` route skeletons for all 10 modules | ✅ |
| All module clients migrated to `PageHeader`, `KPIGrid`, `TableToolbar`, `TablePagination` | ✅ |
| Bulk actions wired — Moderation, Moments, Campaigns, Media | ✅ |

---

### Phase 16 — Platform Expansion
**Goal:** Second application onboards onto the platform. Package scope renamed.

| Task | Status |
|---|---|
| Rename `@moments/*` → `@unami/*` across all packages and apps | ⏳ |
| Extract Moments domain enums from `packages/shared` into `apps/admin/domain` | ⏳ |
| Spree Operations Dashboard scaffold (`apps/spree`) | ⏳ |
| BeatsChain domain package scaffold (`packages/domain/beatschain`) | ⏳ |
| Umkhandlu governance domain scaffold | ⏳ |

---

## Architecture Freeze

The platform foundation is **feature-frozen**. Do not:
- Add new packages
- Restructure `packages/`
- Add new tables without a concrete product requirement
- Redesign the admin shell
- Create new abstraction layers

Fix bugs only. All new work is product workflow completion.

---

## Known Issues

| Issue | Severity | Phase |
|---|---|---|
| `GET /broadcasts` endpoint missing — broadcasts page renders empty | ~~P0 Bug~~ | ✅ Fixed |
| Broadcast retry logic absent — failed batches are permanent | ~~P1~~ | ✅ Fixed |
| Advisory confidence hardcoded `0.5` — n8n not connected | P2 | Phase 16 (n8n deferred, D-023) |
| `rate_limits` table exists but no enforcement | ~~P2~~ | ✅ Fixed |
| `moment_stats` populated but never surfaced in UI | ~~P3~~ | ✅ Fixed |
| `sponsorId` hardcoded null in moment create/edit forms | ~~P1 Data bug~~ | ✅ Fixed |
| WhatsApp secrets unset in Supabase | P0 Ops | Operational — requires manual config |
| HELP/STATUS/MYAUTHORITY webhook reply handlers not built | P1 | Phase 16 |
| Advisory AI confidence scoring Edge Function not built | P2 | Phase 16 |

---

## Known Technical Debt

| Item | Location | Resolution |
|---|---|---|
| Moments-domain logic in shared package | `packages/shared/src/` | Refactor to `apps/moments/domain` when second app onboards |
| Package scope `@moments/*` | All packages | Rename to `@unami/*` before Phase 16 |

---

## Repository Layout

```
unami-platform-core/
├── apps/
│   ├── admin/          Next.js 16 — Moments admin (complete — all modules, full CRUD)
│   └── web/            Next.js 16 — Moments public PWA (complete)
├── packages/
│   ├── ui/             @moments/ui — design system, charts, theme engine (complete)
│   ├── shared/         @moments/shared — enums, types, validators, constants (complete)
│   └── api/            @moments/api — typed API clients (complete)
├── supabase/
│   ├── functions/      15 Edge Functions (complete)
│   └── migrations/
│       └── 000_initial_schema.sql   ← baseline, do not modify
├── docs/
│   ├── DATABASE_SCHEMA.md           ← schema source of truth
│   ├── SCHEMA_MAPPING.md            ← type → table → function → module
│   └── context/                     ← architecture, security, decisions
```

---

## Rules — Do Not Violate

1. All work in `/workspaces/unami-platform-core`, pushed to `origin`.
2. `/workspaces/moments-v2` is reference only — never edit it.
3. `supabase/migrations/000_initial_schema.sql` is immutable — never modify it.
4. `docs/DATABASE_SCHEMA.md` is the schema source of truth — change here first, then write a migration.
5. `packages/ui` — no Supabase, no auth, no application-specific logic.
6. `packages/shared` — no React, no Next.js, no Supabase.
7. Edge Functions are the only layer that touches the database.
8. Frontend communicates through `packages/api` typed clients only.
9. Platform foundation is feature-frozen — no new abstractions, no shell redesigns.
10. Each phase must answer: "Which user workflow becomes fully usable?"
