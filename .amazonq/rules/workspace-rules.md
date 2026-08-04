# Amazon Q — Workspace Rules
# Auto-loaded on every session. These rules are non-negotiable.

## Workspace
- All work happens in `/workspaces/unami-platform-core`
- All pushes go to `origin` → `https://github.com/prooftv/unami-platform-core`
- Branch: `main`
- Never touch `/workspaces/moments-v2` — reference only

## Before writing any code
1. Read `PROJECT_STATUS.md` — current phase, last commit, what is done and what is next
2. Read `docs/context/product-vision.md` — the product architecture and why the order matters
3. Read `docs/context/architecture.md` — layer boundaries, data flow, current phase
4. Read `docs/context/decisions.md` — decisions that must not be reversed
5. Read `docs/context/security-model.md` — auth and RBAC rules
6. Check `docs/DATABASE_SCHEMA.md` before any schema changes
7. Check `docs/context/CONTENT_OWNERSHIP.md` before any content or CMS decisions (Phase 17B+)
8. Check `docs/context/COMMERCIAL_DOMAIN.md` before any commercial, campaign, or project decisions

## What this repository is now
Unami Platform Core v1.0 is complete. This is application validation work — not platform engineering.
Moments is the first product. It validates the platform end to end.
The Unami Control Centre (Phase 18) is the second. It validates multi-application federation.
Do not begin a new phase until the previous phase is complete and documented.

## Platform is frozen at v1.0
- Do not restructure `packages/`
- Do not add new packages unless a concrete product requirement demands it
- Do not add domain logic to `packages/shared` — it contains only platform primitives
- Do not add application-specific components to `packages/ui` — it contains only design system primitives
- Do not redesign the admin shell — it belongs to Moments, not the platform
- Do not create new abstraction layers
- Fix bugs only — no speculative improvements to infrastructure

## Current priority
Phase 18 — Unami Control Centre. Active.

Moments (Phase 17) is engineering-complete and frozen. Do not touch `apps/admin`, `apps/web`,
or any Moments Edge Functions unless a production bug requires it.

Phase 18 is the first new application on the platform. It validates multi-application federation.
The constitutional reference is `docs/abstractions/umkhandlu/` (13 documents).
Read `12_IMPLEMENTATION_ROADMAP.md` and `09_PLATFORM_MAPPING.md` before writing any code.

Phase 18 sub-phases (in order — do not skip):
- **18A** ⚠️ Foundation — scaffold correct (cleanup: remove CRUD screens, define node registry, define node API contract)
- **18B** Node Connection — connect to first governance node via read-only API, data model alignment
- **18C** Node Health View — per-node health dashboard, record/notice/project counts, status distributions
- **18D** Cross-Node Aggregation — multi-node view, regional intelligence, comparative performance
- **18E** Commercial Intelligence — RAG distribution, deliverables, beneficiary tracking, projections
- **18F** TCRS Escalation Surface — conflict logs, authority classification, escalation tracking
- **18G** Institutional Memory — lineage views, provenance, Layer 5 derived outputs

## Phase 17 — Moments Product Completion ✅ Engineering Complete
All ten sub-phases complete. Frozen. Ops gates remaining (see `docs/LAUNCH_CHECKLIST.md`).

- **17A** ✅ Public PWA Foundation
- **17B** ✅ Content Ownership Constitution
- **17C** ✅ Sanity Editorial Layer
- **17D** ✅ Governance Adaptation
- **17E** ✅ Public Participation Engine
- **17F** ✅ Evidence Layer
- **17G** ✅ Commercial Layer
- **17H** ✅ Intelligence Foundation
- **17I** ✅ WhatsApp Integration
- **17J** ✅ Production Validation — engineering complete, ops pending

## Phase 18 rules — Unami Control Centre
- `apps/umkhandlu` is the Unami Control Centre — a read-oriented intelligence application, not a governance editor
- The production Umkhandlu governance application (`umkhandlu.unamifoundation.org`) owns governance editing — do not duplicate it
- `apps/umkhandlu` connects to deployed governance nodes via read-only APIs and aggregates institutional intelligence
- Do not build CRUD screens for records, notices, evidence, or participation inside `apps/umkhandlu`
- The abstraction pack defines shared platform concepts so nodes speak the same language — it does not require CRUD UI in Platform Core
- Platform tables (`records`, `notices`) already added in 18A — they define the shared data model, not a UI to edit them
- The node registry model defines which governance nodes the Control Centre connects to
- New typed clients in `packages/api` are read-only intelligence clients — no create/update operations from the Control Centre
- All intelligence concepts trace back to `docs/abstractions/umkhandlu/08_INTELLIGENCE_LAYER.md`
- The platform mapping reference is `09_PLATFORM_MAPPING.md` — classifies every concept as platform or domain
- The test: deleting Umkhandlu must leave `packages/` compiling without modification
- Do not touch `apps/admin` or `apps/web` — Moments is frozen

## Layer rules
- `packages/ui` — no Supabase, no auth, no domain knowledge, no app-specific components
- `packages/shared` — no React, no Next.js, no Supabase, no Moments-specific logic
- `packages/api` — typed HTTP clients only, domain types inlined as string literals
- `supabase/functions/` — only layer that touches the database
- `apps/admin` — owns Moments domain (`src/domain/moments/`), shell, and all admin modules
- `apps/web` — owns public routing, no auth, no Supabase client, Sanity client from Phase 17C

