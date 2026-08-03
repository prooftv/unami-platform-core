# Amazon Q — Workspace Rules
# Auto-loaded on every session. These rules are non-negotiable.

## Workspace
- All work happens in `/workspaces/unami-platform-core`
- All pushes go to `origin` → `https://github.com/prooftv/unami-platform-core`
- Branch: `main`
- Never touch `/workspaces/moments-v2` — reference only

## Before writing any code
1. Read `PROJECT_STATUS.md` for current phase and next task
2. Read `docs/context/architecture.md` for layer boundaries and known issues
3. Read `docs/context/security-model.md` for auth and RBAC rules
4. Read `docs/context/decisions.md` for all architectural decisions
5. Check `docs/DATABASE_SCHEMA.md` before any schema changes

## Platform is frozen at v1.0
- Do not restructure `packages/`
- Do not add new packages unless a concrete product requirement demands it
- Do not add domain logic to `packages/shared` — it contains only platform primitives
- Do not add application-specific components to `packages/ui` — it contains only design system primitives
- Do not redesign the admin shell — it belongs to Moments, not the platform
- Do not create new abstraction layers
- Fix bugs only — no speculative improvements to infrastructure

## Current priority
Phase 17A — Public PWA Completion.
The platform is v1.0 and frozen. The next objective is to complete the public-facing Moments
product. Build `apps/web` into the primary community experience using Supabase for operational
data now, Sanity CMS for editorial content in Phase 17B/17C.
Do not modify platform packages, Edge Functions, or `apps/admin` unless a bug requires it.
WhatsApp production integration is intentionally deferred to Phase 17D — after the public product exists.
Do not scaffold other applications (Umkhandlu, Spree, BeatsChain, etc.) — that is future work.

## Sanity CMS rules (Phase 17B onward)
- Sanity is added to `apps/web` only — never `packages/`, `apps/admin`, or Edge Functions
- Sanity owns editorial content: homepage, stories, sponsor pages, help, about, privacy
- Supabase owns operational data: broadcasts, subscribers, moderation, analytics
- `apps/web` queries Sanity directly via `@sanity/client` — no Edge Function proxy
- Sanity Studio is a separate deployment — not inside this monorepo
- ISR + on-demand revalidation for all Sanity-driven pages
- The moment feed, detail, region, and category pages remain Supabase-driven — unchanged

## Layer rules
- `packages/ui` — no Supabase, no auth, no domain knowledge, no app-specific components
- `packages/shared` — no React, no Next.js, no Supabase, no Moments-specific logic
- `packages/api` — typed HTTP clients only, domain types inlined as string literals
- `supabase/functions/` — only layer that touches the database
- `apps/admin` — owns Moments domain (`src/domain/moments/`), shell, and all admin modules
- `apps/web` — owns public routing, no auth, no Supabase client

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
<div className="max-w-2xl space-y-6">
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
```

- `PageHeader` carries the page title, description, and back navigation — never inline `<h1>` or `<ArrowLeft>` beside a heading
- Each logical group of fields lives in its own `Card` — never bare `<div>` sections with `<p className="text-sm font-medium">` labels
- `max-w-2xl` for all forms — never `max-w-xl` or `max-w-lg`
- Back navigation goes in `PageHeader` actions — never beside the title as a sibling element
- Error messages: `<p className="text-sm text-destructive">{error}</p>` — never raw colour classes like `text-red-500`
- Success feedback: `<p className="text-sm text-muted-foreground">{feedback}</p>` — never `text-green-600` or any raw colour
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

- `max-w-3xl` for all detail pages — never `max-w-2xl` or unconstrained
- Action buttons (Edit, Broadcast, Cancel, Approve) go in `PageHeader` actions — never inline beside the title
- Status badges go inside the first Card, not in the header
- Feedback/error messages appear directly below `PageHeader`, above the card grid

## Auth pattern (apps/admin)
- `(admin)/layout.tsx` is the single auth gate — do not add `if (!session) redirect()` in page files
- Page files call `getOperatorSession()` only when they need the session value downstream
- Use `session!` non-null assertion in page files — layout guarantees non-null
- Role checks use `session?.role` optional chaining

## Database rules
- `000_initial_schema.sql` is immutable — never modify it
- Schema changes: update `docs/DATABASE_SCHEMA.md` first, then write a new migration
- New migrations are numbered sequentially: `001_`, `002_`, etc.

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
