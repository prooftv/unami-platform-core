# Project Status

Living engineering snapshot. Updated at every phase transition.
Read this first when resuming work or starting a new session.

---

## Current State

| Field | Value |
|---|---|
| Version | `v0.1.0-platform-foundation` |
| Phase | Phase 4 — Backend |
| Branch | `phase-2-complete` |
| Workspace | `/workspaces/unami-platform-core` |
| Remote | `origin` → `https://github.com/prooftv/unami-platform-core` |
| Build | ✅ Passing (`pnpm turbo build` — 2 successful) |
| Typecheck | ✅ Passing |

---

## Completed Milestones

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Turborepo monorepo, workspace config, TypeScript baseline | ✅ Done |
| Phase 2 | `packages/shared` — enums, types, validators, constants, helpers | ✅ Done |
| Phase 3 | `packages/ui` — theme engine, shell, navigation, component library | ✅ Done |
| Phase 3.5 | Dependency audit, typecheck fixes, production build verified | ✅ Done |
| Phase 4a | `docs/DATABASE_SCHEMA.md` — full schema specification | ✅ Done |
| Phase 4b | `supabase/migrations/000_initial_schema.sql` — initial migration | ✅ Done |
| Phase 4c | `docs/SCHEMA_MAPPING.md` — type → table → function → module map | ✅ Done |

---

## Next Task

**Write Edge Functions.**

Start with these three in order:

1. `supabase/functions/moments/index.ts` — CRUD for moments (create, list, get, update, broadcast)
2. `supabase/functions/webhook/index.ts` — Meta WhatsApp webhook receiver
3. `supabase/functions/broadcast/index.ts` — broadcast execution engine

Each function must:
- Validate JWT via Supabase Auth (except webhook — uses HMAC)
- Check `admin_roles` for role-based access
- Validate input with Zod schemas from `packages/shared/src/validators`
- Return typed JSON responses
- Log errors to `error_logs`
- Log admin actions to `audit_logs`

---

## Repository Layout

```
unami-platform-core/
├── apps/
│   ├── admin/          Next.js — Moments admin dashboard (UI showcase currently)
│   └── web/            Next.js — Moments public PWA (not yet built)
├── packages/
│   ├── ui/             @unami/ui — reusable component library (complete)
│   ├── shared/         @unami/shared — enums, types, validators, constants (complete)
│   └── api/            @unami/api — typed API clients (not yet built)
├── supabase/
│   ├── functions/      Edge Functions (not yet written)
│   └── migrations/
│       └── 000_initial_schema.sql   ← baseline, do not modify
├── docs/
│   ├── DATABASE_SCHEMA.md           ← source of truth for schema
│   ├── SCHEMA_MAPPING.md            ← type → table → function → module
│   └── reference/                   ← historical only, never import from here
├── README.md
├── ARCHITECTURE.md
└── CHANGELOG.md
```

---

## Package Naming Note

Current package scope is `@moments/*`. Before v1.0, rename to `@unami/*` to match the repository.
This is deferred — do not interrupt active development for this.

```
@moments/ui     → @unami/ui
@moments/shared → @unami/shared
@moments/api    → @unami/api
```

---

## Deferred Work

| Item | Reason deferred |
|---|---|
| Rename `@moments/*` → `@unami/*` | Not blocking. Do before second application onboards. |
| `packages/api` typed client layer | Needs Edge Functions to exist first |
| Authentication infrastructure | Needs Edge Functions to exist first |
| Moments admin modules | Needs auth + API layer first |
| Moments public PWA | After admin is working |
| n8n workflows | After Edge Functions are stable |
| WhatsApp integration | After webhook Edge Function is complete |
| Spree Operations Dashboard | After Moments is working end-to-end |

---

## Known Technical Debt

| Item | Location | Notes |
|---|---|---|
| Moments-domain logic in shared package | `packages/shared/src/` | Correct for now. Refactor to `apps/moments/domain` when second app onboards. |
| UI showcase in admin app | `apps/admin/src/app/ui/` | Replace with real Moments admin modules when auth is ready. |
| `packages/api` is empty | `packages/api/` | Scaffold after first Edge Function is written. |

---

## Definition of Done — Phase 4 (Backend)

- [ ] `moments` Edge Function — CRUD + broadcast
- [ ] `webhook` Edge Function — Meta WhatsApp receiver + HMAC verification
- [ ] `broadcast` Edge Function — batch broadcast engine
- [ ] `packages/api` — typed clients for all Edge Functions
- [ ] Authentication working in `apps/admin`
- [ ] At least one real admin module (Moments list + create)

---

## Rules — Do Not Violate

1. All work happens in `/workspaces/unami-platform-core`, pushed to `origin`.
2. `/workspaces/moments-v2` is reference only. Never edit it.
3. `supabase/migrations/000_initial_schema.sql` is the baseline. Never modify it. Write new numbered migrations for changes.
4. `docs/DATABASE_SCHEMA.md` is the schema source of truth. Change the doc first, then write a migration.
5. `packages/ui` has no Supabase imports, no auth, no application-specific logic.
6. `packages/shared` has no React, no Next.js, no Supabase.
7. Edge Functions are the only code that touches the database directly.
8. Frontend communicates through `packages/api` typed clients only.
