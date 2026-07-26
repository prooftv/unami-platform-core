# Working Agreement
## Dashboard Platform — Ecommerce Operations

---

This document defines rules that must never be violated.
It is not a suggestion. It is the constitution of this repository.

Read this before every session.

---

## Repository

This repository is a pnpm Turborepo.

```
packages/ui          → shared UI platform (domain-agnostic)
packages/types       → shared TypeScript interfaces
packages/api-client  → shared API clients
apps/operations      → ecommerce operations app (consumes packages)
```

---

## Architecture Rules

- Never place business logic inside `packages/ui`
- Never place API code inside `packages/ui`
- Never create ecommerce-specific components inside `packages/ui`
- Never import app code into packages
- If a component can be reused by another application, it belongs in `packages/ui`
- If it cannot, it belongs in `apps/operations/components`

---

## Dashboard Platform

- The dashboard platform is the source of truth for all UI
- Applications never redesign it
- Applications configure it
- One change in `packages/ui` propagates to all consuming apps
- Never fork a shared component — extend or configure it

---

## Operations Application

`apps/operations` owns only:
- Navigation configuration
- Page components
- Service layer
- API clients
- Permission definitions
- Business module logic

Everything visual comes from `packages/ui`.

---

## Component Rules

Before creating any component, ask:

> Can another application use this?

```
Yes → packages/ui/dashboard
No  → apps/operations/components
```

Never duplicate a component that already exists in `packages/ui`.

---

## Data Rules

```
Server Component
      ↓
API Service (*-queries.ts with server-only)
      ↓
Props passed to Client Component
      ↓
UI renders
```

- Never fetch data inside client components
- Never call APIs directly from UI components
- Mutations go through server actions or client mutation files (`*.ts`)
- `server-only` enforced on all server-side query files

---

## Page Rules

Every page follows this structure without exception:

```
PageHeader
      ↓
FilterBar
      ↓
Content (DataTable or custom)
      ↓
EmptyState (when no data)
```

Every page implements all three states:
- Loading — `<Suspense>` + skeleton
- Error — `error.tsx` boundary + retry
- Empty — `EmptyState` component

---

## Styling Rules

- Tailwind utilities only
- No CSS modules
- No inline styles
- No hardcoded colour values — theme tokens only
- No hardcoded spacing values — Tailwind scale only

---

## Import Rules

```
packages/ui     → shared visual components
packages/types  → shared TypeScript types
apps/operations → app-specific pages and config
```

- Never import from `apps/*` inside `packages/*`
- Never import from one app into another app

---

## Development Sequence

Always complete work in this order. Never skip ahead.

```
1. Dashboard Platform (packages/ui shell + components)
2. Shared Component Library (cards, tables, forms, charts)
3. Operations App (pages consuming shared components)
4. API Integration (live data replacing static)
5. Authentication and Permissions
```

---

## Definition of Done

A feature is done when all of the following pass:

- ✓ `pnpm build` — zero errors
- ✓ TypeScript strict — zero errors
- ✓ Biome lint — zero errors
- ✓ Responsive layout verified (mobile + desktop)
- ✓ Light and dark mode verified
- ✓ Loading state present
- ✓ Empty state present
- ✓ Error boundary present
- ✓ No hardcoded navigation
- ✓ No hardcoded colours
- ✓ No mock data (Phase 4+)

---

## Amazon Q Guardrails

- Never introduce architecture not defined in the specification documents
- Never rename folders or move packages without explicit instruction
- Never create a duplicate component — check `packages/ui` first
- Never add a dependency without asking first
- Never skip the development sequence
- Always preserve package ownership boundaries
- Always prefer the simplest solution that satisfies the requirement
- Always verify build passes before committing

---

END OF WORKING AGREEMENT
