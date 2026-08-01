# Key Decisions

Decisions that must not be reversed without explicit instruction.

---

## D-001: Single baseline migration
`supabase/migrations/000_initial_schema.sql` is the baseline.
Never modify it. All changes go in new numbered migration files (`001_`, `002_`, etc.).

## D-002: No custom auth tables
Supabase Auth handles all sessions. No custom auth tables.
`admin_roles` maps Supabase Auth user IDs to application roles only.

## D-003: Edge Functions are the only DB layer
No direct Supabase calls from Next.js server components or API routes.
All data access flows through `supabase/functions/*` → `packages/api` → apps.

## D-004: packages/ui has no application knowledge
No Moments-specific terminology, no Supabase imports, no auth logic.
Must be equally usable by Moments, Spree Operations, BeatsChain, Umkhandlu.

## D-005: Fail-open authority system
Authority lookup errors never block WhatsApp message processing.
All authority callers handle null gracefully.

## D-006: Broadcasted moments are immutable
Once status = 'broadcasted', no edits and no deletes.
Enforced in Edge Functions, not just the database.

## D-007: Platform foundation is feature-frozen
No restructuring of `packages/`, no new abstraction layers, no new packages
unless a concrete product requirement demands it.
Infrastructure work is complete. All new work is product workflow completion.

## D-008: Workspace and remote
All work in `/workspaces/unami-platform-core`.
All pushes to `origin` → `https://github.com/prooftv/unami-platform-core`.
The `moments-v2` directory is reference only — never edit it.

## D-009: Package scope rename deferred
Current scope is `@moments/*`. Will rename to `@unami/*` before second application onboards.
Do not rename during active Moments development.

## D-010: WhatsApp always returns 200
The webhook Edge Function always returns HTTP 200 to Meta.
Errors are logged to `error_logs` internally. Never surfaced to Meta.

## D-011: Admin shell is the permanent shell
The shadcn/ui dashboard (arhamkhnz/next-shadcn-admin-dashboard) is the canonical admin shell.
No further shell redesigns. Moments adapts to the shell — the shell does not adapt to Moments.
`(admin)/layout.tsx` is the single auth gate and shell owner for all admin routes.

## D-012: Component policy — shadcn primitives directly
Admin modules use shadcn components from `src/components/ui/` directly.
Wrapper components (`PageHeader`, `DataTable`, `KPIGrid`, `MetricCard`, `ActivityFeed`,
`FormSection`, `ContentLayout`, `StatusBadge`, `QuickActions`) are retired.
`@moments/ui` chart components (`AnalyticsCard`, `LineChart`, `BarChart`, `PieChart`, `AreaChart`)
are retained as legitimate shared assets.

## D-013: Product phases over technical fixes
From Phase 10 onward, work is organised by product workflow, not by technical component.
Each phase must answer: "Which user workflow becomes fully usable?"
Phases: 10 Moments Workflow → 11 Community → 12 Commercial → 13 Hardening → 14 Public PWA → 15 Automation → 16 Expansion.

## D-014: Badge variants — shadcn only
shadcn `Badge` accepts only: `default | secondary | destructive | outline | ghost | link`.
Custom variants `warning`, `success`, `info` from `@moments/ui` do not exist.
Map: `warning` → `secondary`, `success` → `default`, `info` → `outline`.

## D-015: Sidebar active state — attribute not boolean
`data-active={isActive || undefined}` — never `data-active={isActive}`.
When false, the attribute must be omitted entirely. Tailwind v4 `data-active:` matches
any element with the attribute present regardless of value, causing all items to appear active.
