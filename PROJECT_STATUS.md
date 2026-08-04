# Project Status

Living engineering snapshot. Updated at every phase transition.
Read this first when resuming work or starting a new session.

---

## Current State

| Field | Value |
|---|---|
| Version | `v1.0.0-unami-platform` |
| Phase | Phase 17G — Commercial Layer ✅ Complete |
| Branch | `main` |
| Workspace | `/workspaces/unami-platform-core` |
| Remote | `origin` → `https://github.com/prooftv/unami-platform-core` |
| Last commit | `phase-17g-complete` (pending push) |
| Build | ✅ Passing |
| Typecheck | ✅ Passing |

---

## What This Repository Is Now

Unami Platform Core reached v1.0.0. The platform infrastructure is complete and frozen.

From here, all work is **application validation** — building products that prove the platform works,
reveal what it still needs, and expand its capabilities only when a concrete requirement demands it.

Moments is the first product. It validates the platform end to end.
The Umkhandlu Intelligence Dashboard is the second. It validates multi-application federation.

---

## Platform Foundation — Complete and Frozen

| Layer | Status |
|---|---|
| Database — 26 tables | ✅ Complete |
| Edge Functions — 17 functions (+ participation, evidence, updated campaigns) | ✅ Complete |
| `packages/shared` — platform primitives | ✅ Frozen |
| `packages/ui` — design system | ✅ Frozen |
| `packages/api` — typed clients | ✅ Frozen |
| `apps/admin` — all modules, full CRUD | ✅ Complete |

---

## Umkhandlu Abstraction Pack — Complete

Constitutional reference for all governance, records, participation, evidence, and intelligence work.

```
docs/abstractions/umkhandlu/
  00_EXECUTIVE_SUMMARY.md       — philosophy, five-layer model, separation of concerns
  01_DOMAIN_MODEL.md            — complete domain map, concept classification
  02_RECORD_ARCHITECTURE.md     — record structure, lineage, immutability
  03_NOTICE_ARCHITECTURE.md     — community + statutory notices, lifecycle
  04_PUBLIC_PARTICIPATION.md    — consent-gated, webhook-delivered, never stored
  05_EVIDENCE_ARCHITECTURE.md   — attachments, weather context, TCRS
  06_WORKFLOW_ENGINE.md         — governance workflows as record chains
  07_COMMERCIAL_LAYER.md        — campaigns, certified deliverables, sponsors
  08_INTELLIGENCE_LAYER.md      — operator dashboard, TCRS, federated nodes
  09_PLATFORM_MAPPING.md        — critical bridge: platform vs domain classification
  10_DATABASE_IMPACT.md         — future tables classified by ownership
  11_MOMENTS_ADAPTATION.md      — governance concepts adapted for community use
  12_IMPLEMENTATION_ROADMAP.md  — sequence, triggers, phase detail
```

See `decisions.md` D-031 and D-032.

---

## Phase 17 — Moments Product Completion

Ten sub-phases. Each builds on the last. Do not begin a sub-phase until the previous is complete and documented.

---

### Phase 17A — Public PWA Foundation ✅

**Goal:** Build the actual public product. Not a placeholder. The real Moments experience.

| Task | Status |
|---|---|
| Full responsive navigation — desktop, mobile drawer, theme toggle | ✅ |
| Homepage — 9 sections | ✅ |
| Dedicated /feed page | ✅ |
| Moment cards — urgency badges, sponsor attribution, region/category metadata | ✅ |
| Moment detail — full content, media, WhatsApp share | ✅ |
| Category, region, search pages | ✅ |
| Subscribe page — WhatsApp opt-in flow | ✅ |
| Static pages — About, Help, Privacy, Terms, Sponsors, Campaigns, Authority | ✅ |
| Global 404, offline page | ✅ |
| Theme toggle — localStorage persistence, FOUC prevention | ✅ |
| PWA manifest + service worker | ✅ |
| Build: 16 routes, TypeScript clean | ✅ |

---

### Phase 17B — Content Ownership Constitution ✅

**Goal:** Freeze the boundary between Sanity and Supabase before writing a single line of CMS code.
Deliverable: `docs/context/CONTENT_OWNERSHIP.md` — a constitutional document, not a note.

