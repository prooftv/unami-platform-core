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

## Platform is feature-frozen
- Do not restructure `packages/`
- Do not add new packages unless a concrete product requirement demands it
- Do not redesign the admin shell — it is the permanent shell
- Do not create new abstraction layers
- Fix bugs only — no speculative improvements to infrastructure

## Current priority
Phase 16 — Platform Expansion.
Phase 15 (Automation & Production) is complete.
Phase 16 work: rename `@moments/*` → `@unami/*`, extract Moments domain from `packages/shared`, scaffold second application.

## Layer rules
- `packages/ui` — no Supabase, no auth, no app-specific logic
- `packages/shared` — no React, no Next.js, no Supabase
- `supabase/functions/` — only layer that touches the database
- `apps/admin` — consume packages, never reimplement platform capabilities
- `apps/web` — not yet built, Phase 14

## Component rules (apps/admin)
- Use shadcn primitives from `src/components/ui/` directly
- Retained from `@moments/ui`: `AnalyticsCard`, `LineChart`, `BarChart`, `PieChart`, `AreaChart`
- Retired (do not use): `PageHeader`, `DataTable`, `KPIGrid`, `MetricCard`, `ActivityFeed`, `FormSection`, `FieldGroup`, `SubmitBar`, `ContentLayout`, `StatusBadge`, `QuickActions`, `TableToolbar`, `TablePagination`, `FilterSelect`
- Badge variants: `default | secondary | destructive | outline` only — no `warning`, `success`, `info`
- `data-active={isActive || undefined}` — never `data-active={isActive}`

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
