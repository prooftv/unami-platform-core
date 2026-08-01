# Project Status

Living engineering snapshot. Updated at every phase transition.
Read this first when resuming work or starting a new session.

---

## Current State

| Field | Value |
|---|---|
| Version | `v0.5.0-platform-complete` |
| Phase | Phase 10 — Moments CMS (Next) |
| Branch | `main` |
| Workspace | `/workspaces/unami-platform-core` |
| Remote | `origin` → `https://github.com/prooftv/unami-platform-core` |
| Last commit | `c36a0e9` |
| Build | ✅ Passing |
| Typecheck | ✅ Passing |

---

## Platform Completion Summary

The infrastructure phase is complete. The platform is no longer the bottleneck.

| Layer | Status | Completeness |
|---|---|---|
| Database (26 tables) | ✅ Complete | 100% |
| Edge Functions (11 functions) | ✅ Complete | 95% |
| `packages/shared` | ✅ Complete | 100% |
| `packages/ui` | ✅ Complete | 100% |
| `packages/api` | ✅ Complete | 98% |
| `apps/admin` shell + dashboard | ✅ Complete | 90% |
| `apps/web` public PWA | ❌ Not started | 0% |

**One known bug:** `GET /broadcasts` endpoint does not exist in any Edge Function. The `broadcast` function only handles `POST /:momentId`. The broadcasts list page always renders empty. Fix in Phase 10.

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

The work has shifted from building infrastructure to building products.
Each phase completes a full user workflow, not a technical component.

### Phase 10 — Moments CMS
**Goal:** An operator can create, draft, schedule, broadcast, and audit a Moment from start to finish.

| Task | Status |
|---|---|
| Fix `GET /broadcasts` — add list handler to broadcast Edge Function | ⏳ |
| Moment edit form (`/moments/[id]/edit`) | ⏳ |
| Moment cancel action | ⏳ |
| Schedule UI — datetime picker wired to `api.moments.schedule()` | ⏳ |
| Broadcast history per moment on detail page | ⏳ |
| Moment analytics (views, reach) from `moment_stats` | ⏳ |
| Draft list view (filter by status=draft) | ⏳ |

**Definition of done:** Operator can complete the full draft → schedule → broadcast → review cycle without leaving the admin.

---

### Phase 11 — Community Management
**Goal:** Moderators can manage the full subscriber and message lifecycle.

| Task | Status |
|---|---|
| Subscriber detail view | ⏳ |
| Manual opt-out from admin | ⏳ |
| Message thread view (conversation per phone number) | ⏳ |
| Advisory detail — full signal breakdown | ⏳ |
| Authority profile create/edit/suspend | ⏳ |
| Comments moderation (`comments`, `whatsapp_comments` tables) | ⏳ |

---

### Phase 12 — Commercial
**Goal:** Admins can onboard sponsors, create campaigns, and track budget spend.

| Task | Status |
|---|---|
| Sponsor create/edit form | ⏳ |
| Campaign create form | ⏳ |
| Campaign approval workflow (status transitions) | ⏳ |
| Budget transaction history per campaign | ⏳ |
| Revenue dashboard improvements | ⏳ |

---

### Phase 13 — Platform Hardening
**Goal:** The platform is production-safe under load.

| Task | Status |
|---|---|
| Rate limiting enforcement in Edge Functions | ⏳ |
| Broadcast retry logic for failed batches | ⏳ |
| `media` upload endpoint and storage management | ⏳ |
| `user_profiles` admin management | ⏳ |
| Audit log viewer in admin | ⏳ |
| Error log viewer in admin | ⏳ |

---

### Phase 14 — Public Experience (`apps/web`)
**Goal:** Community members can read moments, browse by region/category, and subscribe.

| Task | Status |
|---|---|
| Public PWA scaffold (layout, theme, fonts) | ⏳ |
| Moment feed page (broadcasted, publish_to_pwa=true) | ⏳ |
| Moment detail page | ⏳ |
| Region pages | ⏳ |
| Category pages | ⏳ |
| Search | ⏳ |
| Subscribe flow (WhatsApp deep link) | ⏳ |
| Offline support (PWA manifest, service worker) | ⏳ |

---

### Phase 15 — Automation
**Goal:** WhatsApp is live in production. n8n handles advisory analysis.

| Task | Status |
|---|---|
| WhatsApp Cloud API production credentials | ⏳ |
| Live webhook end-to-end test | ⏳ |
| n8n workflow — advisory confidence scoring | ⏳ |
| n8n workflow — scheduled broadcast trigger | ⏳ |
| n8n workflow — HELP/STATUS auto-reply | ⏳ |

---

### Phase 16 — Platform Expansion
**Goal:** Second application onboards onto the platform.

| Task | Status |
|---|---|
| Rename `@moments/*` → `@unami/*` | ⏳ |
| Spree Operations Dashboard scaffold | ⏳ |
| BeatsChain domain package scaffold | ⏳ |

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
| `GET /broadcasts` endpoint missing — broadcasts page renders empty | P0 Bug | Phase 10 |
| Broadcast retry logic absent — failed batches are permanent | P1 | Phase 13 |
| Advisory confidence hardcoded `0.5` — n8n not connected | P2 | Phase 15 |
| `rate_limits` table exists but no enforcement | P2 | Phase 13 |
| `moment_stats` populated but never surfaced in UI | P3 | Phase 10 |

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
│   ├── admin/          Next.js 16 — Moments admin (complete shell, 11 modules)
│   └── web/            Next.js 16 — Moments public PWA (not yet built)
├── packages/
│   ├── ui/             @moments/ui — design system, charts, theme engine (complete)
│   ├── shared/         @moments/shared — enums, types, validators, constants (complete)
│   └── api/            @moments/api — typed API clients (complete)
├── supabase/
│   ├── functions/      11 Edge Functions (complete)
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
