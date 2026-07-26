# Moments v2 — Architecture Context

## Project
Moments v2 is a WhatsApp-first community information platform built on Unami Platform Core.

## Repository
https://github.com/prooftv/unami-platform-core

## Stack
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Supabase Edge Functions (Deno), Hono where needed
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth (JWT, RS256)
- Messaging: Meta WhatsApp Cloud API
- Validation: Zod (shared between frontend and Edge Functions)
- State: Zustand (vanilla store, SSR-safe)
- Monorepo: Turborepo + pnpm

## Layer Boundaries
- `packages/ui` — presentation only. No Supabase, no auth, no business logic.
- `packages/shared` — enums, types, validators, constants. No React, no Next.js, no Supabase.
- `packages/api` — typed API clients. Frontend never calls Supabase directly.
- `supabase/functions/` — only layer that touches the database.
- `apps/admin` — Moments admin dashboard, consumes packages/ui and packages/api.
- `apps/web` — Moments public PWA.

## Data Flow
```
apps/admin or apps/web
  → packages/api (typed client)
    → supabase/functions/* (Edge Function)
      → Supabase DB (via service role, RLS enforced)
```

## Current Phase
Phase 4 — Backend. Edge Functions written. Next: packages/api, then admin authentication.
