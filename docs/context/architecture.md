# Moments v2 — Architecture Context

## Project
Moments v2 is a WhatsApp-first community information platform built on Unami Platform Core.

## Repository
https://github.com/prooftv/unami-platform-core

## Stack
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Supabase Edge Functions (Deno), Hono where needed
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth (JWT, RS256) + `@supabase/ssr` for Next.js
- Messaging: Meta WhatsApp Cloud API
- Validation: Zod (shared between frontend and Edge Functions)
- State: Zustand (vanilla store, SSR-safe)
- Monorepo: Turborepo + pnpm

## Layer Boundaries
- `packages/ui` — presentation only. No Supabase, no auth, no business logic.
- `packages/shared` — enums, types, validators, constants. No React, no Next.js, no Supabase.
- `packages/api` — typed API clients. Frontend never calls Supabase directly. **Complete.**
- `supabase/functions/` — only layer that touches the database. **Complete.**
- `apps/admin` — Moments admin dashboard. Consumes `packages/ui` and `packages/api`. **Authentication is the current implementation phase.**
- `apps/web` — Moments public PWA. Not yet built.

## Data Flow
```
apps/admin or apps/web
  → packages/api (typed client)
    → supabase/functions/* (Edge Function)
      → Supabase DB (via service role, RLS enforced)
```

## API Boundary (Complete)
`packages/api` exposes a single `createApiClient()` factory:
```typescript
const api = createApiClient({ baseUrl, getToken });
api.moments.list(...)
api.broadcasts.trigger(...)
api.auth.me()
```
No application code calls Supabase directly. All data access flows through this boundary.

## Current Phase — Phase 6: Dashboard Architecture

Architecture document complete. See `docs/ADMIN_DASHBOARD_ARCHITECTURE.md`.

Next implementation phase: 6B — Dashboard Composition.

Key principle: The dashboard is the primary product. Modules are secondary workspaces that feed information back to the dashboard.
