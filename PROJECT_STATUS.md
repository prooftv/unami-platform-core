# Project Status

Living engineering snapshot. Updated at every phase transition.
Read this first when resuming work or starting a new session.

---

## Current State

| Field | Value |
|---|---|
| Version | `v1.0.0-unami-platform` |
| Phase | Phase 18 — Complete (18A–18G) |
| Branch | `main` |
| Workspace | `/workspaces/unami-platform-core` |
| Remote | `origin` → `https://github.com/prooftv/unami-platform-core` |
| Last commit | `4b713d9` |
| Build | ✅ Passing |
| Typecheck | ✅ Passing |

---

## What This Repository Is Now

Unami Platform Core reached v1.0.0. The platform infrastructure is complete and frozen.

From here, all work is **application validation** — building products that prove the platform works,
reveal what it still needs, and expand its capabilities only when a concrete requirement demands it.

Moments is the first product. It validates the platform end to end.
The Unami Control Centre is the second. It validates multi-application federation.

---

## Platform Foundation — Complete and Frozen

| Layer | Status |
|---|---|
| Database — 26 tables | ✅ Complete |
| Edge Functions — 18 functions | ✅ Complete |
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

### Phase 17H — Intelligence Foundation ✅

**Goal:** Aggregations, KPIs, and derived metrics surfaced in the operator dashboard. No new DB tables. All on-demand server-side queries.

| Task | Status |
|---|---|
| `analytics` Edge Function — 4 new routes: participation, evidence, project-health, activity | ✅ |
| `participationStats` — total, byType, byRelationship, avgPerMoment | ✅ |
| `evidenceStats` — total, byType, totalBytes, momentsWithEvidence | ✅ |
| `projectHealthSummary` — CSR RAG distribution, byPhase, totalBeneficiaries | ✅ |
| `activityStream` — unified event feed: moments, broadcasts, participation, evidence | ✅ |
| `packages/api` — 4 new types: `ParticipationStats`, `EvidenceStats`, `ProjectHealthSummary`, `ActivityEvent` | ✅ |
| `packages/api` — 4 new analytics client methods | ✅ |
| Dashboard — `Intelligence` tab added | ✅ |
| `IntelligenceWidgets` — KPI row, participation breakdown, evidence breakdown, project health, activity stream | ✅ |

---

### Phase 17I — WhatsApp Integration ✅

**Goal:** End-to-end WhatsApp delivery working. Reply handlers live. Broadcast production-ready.

| Task | Status |
|---|---|
| `sendWhatsAppMessage` helper — extracted, used by all reply handlers | ✅ |
| HELP reply handler — full command menu sent directly from webhook | ✅ |
| STATUS reply handler — fetches subscriber settings, replies with live data | ✅ |
| MYAUTHORITY reply handler — fetches authority profile, replies with level/role/scope | ✅ |
| Opt-in confirmation message — welcome message sent on START | ✅ |
| Opt-out confirmation message — unsubscribe confirmation sent on STOP | ✅ |
| YES/NO added to OPT_IN/OPT_OUT command lists | ✅ |
| MY added to STATUS command list | ✅ |
| Broadcast — template support with free-text fallback | ✅ |
| `buildTemplatePayload` — WhatsApp template with language mapping | ✅ |
| `buildFreeTextPayload` — fallback for unverified/dev environments | ✅ |
| `WHATSAPP_DEFAULT_TEMPLATE` env var documented in `.env.example` | ✅ |
| WhatsApp Business Account verified | ⏳ Ops |
| WhatsApp credentials set in Supabase secrets | ⏳ Ops |
| Live end-to-end test with real subscriber | ⏳ Ops |

---

### Phase 17J — Production Validation ✅ Engineering Complete

**Goal:** Moments v2 is shipped. Engineering complete. Ops gates remaining.

| Task | Status |
|---|---|
| Security headers — CSP, HSTS, X-Frame-Options, Permissions-Policy on both apps | ✅ |
| Rate limit audit — all 19 Edge Functions covered in `_shared/auth.ts` | ✅ |
| `checkRateLimit` added to `auth` Edge Function (brute-force protection) | ✅ |
| `checkRateLimit` added to `evidence` upload route | ✅ |
| `docs/LAUNCH_CHECKLIST.md` — acceptance checklist written | ✅ |
| D-033 recorded in `decisions.md` — Phase 17 engineering complete | ✅ |
| Supabase Pro plan | ⏳ Ops |
| All migrations applied (000–008) | ⏳ Ops |
| Storage buckets created (`evidence`, `moments-media`) | ⏳ Ops |
| WhatsApp Business Account verified, credentials set | ⏳ Ops |
| Vercel deployments with custom domains | ⏳ Ops |
| Sanity Studio deployed, seed documents verified | ⏳ Ops |
| Lighthouse scores ≥ 90 on `apps/web` | ⏳ Ops |
| End-to-end functional validation | ⏳ Ops |
| First real broadcast sent | ⏳ Ops |
| Acceptance checklist signed off | ⏳ Ops |

---

## Phase 18 — Unami Control Centre ⏳ Active

