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

## What this repository is now
Unami Platform Core v1.0 is complete. This is application validation work — not platform engineering.
Moments is the first product. It validates the platform end to end.
The Umkhandlu Intelligence Dashboard (Phase 18) is the second. It validates multi-application federation.
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
Phase 17B — Content Ownership Constitution.

The deliverable is `docs/context/CONTENT_OWNERSHIP.md` — a constitutional document that freezes
the boundary between Sanity (editorial) and Supabase (operational) before any CMS code is written.

Do not write Sanity schemas, create a Sanity project, or add `@sanity/client` until
`CONTENT_OWNERSHIP.md` is complete and committed. That is Phase 17C.

Do not modify platform packages, Edge Functions, or `apps/admin` unless a bug requires it.
Do not scaffold other applications — that is post-Phase 17J work.

## Phase 17 — Moments Product Completion
Ten sub-phases. Each builds on the last. Do not skip ahead.

- **17A** ✅ Public PWA Foundation — shell, homepage, all pages, navigation, theme
- **17B** ⏳ Content Ownership Constitution — `CONTENT_OWNERSHIP.md` frozen before any CMS code
- **17C** Sanity Editorial Layer — schemas, Studio, GROQ queries, `@sanity/client` in `apps/web`
- **17D** Governance Adaptation — participation, evidence, development moments (from abstraction pack)
- **17E** Public Participation Engine — consent-gated, webhook-delivered, never stored
- **17F** Evidence Layer — media evidence, weather context, verification
- **17G** Commercial Layer — full project tracking, certified deliverables
- **17H** Intelligence Foundation — aggregations, KPIs, derived metrics (no dashboard yet)
- **17I** WhatsApp Integration — end-to-end delivery, last
- **17J** Production Validation and Launch — Moments v2 shipped

## Phase 18 — Umkhandlu Intelligence Dashboard
Begins only after Phase 17J is complete.
The first application built on top of the mature platform.
Consumes multiple Umkhandlu nodes, Moments, and future applications.
Sub-phases defined in `docs/abstractions/umkhandlu/12_IMPLEMENTATION_ROADMAP.md`.

## Content ownership rules (Phase 17B — constitutional)
The boundary between Sanity and Supabase is defined in `CONTENT_OWNERSHIP.md`.
Until that document exists, no content architecture decisions are made in code.

Summary of the boundary (detail in `CONTENT_OWNERSHIP.md`):
- **Sanity** — editorial, curated, presentation: homepage, stories, sponsor pages, static pages, SEO
- **Supabase** — operational, records, evidence: moments, participation, evidence, analytics, intelligence
- **Edge Functions** — orchestration: all database access, business rules, webhook routing
- **apps/web** — composition: editorial + operational in one Next.js application

## Sanity CMS rules (Phase 17C onward)
- Sanity is added to `apps/web` only — never `packages/`, `apps/admin`, or Edge Functions
- Sanity owns editorial content only — as defined in `CONTENT_OWNERSHIP.md`
- Supabase owns all operational data — moments, participation, evidence, analytics
- `apps/web` queries Sanity directly via `@sanity/client` — no Edge Function proxy
- Sanity Studio is a separate deployment — not inside this monorepo
- ISR + on-demand revalidation for all Sanity-driven pages
- Moment feed, detail, region, and category pages remain Supabase-driven — never move to Sanity
- Sanity client lives in `apps/web/src/lib/sanity/client.ts`
- GROQ queries live in `apps/web/src/lib/sanity/queries.ts`

## Governance adaptation rules (Phase 17D onward)
- All governance concepts trace back to `docs/abstractions/umkhandlu/`
- The platform mapping reference is `09_PLATFORM_MAPPING.md`
- New capabilities are additive — they do not change existing broadcasts or moments
- Domain vocabulary follows `11_MOMENTS_ADAPTATION.md` — governance concepts adapted, not imported
- New database tables follow `10_DATABASE_IMPACT.md` classification

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
Phase 17  Moments Product Completion     ⏳ Active (17B)
Phase 18  Umkhandlu Intelligence Dashboard  (after 17J)
Phase 19  Multi-node Federation
Phase 20  Commercial Intelligence
Phase 21  National Institutional Memory
```

No new platform application begins until Phase 17J (Moments Launch) is complete.
Each application consumes `@unami/ui`, `@unami/shared`, `@unami/api`. None modify `packages/`.