## Domain ownership rule (D-027)
- Moments domain lives in `apps/admin/src/domain/moments/` and `apps/web/src/domain/moments.ts`
- Never move domain logic back into `packages/shared`
- Future applications own their own domain — never share domain across apps
- The test: deleting Moments must leave `packages/` compiling without modification

## Component rules (apps/admin)
- Use shadcn primitives from `src/components/ui/` for low-level elements (Input, Select, Label, Textarea, Dialog, etc.)
- Use `@unami/ui` shared primitives for all structural patterns:
  - `PageHeader` — every page without exception: list pages, form pages, detail pages
  - `KPIGrid` + `MetricCard` — every KPI card row (pass `items` prop for data-driven usage)
  - `TablePagination` — every paginated table footer
  - `TableToolbar` — every search + filter toolbar
  - `BulkActionBar` — every table with bulk selection
  - `DataTable` — when column definitions are static and selection is needed
  - `EmptyState`, `ErrorState` — empty and error states
  - `PageSkeleton`, `TableSkeleton` — loading states (via loading.tsx)
  - `AnalyticsCard`, `LineChart`, `BarChart`, `PieChart`, `AreaChart` — charts and analytics
  - `ActivityFeed`, `QuickActions` — dashboard feed and action widgets
- Do NOT use from `@unami/ui`: `AppShell`, `Sidebar`, `Header`, `MobileNav` — Phase 3 stubs, do not consume
- Badge variants: `default | secondary | destructive | outline` only — no `warning`, `success`, `info`
- `data-active={isActive || undefined}` — never `data-active={isActive}`

## Form page layout rules (apps/admin)
Every create/edit form page must follow this exact structure — no exceptions:

```
<PageHeader title="..." description="..." actions={<back button>} />
<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
  <div className="space-y-6">
    <Card>
      <CardHeader><CardTitle>Section Name</CardTitle></CardHeader>
      <CardContent className="space-y-4">...fields...</CardContent>
    </Card>
    {/* repeat Card per logical section */}
    <div className="flex justify-end gap-2">
      <Button variant="outline">Cancel</Button>
      <Button type="submit">Save</Button>
    </div>
  </div>
  <div className="hidden lg:block">
    <div className="sticky top-20 space-y-4">
      {/* contextual sidebar cards */}
    </div>
  </div>
</div>
```

- `PageHeader` carries the page title, description, and back navigation
- Each logical group of fields lives in its own `Card`
- Two-column layout: form cards left, 280px sticky contextual sidebar right
- Sidebar is hidden on mobile (`hidden lg:block`), sticky at `top-20`
- Error messages: `<p className="text-sm text-destructive">{error}</p>`
- Success feedback: `<p className="text-sm text-muted-foreground">{feedback}</p>`
- `getToken` always imported from `@/lib/auth/token` — never copy-pasted inline

## Detail page layout rules (apps/admin)
Every detail/view page must follow this exact structure:

```
<PageHeader title="..." description="..." actions={<action buttons>} />
<div className="max-w-3xl space-y-6">
  <div className="grid grid-cols-2 gap-4">
    <Card>...</Card>
    <Card>...</Card>
  </div>
  <Card>...</Card>  {/* main content */}
  <Card>...</Card>  {/* tables, history, etc */}
</div>
```

- `max-w-3xl` for all detail pages
- Action buttons go in `PageHeader` actions — never inline beside the title
- Status badges go inside the first Card, not in the header

## Auth pattern (apps/admin)
- `(admin)/layout.tsx` is the single auth gate — do not add `if (!session) redirect()` in page files
- Page files call `getOperatorSession()` only when they need the session value downstream
- Use `session!` non-null assertion in page files — layout guarantees non-null
- Role checks use `session?.role` optional chaining

## Database rules
- `000_initial_schema.sql` is immutable — never modify it
- Schema changes: update `docs/DATABASE_SCHEMA.md` first, then write a new migration
- New migrations are numbered sequentially: `001_`, `002_`, etc.
- New tables follow the classification in `docs/abstractions/umkhandlu/10_DATABASE_IMPACT.md`

## Security rules
- Broadcasted moments are immutable — no edits, no deletes
- Authority lookup errors are always fail-open
- Webhook always returns HTTP 200 to Meta
- No hardcoded credentials, tokens, or secrets anywhere in code

## .env.example is sacred — never modify it
- `.env.example` is the single source of truth for all environment variables
- Never remove, redact, or replace any value in `.env.example`
- Never add placeholder comments in place of real values
- The `SUPABASE_ACCESS_TOKEN` value is stored in `.env.example` — never replace it with a placeholder
- If a tool or workflow would modify `.env.example`, stop and do not proceed

## Platform roadmap
```
Phase 16  Platform Independence          ✅ Complete
Phase 17  Moments Product Completion     ✅ Engineering Complete (ops pending)
Phase 18  Unami Control Centre                ⏳ Active (18A — cleanup pending)
Phase 19  Multi-node Federation
Phase 20  Commercial Intelligence
Phase 21  National Institutional Memory
```

Each application consumes `@unami/ui`, `@unami/shared`, `@unami/api`. None modify `packages/`.