**Goal:** The first application built on top of the mature platform.
Not a governance editor. Not a CRUD application. The control centre that connects to
deployed governance nodes and produces institutional intelligence across them.

The production Umkhandlu governance application (`umkhandlu.unamifoundation.org`) already exists
and owns governance editing, records, notices, evidence, participation, public website, Sanity Studio.
Platform Core does not duplicate it. See D-035 in `decisions.md`.

Constitutional reference: `docs/abstractions/umkhandlu/` (13 documents).
Read `08_INTELLIGENCE_LAYER.md` and `09_PLATFORM_MAPPING.md` before writing any code.

```
               Node 1              Node 2              Node 3
           Umkhandlu A          Umkhandlu B          Umkhandlu C
         (governance node)   (governance node)   (governance node)
                │                    │                    │
                └────────────────────┴────────────────────┘
                                     │
                              Moments Node
                                     │
                         ────────────────────────
                           Unami Control Centre
                              apps/umkhandlu
                         ────────────────────────
                    Node Registry · Health Views
                    Cross-node Aggregation
                    Commercial Intelligence
                    TCRS Escalation Surface
                    Institutional Memory
```

### Phase 18A — Foundation ✅ Complete

Scaffold, shell, navigation, domain structure, platform tables, node registry model, API contract defined.
CRUD screens removed. Navigation corrected to Control Centre intent.

### Phase 18B — Node Connection ✅ Complete

| Task | Status |
|---|---|
| Governance Node API contract defined (`GOVERNANCE_NODE_API.md`) | ✅ |
| Node registry in Supabase (`governance_nodes` table) | ✅ |
| `umkhandlu.unamifoundation.org` registered as first node | ✅ |
| Read-only authentication (node-issued Bearer key) | ✅ |
| Node identity, health, records, notices, commercial, participation, evidence, lineage, tcrs | ✅ |
| All summaries displayed in Control Centre — no write capability | ✅ |
| `GOVERNANCE_NODE_REGISTRY.md` constitutional document written (D-037) | ✅ |
| **Contract v1.0 alignment** — field names corrected to live node: `recent` (not `recentActivity`), `timestamp` (not `generatedAt`), TCRS `partial` state added | ✅ |

### Phase 18C — Node Health View ✅ Complete

| Task | Status |
|---|---|
| `/nodes/health` — per-node health, record/notice counts, version, response | ✅ |
| `/intelligence/records` — 15 records, by status, by type, recent activity | ✅ |
| `/intelligence/notices` — 8 notices, statutory breakdown, by type, recent activity | ✅ |
| `/intelligence/participation` — by submission type, by relationship | ✅ |
| `/intelligence/projects` — 2 projects, R40M budget, 100 beneficiaries, RAG health | ✅ |
| `/intelligence/audit` — lineage chains, Layer 5 outputs, evidence summary | ✅ |
| `/platform/health` — live API health with response times per node | ✅ |
| All sidebar items live — no disabled/soon items remaining | ✅ |

### Phase 18D — Cross-Node Aggregation ✅ Complete

| Task | Status |
|---|---|
| `/intelligence/nodes` — side-by-side node comparison table | ✅ |
| Aggregated totals row (records, notices, projects, beneficiaries, budget) | ✅ |
| Per-node breakdown cards | ✅ |
| Cross-node sidebar entry added | ✅ |

### Phase 18E — Commercial Intelligence ✅ Complete (via 18C)

RAG distribution, project status, beneficiary tracking, budget aggregation all live at `/intelligence/projects`.

### Phase 18F — TCRS Escalation Surface ✅ Complete (via 18C)

Conflict logs and resolution state live at `/intelligence/audit`.

### Phase 18G — Institutional Memory ✅ Complete (via 18C)

Lineage chains, Layer 5 outputs, evidence summary live at `/intelligence/audit`.

### Settings — Phase 19 ✅ Complete

| Task | Status |
|---|---|
| Profile update (display name) | ✅ |
| Operator list with role display and last sign-in | ✅ |
| Role change (super_admin only) | ✅ |
| Invite new operator by email + role | ✅ |
| Remove operator (cannot remove self) | ✅ |
| Platform info card | ✅ |

### Dashboard Parity — Shell Alignment ✅ Complete

Control Centre shell brought to full parity with Moments admin. Validates the platform onboarding pattern.

| Task | Status |
|---|---|
| `ThemeSwitcher` added to header (light/dark/system cycle) | ✅ |
| `SearchDialog` added to header (⌘J command palette over all sidebar items) | ✅ |
| `AppSidebar` uses `isSynced` preferences pattern — sidebar variant/collapsible driven by store | ✅ |
| Layout reads `sidebar_variant` + `sidebar_collapsible` from cookies server-side (`getPreference`) | ✅ |
| `PreferencesStoreProvider` moved to root layout (matches admin pattern) | ✅ |
| `server-actions.ts` added (`getPreference`, `setValueToCookie`, `getValueFromCookie`) | ✅ |
| Centered content layout support added (`data-content-layout` CSS selectors) | ✅ |
| Navbar sticky/scroll behaviour wired (`data-navbar-style` CSS selectors) | ✅ |
| `nav-user.tsx` uses `Avatar`/`AvatarFallback` (matches admin) | ✅ |
| Missing shadcn components added: `avatar`, `command`, `alert`, `progress`, `switch`, `tabs`, `input-group` | ✅ |
| `cmdk` dependency added to `package.json` | ✅ |
| Typecheck: zero errors | ✅ |

