# Phase 18 — Umkhandlu Intelligence Dashboard
# Chat prompt. Load at the start of every Phase 18 session.

## Session context

You are working on Phase 18 of Unami Platform Core.

Phase 17 (Moments) is engineering-complete and frozen. Do not touch `apps/admin`, `apps/web`,
or any Moments Edge Functions unless a production bug requires it.

Phase 18 is the first new application on the platform. It validates multi-application federation.

---

## What you must read before writing any code

1. `PROJECT_STATUS.md` — current sub-phase, last commit, what is done and what is next
2. `docs/abstractions/umkhandlu/12_IMPLEMENTATION_ROADMAP.md` — the sequence and trigger conditions
3. `docs/abstractions/umkhandlu/09_PLATFORM_MAPPING.md` — what is platform-generic vs domain-specific
4. `docs/abstractions/umkhandlu/10_DATABASE_IMPACT.md` — future table classification
5. `docs/abstractions/umkhandlu/00_EXECUTIVE_SUMMARY.md` — the philosophy and five-layer model
6. `docs/abstractions/umkhandlu/01_DOMAIN_MODEL.md` — complete domain map
7. `docs/context/decisions.md` — decisions that must not be reversed
8. `docs/DATABASE_SCHEMA.md` — before any schema changes

---

## What Phase 18 builds

`apps/umkhandlu` — a governance operating platform for traditional authorities and community institutions.

Not another CMS. Not another admin dashboard. An institutional memory engine.

Sub-phases (in order — do not skip):
- **18A** ⏳ Foundation — scaffold `apps/umkhandlu`, shell, navigation, domain, platform tables, Edge Functions
- **18B** Governance Records — full record CRUD, lineage chain, evidence, status lifecycle
- **18C** Notice Architecture — community + statutory notices, lifecycle, notice→record lineage
- **18D** Public Participation — consent-gated, webhook-delivered, never stored
- **18E** Evidence Engine — environmental context, TCRS conflict logs, Layer 5 derived outputs
- **18F** Commercial Layer — CSR campaigns, certified deliverables, progress log, RAG, beneficiaries
- **18G** Intelligence Dashboard — operator dashboard, node health, TCRS escalation surface

---

## Architecture rules for Phase 18

**Application ownership:**
- `apps/umkhandlu` owns its own shell, navigation, and domain
- It does not share shell or navigation with `apps/admin`
- Umkhandlu domain lives in `apps/umkhandlu/src/domain/umkhandlu/` — never in `packages/shared`
- The test: deleting Umkhandlu must leave `packages/` compiling without modification

**Platform tables (new migrations):**
- `records`, `notices`, `evidence`, `participation_log`, `conflict_logs`, `conflict_claims` — platform-owned
- `governance_nodes`, `governance_areas`, `governance_persons` — Umkhandlu application tables
- All new tables follow `10_DATABASE_IMPACT.md` classification
- `docs/DATABASE_SCHEMA.md` is updated first — then the migration is written
- Next migration: `006_platform_records.sql`

**Edge Functions:**
- New functions: `records/index.ts`, `notices/index.ts`
- Follow the exact same pattern as existing functions — Hono, `requireAuth()`, `checkRateLimit()`
- Edge Functions are the only layer that touches the database — no exceptions

**packages/api:**
- New typed clients for `records` and `notices` added to `packages/api`
- Domain types inlined as string literal unions — no import from `apps/umkhandlu/domain`
- `packages/api` must remain usable by any application without domain dependency

**packages/ are frozen:**
- Do not restructure `packages/`
- Do not add domain logic to `packages/shared`
- Do not add application-specific components to `packages/ui`
- Only add to `packages/api` when a new Edge Function endpoint requires a typed client

---

## Domain vocabulary (Umkhandlu)

Use this vocabulary in `apps/umkhandlu` domain code. Never use it in `packages/`.

