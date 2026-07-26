# Unami Platform Core Architecture

This document defines the engineering boundaries of this repository.

The README explains the vision. This document enforces it.

Every package, every import, every feature placement decision must be consistent with the rules defined here. Architectural drift — the slow accumulation of misplaced logic — is the primary cause of platform degradation. This document exists to make drift visible and preventable.

---

## Layered Architecture

This repository follows a strict layered architecture. Dependencies flow downward only. No layer imports from a layer above it.

```
Application Layer       apps/*
        ↓
API Layer               packages/api
        ↓
Platform Layer          packages/platform
        ↓
Domain Layer            packages/domain + packages/shared
        ↓
Persistence Layer       packages/db
```

The UI layer (`packages/ui`) is horizontal — it is pure presentation and can be consumed by the Application Layer. It does not participate in the data flow chain. It renders. It does not decide.

```
packages/ui  →  consumed by  →  apps/*
```

---

## Dependency Rules

The following matrix defines what each package is permitted to import. Violations are architectural defects, not style preferences.

| Package | Can Import | Cannot Import |
|---|---|---|
| `packages/ui` | React, TypeScript, Tailwind, shadcn/ui primitives, UI utilities, `packages/shared` types | Supabase, API clients, authentication, domain business rules, application modules, any app-specific concepts |
| `packages/platform` | `packages/shared`, configuration libraries, authentication libraries, API infrastructure, domain-independent helpers | Application features, UI components, business workflows, app-specific domain logic |
| `packages/domain` | TypeScript, Zod, pure utility libraries, `packages/shared` | React, Next.js, Supabase clients, UI components, API calls, browser APIs |
| `packages/api` | `packages/platform` API client, `packages/domain` DTOs and types, `packages/shared` | React components, direct database queries, UI logic, Supabase admin clients |
| `packages/db` | Database libraries, generated Supabase types, repository utilities | React, UI components, application routing, presentation logic, business workflows |
| `packages/shared` | TypeScript, Zod | Everything else — this package has zero runtime dependencies on the platform |
| `apps/*` | All packages | Nothing — apps compose, they do not reimplement platform capabilities |

### Critical rules for `packages/ui`

This package is the most likely to accumulate violations over time. The following are explicitly forbidden:

- `import { createClient } from '@supabase/supabase-js'` — never
- `import { useSession } from '...'` — authentication does not belong here
- Any reference to `moment`, `beat`, `track`, `broadcast`, `council`, or any product-specific noun
- Any component that only makes sense in one application

If a component references a specific application's concepts, it belongs in `apps/{application}`, not here.

---

## Data Flow Rules

The approved path from user interaction to database and back:

```
User Interaction
        ↓
UI Component          (packages/ui or apps/{app}/components)
        ↓
Application Module    (apps/{app} — server action, route handler, or page)
        ↓
Typed API Client      (packages/api)
        ↓
Backend Function      (Supabase Edge Function or Hono route)
        ↓
Repository            (packages/db)
        ↓
Database              (Supabase)
```

**Violations of this flow:**

- A component that directly calls `supabase.from(...)` — not permitted
- A component that contains a multi-step business workflow — not permitted
- A frontend-only Zod validation used as the sole guard for a critical business rule — not permitted. Frontend validation is UX. Backend validation is enforcement.
- A server action that bypasses `packages/api` and calls the database directly from `apps/` — not permitted

---

## Domain Separation Rules

The same real-world concept has different representations at different layers. These representations are intentionally distinct and must not be conflated.

**Example: a Moment (Moments application)**

| Layer | Type | Purpose |
|---|---|---|
| Database Model | `MomentRow` | Raw Supabase table record, generated type |
| API DTO | `MomentResponse` | Shaped response from backend function |
| UI Model | `MomentCardProps` | Display properties for a card component |
| Form Model | `CreateMomentFormValues` | Controlled form field values |

**Rules:**

- Never pass a `MomentRow` directly into a React component
- Never use a form model as an API payload without explicit mapping
- Never let database column names leak into UI prop names
- Mapping between layers is intentional and explicit — not implicit

This separation is what allows the database schema to change without breaking the UI, and the UI to change without breaking the API contract.

---

## Backend Rules

Supabase Edge Functions own business operations. The backend is not a thin database proxy — it is where business rules are enforced.

**Function design principles:**

- Small — one function owns one domain
- Domain-focused — a function knows its domain deeply and nothing else
- Independently deployable — changing one function does not require redeploying others

**Planned function boundaries:**

| Function | Owns |
|---|---|
| `moments` | Moment creation, editing, publishing workflows |
| `broadcasts` | Message delivery, subscriber targeting, delivery tracking |
| `analytics` | Reporting calculations, aggregations, metrics |
| `auth` | Authentication flows, session management, token handling |
| `media` | File uploads, processing, storage management |

**Functions must not:**

- Return HTML or render UI
- Import React
- Contain presentation logic
- Know about routing or navigation

---

## Component Rules

Components have a clear ownership boundary.

**Global components — belong in `packages/ui`:**

These are application-agnostic. Any product in the ecosystem can use them unchanged.

- Sidebar and navigation shell
- Dashboard layout wrappers
- Data tables
- Card primitives
- Form field components
- Chart wrappers
- Modal and dialog primitives
- Toast and notification primitives
- Theme and preference controls

**Application components — belong in `apps/{application}`:**