| Task | Status |
|---|---|
| Define every content type and assign it to Sanity or Supabase | ✅ |
| Define immutability rules per content type | ✅ |
| Define editorial vs operational boundary | ✅ |
| Define generated vs curated vs operational content | ✅ |
| `CONTENT_OWNERSHIP.md` written and committed | ✅ |

---

### Phase 17C — Sanity Editorial Layer ⏳

**Goal:** Build the Sanity integration — only after ownership is frozen.

| Task | Status |
|---|---|
| Sanity project created — `g4t7r2a1` / `production` | ✅ |
| `@sanity/client` added to `apps/web` | ✅ |
| `apps/web/src/lib/sanity/client.ts` — typed Sanity client | ✅ |
| `apps/web/src/lib/sanity/types.ts` — TypeScript types for all 10 schemas | ✅ |
| `apps/web/src/lib/sanity/queries.ts` — all GROQ queries with ISR tags | ✅ |
| `apps/web/src/app/api/revalidate/route.ts` — on-demand revalidation webhook | ✅ |
| `apps/web/src/components/PortableText.tsx` — block content renderer | ✅ |
| All env vars documented in `.env.example` incl. `SANITY_API_WRITE_TOKEN` | ✅ |
| `apps/web` deployed → `https://unami-platform-core-web.vercel.app` | ✅ |
| Sanity revalidation webhook → `/api/revalidate` configured | ✅ |
| All 8 editorial pages wired to Sanity — no hardcoded content | ✅ |
| 15 documents seeded via `apps/web/scripts/seed-sanity.mjs` | ✅ |
| Sanity Studio deployed + 10 schemas defined | ⏳ Ops — remaining |

---

### Phase 17D — Governance Adaptation ✅

**Goal:** Introduce governance-inspired moment types and participation foundation into Moments — additive only.

| Task | Status |
|---|---|
| `moment_type` column — standard/community/opportunity/infrastructure/consultation | ✅ |
| `participation_enabled` + `participation_deadline` columns on `moments` | ✅ |
| Migration `002_governance_adaptation.sql` | ✅ |
| `MomentType` enum + labels + descriptions in `apps/admin/src/domain/moments/enums.ts` | ✅ |
| `MomentType` type exported from `packages/api` | ✅ |
| `Moment` and `PublicMoment` types updated with new fields | ✅ |
| Edge Function `moments/index.ts` — validates and persists new fields | ✅ |
| `CreateMomentClient` — moment type selector, participation toggle, deadline field | ✅ |
| `apps/web` moment detail — type badge, participation banner, deadline display | ✅ |

---

### Phase 17E — Public Participation Engine ✅

**Goal:** Structured community participation on consultation moments. Consent-gated, webhook-delivered, never stored.

| Task | Status |
|---|---|
| `participation_log` table — anonymised, no PII, POPIA constraint | ✅ |
| `participation_count` column on `moment_stats` — denormalised | ✅ |
| `increment_participation_count` DB function | ✅ |
| `participation_webhook_url` system setting | ✅ |
| Migration `003_participation_engine.sql` | ✅ |
| `supabase/functions/participation/index.ts` — new Edge Function | ✅ |
| Server-side consent validation (`popiaConsent: true` required) | ✅ |
| Server-side deadline enforcement | ✅ |
| Webhook delivery — personal data delivered, never stored | ✅ |
| Webhook failure non-fatal — logged, submission still succeeds | ✅ |
| Rate limit `/participation` — 20 req/min | ✅ |
| `packages/api` — `createPublicParticipationClient`, exported types | ✅ |
| `apps/web` — `ParticipationForm` component, wired to moment detail | ✅ |

---

### Phase 17F — Evidence Layer ✅

**Goal:** Media as formal evidence. Environmental context. Additive, immutable, server-enforced.

| Task | Status |
|---|---|
| `evidence` table — immutable, additive, RLS-gated | ✅ |
| `weather_context` JSONB column on `moments` | ✅ |
| Migration `004_evidence_layer.sql` | ✅ |
| `supabase/functions/evidence/index.ts` — upload + list, multipart | ✅ |
| File type validation server-side (mime type, 10 MB limit) | ✅ |
| Supabase Storage upload — `evidence` bucket | ✅ |
| `packages/api` — `createEvidenceClient`, `createPublicEvidenceClient`, exported types | ✅ |
| `apps/admin` — `EvidencePanel` on moment detail — upload + list | ✅ |
| `apps/web` — evidence list on public moment detail | ✅ |
| `apps/web` — weather context display (historical/forecast) | ✅ |
| `apps/web/src/lib/weather.ts` — Open-Meteo fetch, server-only | ✅ |
| Weather fetch: server component only, fire-and-forget, never blocks render | ✅ |