| Concept | Vocabulary |
|---|---|
| Governance event origin | Notice |
| Community notice types | meeting · announcement · resolution · alert · opportunity · employment · smme · project-update |
| Statutory notice types | eia · rezoning · land-use · township · building · mining · liquor · telecom · estate · liquidation · pto |
| Institutional memory node | Record |
| Record types | minutes · resolution · community-decision · land-allocation · dispute-resolution · report · infrastructure-concern · project-outcome · policy · agenda · public-notice · external-resource |
| Record status lifecycle | pending → adopted / approved / resolved |
| Geographic unit | isigodi (ward-level), governance area |
| Leadership | Inkosi (chief), Induna (headman) |
| Project health | RAG — green / amber / red |
| Project phases | planning · procurement · construction · commissioning · operational |
| Funding sources | EPWP · MIG · WSIG · RBIG · own-funds · private |
| Legal frameworks | SPLUMA · NEMA · B-BBEE · CIPC |
| Infrastructure certificate | IPC (Infrastructure Progress Certificate) |
| Project management | PMU (Project Management Unit) |

---

## Component rules (apps/umkhandlu)

Same rules as `apps/admin`:
- `@unami/ui` shared primitives for structural patterns: `PageHeader`, `KPIGrid`, `MetricCard`,
  `TableToolbar`, `TablePagination`, `BulkActionBar`, `DataTable`, `EmptyState`, `ErrorState`,
  `PageSkeleton`, `TableSkeleton`, `StatusBadge`, `AnalyticsCard`, `LineChart`, `BarChart`,
  `PieChart`, `AreaChart`, `ActivityFeed`, `QuickActions`
- shadcn primitives from `src/components/ui/` for low-level elements
- Do NOT use from `@unami/ui`: `AppShell`, `Sidebar`, `Header`, `MobileNav` — Phase 3 stubs
- Badge variants: `default | secondary | destructive | outline` only
- `data-active={isActive || undefined}` — never `data-active={isActive}`

**Page layout rules** — identical to `apps/admin`:
- List pages: `PageHeader` + `KPIGrid` (if metrics) + `TableToolbar` + table + `TablePagination`
- Form pages: `PageHeader` + `max-w-2xl` + one `Card` per field group + submit row
- Detail pages: `PageHeader` + `max-w-3xl` + `grid grid-cols-2 gap-4` + content `Card`(s)

---

## Auth pattern (apps/umkhandlu)

Same pattern as `apps/admin`:
- `(umkhandlu)/layout.tsx` is the single auth gate
- `getOperatorSession()` for session value downstream
- `session!` non-null assertion in page files — layout guarantees non-null
- Role checks use `session?.role` optional chaining

---

## What is frozen — do not touch

- `apps/admin` — Moments admin, complete and frozen
- `apps/web` — Moments public PWA, complete and frozen
- `packages/ui`, `packages/shared` — frozen at v1.0
- `supabase/migrations/000_initial_schema.sql` — immutable
- All existing Edge Functions — frozen unless a bug requires a fix
- `docs/DATABASE_SCHEMA.md` — update here first before writing any migration

---

## Commit pattern

Each sub-phase committed with a descriptive message and pushed to `origin main` immediately.
Format: `phase-18a-complete`, `phase-18b-complete`, etc.

Typecheck before every commit: `pnpm --filter umkhandlu exec tsc --noEmit`

---

## The five-layer model (architectural reference)

Every concept in Umkhandlu maps to a layer:

| Layer | Name | Concepts |
|---|---|---|
| 1 | Community Communication | Notice, announcement, alert, opportunity |
| 2 | Governance Records | Record (all types), decision, resolution |
| 3 | Evidence Preservation | Attachments, public comments, conflict logs |
| 4 | Institutional Memory | Lineage, parent/child chains, provenance |
| 5 | Governance Evidence | Certificates, journey maps, audit packages |

Layer 5 is derived from Layers 1–4. It is never a primary input.

---

## Before writing any code — answer these questions

1. Does this concept belong in the platform (`packages/`) or in the application (`apps/umkhandlu`)?
2. Is this platform-generic or Umkhandlu domain-specific? (check `09_PLATFORM_MAPPING.md`)
3. Does an equivalent already exist in `packages/` or in the existing schema?
4. Does this introduce domain vocabulary into a shared package?

If any answer is uncertain — stop and ask before writing.
