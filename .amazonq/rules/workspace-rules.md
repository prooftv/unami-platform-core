# Amazon Q — Workspace Rules
# Auto-loaded on every session. These rules are non-negotiable.

## Workspace
- All work happens in `/home/ec2-user/unami-platform-core`
- All pushes go to `origin` → `https://github.com/prooftv/unami-platform-core`
- Branch: `main`
- Never touch `/workspaces/moments-v2` — reference only

## MCP Context Agents
Each project has a dedicated MCP server registered in Q CLI (`~/.aws/amazonq/mcp.json`).
At the start of every session, call `get_project_context` on the relevant agent.

| Agent | Project | Server |
|---|---|---|
| `uncip-agent` | apps/uncip — UNCIP v2 child safety platform | `tools/mcp-uncip/server.mjs` |
| `moments-agent` | apps/admin + apps/web — Moments platform | `tools/mcp-moments/server.mjs` |
| `umkhandlu-agent` | apps/umkhandlu — Unami Control Centre | `tools/mcp-umkhandlu/server.mjs` |

All context state is persisted in each server's `context.json`. Do not move the servers.

## Before writing any code
1. Read `PROJECT_STATUS.md` — current phase, last commit, what is done and what is next
2. Read `docs/context/PLATFORM.md` — what Platform Core is, boundaries, application/platform relationship
3. Read `docs/context/ARCHITECTURE.md` — layer boundaries, data flow, current technical structure
4. Read `docs/context/decisions.md` — decisions that must not be reversed
5. Read `docs/context/ECOSYSTEM.md` — canonical ecosystem diagram, repository boundaries, ownership rules
6. Check `docs/DATABASE_SCHEMA.md` before any schema changes
7. Check `docs/context/PLATFORM_DASHBOARD_SHELL.md` before scaffolding any new dashboard application
8. Check `docs/context/moments/CONTENT_OWNERSHIP.md` before any content or CMS decisions
9. Check `docs/context/moments/MOMENTS_EVOLUTION.md` before any Phase 17D–17H implementation
10. Check `docs/context/moments/COMMUNITY_RECORDS.md` before any Phase 17D implementation
11. Check `docs/context/moments/COMMERCIAL_DOMAIN.md` before any commercial, campaign, or project decisions

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
Phase 17D — Community Records. ✅ Complete as of f22c002.

All six implementation steps complete:
1. ✅ DATABASE_SCHEMA.md updated
2. ✅ Migration 008 — moment_id column, index, anon RLS
3. ✅ Edge Function — `supabase/functions/records/index.ts` rewritten (structural validation, public GET, immutability)
4. ✅ API client — `packages/api/src/clients/records.ts` — PlatformRecord, createPublicRecordsClient
5. ✅ Admin UI — RecordsPanel on moment detail, create form, status transitions
6. ✅ Public PWA — Community Timeline on moment detail, record detail page

Phase 17 is engineering-complete. Phase 18 (Unami Control Centre) is also complete (18A–18G + settings + shell parity).

Next: update PROJECT_STATUS.md to reflect Phase 17D completion, then assess Phase 19 readiness.

## Phase 17 — Moments Product Completion ✅ Engineering Complete
- **17A** ✅ Public PWA Foundation
- **17B** ✅ Content Ownership Constitution
- **17C** ✅ Sanity Editorial Layer
- **17D** ✅ Community Records — complete as of f22c002
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
- **D-036: Node sovereignty** — the Control Centre never edits, mutates, creates, or administers node content
- All write operations remain within the originating node — no exceptions, no proxied mutations
- Do not build CRUD screens for records, notices, evidence, or participation inside `apps/umkhandlu`
- The abstraction pack defines shared platform concepts so nodes speak the same language — it does not require CRUD UI in Platform Core
- Platform tables (`records`, `notices`) already added in 18A — they define the shared data model, not a UI to edit them
- The node registry model defines which governance nodes the Control Centre connects to
- New typed clients in `packages/api` are read-only intelligence clients — no create/update operations from the Control Centre
- All intelligence concepts trace back to `docs/abstractions/umkhandlu/08_INTELLIGENCE_LAYER.md`
- The node API contract is defined in `docs/context/GOVERNANCE_NODE_API.md` — read before Phase 18B
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
