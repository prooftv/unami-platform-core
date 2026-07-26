# Amazon Q — Workspace Rules
# Auto-loaded on every session. These rules are non-negotiable.

## Workspace
- All work happens in `/workspaces/unami-platform-core`
- All pushes go to `origin` → `https://github.com/prooftv/unami-platform-core`
- Branch: `main`
- Never touch `/workspaces/moments-v2` — reference only

## Platform foundation is frozen
- Do not restructure `packages/`
- Do not add new packages unless a concrete application requirement demands it
- Do not redesign the theme engine, shell, or component library
- Fix bugs only — no speculative improvements

## Before writing any code
1. Read `PROJECT_STATUS.md` for current phase and next task
2. Read `docs/context/architecture.md` for layer boundaries
3. Read `docs/context/security-model.md` for auth and RBAC rules
4. Check `docs/DATABASE_SCHEMA.md` before any schema changes

## Layer rules
- `packages/ui` — no Supabase, no auth, no app-specific logic
- `packages/shared` — no React, no Next.js, no Supabase
- `supabase/functions/` — only layer that touches the database
- `apps/*` — consume packages, never reimplement platform capabilities

## Database rules
- `000_initial_schema.sql` is immutable — never modify it
- Schema changes: update `docs/DATABASE_SCHEMA.md` first, then write a new migration
- New migrations are numbered sequentially: `001_`, `002_`, etc.

## Security rules
- Broadcasted moments are immutable — no edits, no deletes
- Authority lookup errors are always fail-open
- Webhook always returns HTTP 200 to Meta
- No hardcoded credentials, tokens, or secrets anywhere in code