---

### Phase 17G — Commercial Layer ✅

**Goal:** Extend campaigns to full project tracking. From abstraction document 07.

| Task | Status |
|---|---|
| `campaign_type` column — ad / activation / csr | ✅ |
| `project_health` (RAG), `project_phase` columns | ✅ |
| `project_reference`, `funding_source`, `contractor`, `beneficiaries` columns | ✅ |
| `progress_log` JSONB — append-only | ✅ |
| `deliverables_certified` JSONB | ✅ |
| `impact_summary`, `lessons_learned` columns | ✅ |
| Migration `005_commercial_layer.sql` | ✅ |
| `CampaignType`, `ProjectHealth`, `ProjectPhase` enums in `apps/admin/src/domain/moments/enums.ts` | ✅ |
| `packages/api` — `Campaign` type extended, `CertifiedDeliverable` + `ProgressLogEntry` interfaces | ✅ |
| `packages/api` — `addProgress`, `certifyDeliverable`, `complete`, `progressLog`, `deliverables` methods | ✅ |
| `CampaignFormClient` — type selector + conditional CSR project detail fields | ✅ |
| `CampaignDetailClient` — project details card, progress log panel, deliverables panel, complete action | ✅ |
| `campaigns` Edge Function — new routes: GET/POST progress, GET/POST deliverables, POST complete | ✅ |

---

### Phase 17H — Intelligence Foundation ⏳

**Goal:** Everything necessary before dashboards. No dashboard yet. From abstraction document 08.

| Task | Status |
|---|---|
| Aggregated KPIs per region | ⏳ |
| Derived metrics (participation rates, evidence counts) | ⏳ |
| Institutional memory layer | ⏳ |
| Commercial projections | ⏳ |
| Regional metrics | ⏳ |
| Activity event stream | ⏳ |

---

### Phase 17I — WhatsApp Integration ⏳

**Goal:** End-to-end broadcast delivery working in production.
Last — only once PWA, CMS, participation, evidence, and commercial layers all exist.

| Task | Status |
|---|---|
| WhatsApp Cloud API credentials configured | ⏳ Ops |
| HELP reply handler (Edge Function) | ⏳ |
| STATUS reply handler (Edge Function) | ⏳ |
| MYAUTHORITY reply handler (Edge Function) | ⏳ |
| Opt-in / opt-out confirmation messages | ⏳ |
| Broadcast template testing | ⏳ |
| Live webhook end-to-end test with real subscriber | ⏳ |
| Delivery verification and retry testing | ⏳ |
| POPIA compliance verification | ⏳ |
| Full flow: Admin → Broadcast → WhatsApp → Subscriber → PWA | ⏳ |

---

### Phase 17J — Production Validation and Launch ⏳

**Goal:** Moments v2 is shipped. Not deployed — shipped. Genuinely production-ready.

| Task | Status |
|---|---|
| Domain configured | ⏳ |
| Vercel deployments — `apps/web` and `apps/admin` | ⏳ |
| Supabase project on paid plan | ⏳ |
| Sanity project on appropriate plan | ⏳ |
| WhatsApp Business Account verified | ⏳ |
| Caching strategy — CDN, ISR, service worker | ⏳ |
| Rate limiting audit — all Edge Functions | ⏳ |
| Security headers — CSP, HSTS, X-Frame-Options | ⏳ |
| Error monitoring — Sentry or equivalent | ⏳ |
| Performance budget — bundle size, LCP, CLS | ⏳ |
| Lighthouse — all pages ≥ 90 | ⏳ |
| Accessibility — WCAG 2.1 AA | ⏳ |
| Load testing — broadcast at scale | ⏳ |
| Rollback procedures documented | ⏳ |
| First real broadcast sent | ⏳ |
| Acceptance checklist signed off | ⏳ |

---

## Phase 18 — Umkhandlu Intelligence Dashboard

**Goal:** The first application built on top of the mature platform. Not another CMS. Not another admin.
The control centre — consuming multiple Umkhandlu nodes, Moments, and future applications.

This phase begins only after Phase 17J is complete.