---

## Platform Roadmap (Post-Phase 18)

```
Phase 16  Platform Independence          ✅ Complete
Phase 17  Moments Product Completion     ✅ Engineering Complete (ops gates remaining)
Phase 18  Unami Control Centre           ✅ Complete (18A–18G + settings + shell parity)
Phase 19  UNCIP v2                       ⏳ Next
Phase 20  Multi-node Federation
Phase 21  Commercial Intelligence
Phase 22  National Institutional Memory
```

Future applications (Umkhandlu governance app, ITPMS, Schools Portal, BeatsChain, Spree) are
scaffolded as concrete product requirements emerge — not on a fixed schedule.
Each consumes `@unami/ui`, `@unami/shared`, `@unami/api`. None modify `packages/`.

---

## Phase 19 — UNCIP v2 ⏳ Active

**Goal:** Build UNCIP (Unami National Child Identification Programme) as `apps/uncip`.
Child safety platform for South African townships. Connects parents, schools, SAPS, and community.
Strategic goal: government pilot presentation — 30 schools, 3 provinces, ~2,000 children.

All founder decisions locked. Full context in `docs/context/uncip/UNCIP_SESSION_PROMPT.md`.

### Phase 19 Step 0 — Platform Shell Extraction ✅ Complete

First extraction of the dashboard shell pattern proven independently in Moments, Umkhandlu, and UNCIP.
No new packages. No speculative abstractions. Only what was provably identical across all three apps.

| Task | Status |
|---|---|
| Pre-extraction diff verification — confirmed identical files before touching anything | ✅ |
| `ThemeBootScript` extracted → `packages/ui/src/shell/ThemeBootScript.tsx` | ✅ |
| Nav types (`NavGroup`, `NavMainItem`, etc.) extracted → `packages/ui/src/shell/nav-types.ts` | ✅ |
| `packages/ui/src/shell/index.ts` updated to export both | ✅ |
| All three apps migrated: `ThemeBootScript` imported from `@unami/ui` | ✅ |
| All three apps migrated: `ShellLayoutControls` imported from `@unami/ui` (local copies deleted) | ✅ |
| All three apps migrated: nav types imported from `@unami/ui` in `sidebar-items.ts` and `nav-main.tsx` | ✅ |
| Local `scripts/theme-boot.tsx` deleted from all three apps | ✅ |
| Local `header/layout-controls.tsx` deleted from all three apps | ✅ |
| `docs/context/PLATFORM_DASHBOARD_SHELL.md` written — constitutional spec + templates + checklist | ✅ |
| TypeScript: zero errors across `packages/ui`, admin, umkhandlu, uncip | ✅ |
| Boundary verified: only `packages/ui` and three app shell files changed | ✅ |

**Constitutional principle locked:**
> The shell is shared. The application is not.
> Platform Core owns shell technology. The product owns shell configuration.

**What cannot be extracted (Next.js dependency boundary):**
- `nav-main.tsx` — needs `next/link`, `next/navigation`, app-local shadcn sidebar
- `server-actions.ts` — needs `next/headers`
- `lib/fonts/registry.ts` — needs `next/font/google`
- Layout files — async server components with Next.js APIs

### Phase 19 Steps 1–10 — UNCIP Domain Implementation ⏳

**Implementation sequence (UI-first, backend last):**

| Step | Task | Status |
|---|---|---|
| 1 | App scaffold — `apps/uncip/` foundation complete (shell, auth stub, domain types) | ✅ |
| 2 | UI — Children module (list, detail, create form) against synthetic data | ⏳ |
| 3 | UI — Alerts module (list, detail, create form) against synthetic data | ⏳ |
| 4 | UI — Users module (list, invite, role assignment) against synthetic data | ⏳ |
| 5 | UI — SAPS Stations module (list, detail) against synthetic data | ⏳ |
| 6 | UX validation — full domain surface reviewed, synthetic data settled | ⏳ |
| 7 | Database — 8 new tables, migration `009_uncip_schema.sql`, RLS | ⏳ |
| 8 | Edge Functions — children, alerts, sightings, notifications | ⏳ |
| 9 | API clients — `packages/api/src/clients/uncip-*.ts` | ⏳ |
| 10 | Wire UI to real data — replace synthetic data, auth phase | ⏳ |

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
| WhatsApp secrets unset in Supabase | P0 Ops | Phase 17J ops |
| Lighthouse scores not yet verified against production | P1 Ops | Phase 17J ops |

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
│       ├── 001_grant_service_role_privileges.sql
│       ├── 002_governance_adaptation.sql
│       ├── 003_participation_engine.sql
│       ├── 004_evidence_layer.sql
│       ├── 005_commercial_layer.sql
│       ├── 006_platform_records.sql
│       ├── 007_whatsapp_tables.sql
│       └── 008_community_records.sql
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
