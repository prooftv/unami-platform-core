# Amazon Q — Constitutional Session Prompt
# Unami Platform Core

Use this at the start of every new Amazon Q conversation in this repository.
Pin it. Do not skip the verification steps.

---

## Step 1 — Establish Repository Identity

You are working inside `unami-platform-core`.

This is NOT the Umkhandlu governance platform.
This is NOT a governance editor.
This is NOT a single application.

There are two completely separate repositories:

**Repository 1: `umkhandlu`**
- Governance Node
- Own deployment at `umkhandlu.unamifoundation.org`
- Own repository, own lifecycle, own operators
- Own governance workflows, own Sanity CMS, own optional Supabase
- Produces governance data
- Sovereign — Platform Core never administers it

**Repository 2: `unami-platform-core`** (this repository)
- Platform Core — shared foundation
- Contains Moments (`apps/admin`, `apps/web`)
- Contains the Unami Control Centre (`apps/umkhandlu`)
- Contains reusable platform packages (`packages/`)
- Consumes governance node APIs — never writes to them

These repositories must never be merged conceptually.
Full ecosystem diagram: `docs/context/ECOSYSTEM.md`

---

## Step 2 — Read Constitutional Documents (in this order)

Do not skip. Do not assume. Read each file.

1. `PROJECT_STATUS.md` — current phase, completed phases, remaining tasks
2. `docs/context/product-vision.md` — what each product is and why the build order matters
3. `docs/context/architecture.md` — layer boundaries, data flow, what is frozen
4. `docs/context/decisions.md` — decisions that must not be reversed
5. `.amazonq/rules/workspace-rules.md` — non-negotiable workspace rules
6. `docs/context/ECOSYSTEM.md` — canonical ecosystem diagram and ownership boundaries

For WhatsApp or broadcast work, also read:
7. `docs/context/MOMENTS_WHATSAPP.md`
8. `docs/context/MOMENTS_SESSION_PROMPT.md`

For Moments evolution (Phase 17D onward), also read:
9. `docs/context/MOMENTS_EVOLUTION.md`
10. `docs/context/COMMUNITY_RECORDS.md` (Phase 17D specifically)
11. `docs/abstractions/umkhandlu/11_MOMENTS_ADAPTATION.md`
12. `docs/abstractions/umkhandlu/09_PLATFORM_MAPPING.md`

For governance node or Control Centre work, also read:
9. `docs/context/GOVERNANCE_NODE_API.md`
10. `docs/context/GOVERNANCE_NODE_REGISTRY.md`
11. `docs/abstractions/umkhandlu/08_INTELLIGENCE_LAYER.md`
12. `docs/abstractions/umkhandlu/09_PLATFORM_MAPPING.md`

---

## Step 3 — Report Current State

Your first response must answer these questions from the documents. Do not write code first.

**Current phase:** (from PROJECT_STATUS.md)
**Completed phases:** (list)
**Active phase:** (name and definition of done)
**Remaining tasks in active phase:** (ordered list)
**Known blockers:** (ops gates, pending approvals, etc.)
**Architectural constraints active right now:** (what must not be touched)

---

## Step 4 — Verify Repository Structure

Confirm the following before any implementation:

```
packages/ui        @unami/ui — platform only, no domain knowledge, no Supabase
packages/shared    @unami/shared — platform primitives only, no React, no domain
packages/api       @unami/api — typed HTTP clients only

apps/admin         Moments admin — owns domain/moments/, shell, all admin modules
apps/web           Moments public PWA — no auth, no Supabase client, Sanity + API
apps/umkhandlu     Unami Control Centre — READ ONLY, no write operations, no CRUD screens

supabase/functions/   Only layer that touches the Moments Supabase database
supabase/migrations/  000 (immutable baseline) through current numbered migration
```

Confirm the deletion tests pass:
- Deleting `apps/umkhandlu` leaves `packages/` compiling without modification
- Deleting `apps/admin` + `apps/web` leaves `packages/` compiling without modification
- Deleting `packages/` leaves the governance node operating without interruption

---

## Constitutional Rules — These Override Everything

### Rule 1 — The Control Centre is read-only
`apps/umkhandlu` never creates, edits, or deletes:
- notices, records, evidence, participation, projects on any governance node
- It consumes intelligence. It does not govern.

### Rule 2 — Governance nodes are sovereign
The node owns its governance workflows, Sanity, storage, operators, and data.
The Control Centre never reaches into node databases.
Communication happens only through the documented Governance Node API.

### Rule 3 — No direct node database access
Never query node Sanity directly.
Never query node databases directly.
Never assume node storage technology.
Always consume `/api/intelligence/*` endpoints.

### Rule 4 — Deletion tests must always pass
Deleting any application must leave `packages/` intact.
Deleting the platform must leave governance nodes operating.

### Rule 5 — No duplication of governance node functionality
If a feature already belongs to the governance node, the Control Centre consumes it.
It does not duplicate it.

### Rule 6 — packages/ is frozen at v1.0
No new packages. No restructuring. No domain logic in `packages/shared`.
No application-specific components in `packages/ui`.
Fix bugs only.

### Rule 7 — Domain ownership is absolute
Moments domain lives in `apps/admin/src/domain/moments/` and `apps/web/src/domain/moments.ts`.
Future applications own their own domain.
Domain never leaks into `packages/`.

### Rule 8 — Edge Functions are the only database layer
No direct Supabase calls from Next.js application code.
All data flows through `packages/api` → Edge Functions → Supabase.

---

## Working Method

For every task:

1. Verify governing documents (Step 2 above)
2. Inspect existing implementation before proposing changes
3. Explain the proposed change and which layer it belongs to
4. Wait if architecture is unclear — ask before implementing
5. Implement only the agreed scope
6. Run typecheck / build verification
7. Report exactly what changed and why

Never silently broaden scope.
Never "improve" architecture without discussion.
Never introduce new abstractions not already defined in the constitutional documents.
Never rename concepts that are already defined.
Never scaffold new applications without an explicit phase definition.

---

## When Unsure

Stop. Ask. Do not invent.

The constitutional hierarchy when documents conflict:
1. `product-vision.md` — what the product exists to become
2. `architecture.md` — how that vision is realised
3. `decisions.md` — immutable architectural decisions
4. `PROJECT_STATUS.md` — current execution plan only

`PROJECT_STATUS.md` cannot redefine the product. It tracks implementation.
When phase descriptions contradict higher documents, the higher documents win.

---

## Current Goal (read from PROJECT_STATUS.md — do not assume)

Read `PROJECT_STATUS.md` now and report the current phase before proceeding.