```
               Node 1              Node 2              Node 3
           Umkhandlu A          Umkhandlu B          Umkhandlu C
                │                    │                    │
                └────────────────────┴────────────────────┘
                                     │
                              Moments Node
                                     │
                         ────────────────────────
                           Unami Control Centre
                         ────────────────────────
                    Institutional Memory · Commercial Intelligence
                    Infrastructure Intelligence · Participation
                    Evidence · AI Insights · Regional Trends
                    Provincial Trends · National Trends
                    Predictive Analytics
```

Sub-phases defined in `docs/abstractions/umkhandlu/12_IMPLEMENTATION_ROADMAP.md`.

---

## Platform Roadmap (Post-Phase 18)

```
Phase 16  Platform Independence          ✅ Complete
Phase 17  Moments Product Completion     ⏳ Active (17H)
Phase 18  Umkhandlu Intelligence Dashboard
Phase 19  Multi-node Federation
Phase 20  Commercial Intelligence
Phase 21  National Institutional Memory
```

Future applications (Umkhandlu governance app, ITPMS, Schools Portal, BeatsChain, Spree) are
scaffolded as concrete product requirements emerge — not on a fixed schedule.
Each consumes `@unami/ui`, `@unami/shared`, `@unami/api`. None modify `packages/`.

---

## Architecture Freeze

The platform foundation is **feature-frozen**. Do not:
- Add new packages
- Restructure `packages/`
- Add new tables without a concrete product requirement
- Redesign the admin shell
- Create new abstraction layers
- Add domain logic to `packages/shared`
- Add application-specific components to `packages/ui`

Fix bugs only. All new work is Moments product completion (Phase 17) or Phase 18 preparation.

---

## Known Issues

| Issue | Severity | Phase |
|---|---|---|
| Advisory confidence hardcoded `0.5` — n8n not connected | P2 | Deferred (D-023) |
| WhatsApp secrets unset in Supabase | P0 Ops | Phase 17I |
| HELP/STATUS/MYAUTHORITY webhook reply handlers not built | P1 | Phase 17I |

---

## Known Technical Debt

| Item | Location | Resolution |
|---|---|---|
| Phase 3 shell placeholders | `packages/ui/src/shell/` | `AppShell`, `Sidebar`, `Header`, `MobileNav` are unfinished stubs. Do not consume. Future platform milestone. |

---

## Repository Layout

```
unami-platform-core/
├── apps/
│   ├── admin/          Next.js — Moments admin (complete)
│   └── web/            Next.js — Moments public PWA (Phase 17A complete)
├── packages/
│   ├── ui/             @unami/ui — design system (frozen)
│   ├── shared/         @unami/shared — platform primitives (frozen)
│   └── api/            @unami/api — typed clients (frozen)
├── supabase/
│   ├── functions/      17 Edge Functions (+ participation, evidence)
│   └── migrations/
│       ├── 000_initial_schema.sql   ← baseline, immutable
│       ├── 001_...
│       ├── 002_governance_adaptation.sql
│       ├── 003_participation_engine.sql
│       ├── 004_evidence_layer.sql
│       └── 005_commercial_layer.sql
├── docs/
│   ├── abstractions/umkhandlu/      ← constitutional abstraction pack (13 documents)
│   ├── context/
│   │   ├── architecture.md
│   │   ├── decisions.md
│   │   ├── security-model.md
│   │   ├── product-vision.md
│   │   └── CONTENT_OWNERSHIP.md    ← Phase 17B deliverable
│   ├── DATABASE_SCHEMA.md
│   └── SCHEMA_MAPPING.md
```

---

## Rules — Do Not Violate

1. All work in `/workspaces/unami-platform-core`, pushed to `origin`.
2. `/workspaces/moments-v2` is reference only — never edit it.
3. `supabase/migrations/000_initial_schema.sql` is immutable — never modify it.
4. `docs/DATABASE_SCHEMA.md` is the schema source of truth — change here first, then write a migration.
5. `packages/ui` — no Supabase, no auth, no application-specific logic.
6. `packages/shared` — no React, no Next.js, no Supabase, no domain logic.
7. Edge Functions are the only layer that touches the database.
8. Frontend communicates through `packages/api` typed clients only.
9. Platform foundation is feature-frozen — no new abstractions, no restructuring.
10. Do not begin a new phase until the previous phase is complete and documented.
11. Each phase must answer: "Which user experience becomes fully usable?"
12. No new platform application begins until Phase 17J (Moments Launch) is complete.