These are product-specific. They compose global components with application context.

- `MomentComposer` — Moments
- `BeatUploader` — BeatsChain
- `TraditionalCouncilProfile` — Umkhandlu
- `ProjectMilestoneTracker` — ITPMS
- `ProductListingForm` — Ecommerce

**The test:**

> Can another application use this component unchanged, with no modifications?

If yes — it belongs in `packages/ui`.
If no — it belongs in the application.

When in doubt, build it in the application first. Extract to `packages/ui` only when a second application needs it.

---

## Naming Conventions

**Package names:**

| Package | Name |
|---|---|
| UI system | `@unami/ui` |
| Platform infrastructure | `@unami/platform` |
| API clients | `@unami/api` |
| Domain models | `@unami/domain` |
| Database layer | `@unami/db` |
| Shared primitives | `@unami/shared` |

**Application names:**

| Application | Name |
|---|---|
| Moments v2 | `@unami/moments` |
| BeatsChain | `@unami/beatschain` |
| Umkhandlu | `@unami/umkhandlu` |
| ITPMS | `@unami/itpms` |
| Schools Portal | `@unami/schools` |
| Ecommerce | `@unami/ecommerce` |

**File naming:**

- Components: `PascalCase.tsx`
- Utilities and helpers: `kebab-case.ts`
- Types and interfaces: `PascalCase`, exported from `types.ts` or co-located
- Zod schemas: suffix with `Schema` — e.g. `CreateMomentSchema`
- Store files: suffix with `-store.ts` — e.g. `preferences-store.ts`
- Provider files: suffix with `-provider.tsx`

---

## AI Agent Rules

This section is written directly for AI coding assistants operating inside this repository.

You have access to the full codebase. That access comes with responsibility. The following rules are mandatory before generating any code.

**Before writing a single line:**

1. **Identify the correct layer.** Is this UI, platform, domain, API, or persistence? Place it in the right package. A wrong placement that compiles is still a defect.

2. **Check existing packages.** The component, utility, or type you are about to create may already exist. Read before writing.

3. **Do not create duplicates.** Two implementations of the same concept in different packages is a platform failure.

4. **Do not move business logic into UI.** If a component is making decisions about data validity, workflow state, or business rules — stop. That logic belongs server-side.

5. **Do not add dependencies without justification.** Every new dependency in a shared package is inherited by every application. The cost is not local.

6. **Do not solve an application problem inside the platform.** If only Moments needs it, it belongs in `apps/moments`. Extract to platform only when a second application needs the same thing.

7. **Do not reference application-specific concepts in shared packages.** `packages/ui` does not know what a Moment is. `packages/platform` does not know what a Beat is.

8. **Ask before changing architecture.** If a task requires moving files between packages, changing package boundaries, or adding a new package — confirm before executing. These decisions have downstream consequences.

9. **Preserve backwards compatibility.** Shared packages are consumed by multiple applications. A breaking change in `packages/ui` breaks every application simultaneously.

10. **The README and this document are authoritative.** If a user instruction conflicts with the architecture defined here, flag the conflict before proceeding.

---

## Current Architecture Status

**Completed:**

| Phase | Status | Deliverable |
|---|---|---|
| Phase 1 | ✅ Complete | Turborepo monorepo foundation, workspace config, TypeScript baseline |
| Phase 2 | ✅ Complete | `packages/shared` — enums, constants, types, validators, helpers |

**In Progress:**

| Phase | Status | Deliverable |
|---|---|---|
| Phase 3 | 🔄 Active | `packages/ui` foundation migration from `dashboard-platform-export` |

**Phase 3 completed so far:**

- `packages/ui/src/theme/` — theme engine, layout types, preference config, DOM appliers
- `packages/ui/src/fonts/` — font registry, 17 fonts, font variables
- `packages/ui/src/stores/` — Zustand vanilla preferences store (SSR-safe)
- `packages/ui/src/providers/` — `PreferencesStoreProvider`, `usePreferencesStore`
- `packages/ui/src/styles/presets/` — brutalist, soft-pop, tangerine CSS presets

**Phase 3 remaining:**

- `packages/ui/src/shell/` — dashboard shell, sidebar, navigation
- `packages/ui/src/components/` — reusable component library

**Planned:**

| Phase | Deliverable |
|---|---|
| Phase 4 | `packages/platform` — authentication and permissions infrastructure |
| Phase 5 | `packages/api` — typed API client layer |
| Phase 6 | `packages/db` — Supabase persistence abstractions |

---

## Future Platform Expansion

As new products are onboarded, the platform grows — but the boundaries do not move.

| Application | Domain | Status |
|---|---|---|
| Moments v2 | Community communication, digital notice boards | First consumer — active |
| BeatsChain | Music creator economy, ISRC, licensing, marketplace | Planned |
| Umkhandlu | Traditional authority governance, community coordination | Planned |
| ITPMS | Municipal ICT project management | Planned |
| Schools Portal | Educational institution infrastructure | Planned |
| Ecommerce | Commercial storefronts, merchant operations | Planned |

Each new application:
1. Consumes `packages/ui`, `packages/platform`, `packages/api`, `packages/shared`
2. Defines its own domain package under `packages/domain/{app}` or `apps/{app}/domain`
3. Owns its own Supabase Edge Functions
4. Does not modify shared packages for application-specific reasons

The foundation remains neutral. Applications bring identity. The platform brings capability.
