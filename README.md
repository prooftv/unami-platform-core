# Unami Platform Core

This repository is not a single application.

It is the shared software foundation for the Unami digital ecosystem — a collection of reusable infrastructure, design systems, application patterns, and engineering standards that power multiple independent products.

**The problem it solves:**

Every digital product in the Unami ecosystem needs authentication, permissions, layouts, themes, dashboard components, API patterns, database conventions, and validation. Without a shared foundation, each product rebuilds these from scratch — inconsistently, expensively, and with compounding technical debt.

Unami Platform Core exists so that never happens again.

**The vision:**

A reusable digital operating foundation where platform capabilities are built once, maintained centrally, and consumed by every product in the ecosystem — while each product retains full ownership of its business domain.

---

# Architecture Philosophy

The platform is divided into three distinct layers:

**Platform Layer**
Reusable capabilities that belong to no single application. Authentication, permissions, layouts, themes, dashboard components, API patterns, database conventions. Built here. Owned here. Consumed everywhere.

**Application Layer**
Individual products. Moments, BeatsChain, Umkhandlu, ITPMS, Schools Portal, Ecommerce. Each application owns its routes, pages, and user experience. Each application consumes platform capabilities — it does not reimplement them.

**Business Domain Layer**
Specific rules, workflows, and models that belong to a single product. A broadcast in Moments is not the same as a track in BeatsChain. Domain logic lives close to the application that owns it.

**The rule that holds this together:**

No application should duplicate:
- authentication
- permissions
- layouts
- themes
- dashboard components
- API patterns
- database conventions
- validation patterns

If two applications need the same capability, it belongs in the platform.

---

# Consuming Applications

The following products are built on this foundation:

**Moments v2**
Community communication and digital notice board platform. The first consuming application. Messages, broadcasts, subscribers, community feeds.

**BeatsChain**
Music creator ecosystem. Creator profiles, audio assets, ISRC registration workflows, sponsored content, radio submissions, marketplace concepts, streaming integration.

**Umkhandlu**
Traditional authority and community governance operating platform. Governance records, community structures, traditional authority workflows.

**ITPMS**
Municipal ICT project management platform. Project tracking, resource management, reporting for local government ICT departments.

**Schools Portal**
Digital infrastructure for educational institutions. Administration, communication, and operational tooling for schools.

**Ecommerce Platforms**
Commercial storefronts and operations dashboards. Product management, order workflows, merchant operations.

---

# Repository Architecture

```
unami-platform-core/
├── apps/                        # Future application implementations
├── packages/
│   ├── ui/                      # Reusable design system and components
│   ├── platform/                # Application infrastructure
│   ├── api/                     # Typed API clients
│   ├── domain/                  # Business models and rules
│   ├── db/                      # Persistence layer
│   └── shared/                  # Cross-cutting types, enums, validators
├── supabase/                    # Backend functions and migrations
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

# Package Responsibilities

## packages/ui

Pure presentation layer. The dashboard identity system and component library for the entire ecosystem.

Contains:
- Dashboard shell and layouts
- Navigation systems
- Theme engine and style presets
- Typography and font system
- Reusable components (forms, tables, charts, modals)
- Preference system (theme mode, sidebar variant, content layout)

**Rules:**
- No business logic
- No Supabase calls
- No authentication
- No application-specific terminology
- No domain models

A component built here must be equally usable by Moments, BeatsChain, Umkhandlu, ITPMS, and every future product. If it references a specific application's concepts, it does not belong here.

---

## packages/platform

Application infrastructure. The operational layer that makes applications work.

Contains:
- Authentication flows
- Permission and role systems
- Application configuration
- Shared providers
- API infrastructure
- Shared utilities

**Rules:**
- Platform knows how applications operate
- Platform does not know individual business domains
- No Moments-specific, BeatsChain-specific, or any product-specific logic

---

## packages/domain

Business modelling layer. Shared domain primitives that multiple applications may reference.

Contains:
- Shared entities and types
- Cross-application validators
- Shared enums
- Shared helpers

Each application defines its own domain packages for product-specific models.

Examples:
- Moments domain: messages, broadcasts, subscribers
- BeatsChain domain: artists, tracks, licensing, ISRC records
- Umkhandlu domain: traditional authorities, communities, governance records

---

## packages/api

Typed communication layer.

**Rule:** Applications never directly call backend endpoints. All communication flows through typed API clients defined here. This enforces a contract boundary between frontend and backend that survives refactoring.

---

## packages/db

Persistence abstraction.

Responsible for:
- Database types generated from Supabase schema
- Repository patterns
- Data access abstractions

**Rule:** Business logic does not live here. This layer moves data. Domain logic decides what to do with it.

---

## packages/shared

Cross-cutting primitives used across all packages and applications.

Contains:
- Enums
- Constants
- Types
- Validators (Zod schemas)
- Helpers

**Status:** Complete as of Phase 2.

---

# Technology Standards

**Frontend**
- Next.js — application framework
- React — UI runtime
- TypeScript — strict typing across all packages
- Tailwind CSS — utility-first styling
- shadcn/ui — component primitives

**Workspace**
- pnpm — package management
- Turborepo — monorepo build orchestration

**Backend**
- Supabase — database, auth, storage, realtime
- Edge Functions — serverless compute
- Hono — lightweight API layer where required

**Validation**
- Zod — schema validation, shared between frontend and backend

**State**
- Zustand — client state where required, vanilla store pattern for SSR compatibility

---

# Engineering Rules

These rules are non-negotiable. They exist because previous builds violated them and paid the price.

1. **No business logic inside React components.** Components render. They do not decide.

2. **Browser code is UI only.** If it involves a business rule, it runs server-side.

3. **Business processes run server-side.** Edge functions, server actions, or API routes — not client components.

4. **Frontend communicates through APIs.** No direct database calls from application code.

5. **Database access never happens directly from applications.** It flows through `packages/db` abstractions.

6. **Domain models are separated from UI models.** A `User` in the domain is not the same shape as a `User` in a form component.

7. **Every feature must declare ownership:**
   - Is this a platform capability? → `packages/`
   - Is this an application feature? → `apps/[app]/`
   - Is this domain logic? → domain package

8. **Avoid premature abstraction.** Only extract into platform when two or more applications demonstrably benefit. Do not abstract speculatively.

9. **No duplicated dashboards.** The dashboard shell is built once in `packages/ui`. Applications consume it.

10. **Backwards compatibility is a first-class concern.** Platform packages are consumed by multiple applications. Breaking changes require explicit versioning and migration paths.

---

# Current Migration Status

**Phase 1 — Repository Foundation** ✅
Monorepo structure, workspace configuration, Turborepo pipeline, TypeScript baseline.

**Phase 2 — Shared Package** ✅
`packages/shared` complete. Contains:
- enums
- constants
- types
- validators
- helpers

**Phase 3 — UI Foundation** 🔄 In progress

Migrated from `dashboard-platform-export`:
- Theme engine (`ThemeMode`, `ThemePreset`, `ResolvedThemeMode`)
- Preference system (`PreferenceValueMap`, persistence config, defaults)
- Layout types and DOM appliers
- Font registry (17 fonts via next/font/google)
- Style presets (brutalist, soft-pop, tangerine)
- Zustand preferences store (vanilla, SSR-safe)
- `PreferencesStoreProvider` and `usePreferencesStore`

**Phase 3 — Next:**
- Dashboard shell (`packages/ui/shell`)
- Navigation system
- Reusable component library (`packages/ui/components`)

**Phase 4 — Planned:**
- `packages/platform` — authentication and permissions infrastructure
- `packages/api` — typed API client layer
- `packages/db` — Supabase persistence abstractions

---

# AI Development Instructions

This section exists specifically for AI coding assistants working inside this repository.

**Before generating any code, answer these questions:**

1. Does this feature belong in the platform (`packages/`) or in an application (`apps/`)?
2. Does an equivalent already exist in an existing package?
3. Will this be useful to more than one application, or only one?
4. Does this introduce application-specific terminology into a shared package?

**Hard rules for AI agents:**

- Never place reusable logic inside `apps/`
- Never create duplicate components — check existing packages first
- Never reference Moments, BeatsChain, or any specific application inside `packages/ui`, `packages/platform`, or `packages/shared`
- Never add Supabase imports to `packages/ui`
- Never add business logic to React components
- Prefer extending existing foundations over creating isolated solutions
- Preserve backwards compatibility — other applications depend on these packages

**When in doubt about ownership:** ask before writing. A misplaced file is harder to fix than a delayed file.

---

# Development Workflow

**Standard feature development flow:**

1. Define the domain requirement — what business problem is being solved?
2. Determine ownership — platform, application, or domain?
3. Implement backend capability — edge function, server action, or API route
4. Create typed API contract — define the request/response shape in `packages/api`
5. Build UI using shared components from `packages/ui`
6. Validate through typecheck and build pipeline

**Branch strategy:**
- `main` — stable, deployable state
- `phase-N-complete` — phase completion checkpoints
- Feature branches off `main`

---

# Vision

Unami Platform Core is the operating foundation for a family of digital products serving communities, creators, institutions, and commerce.

The goal is not to build isolated applications that share a repository name.

The goal is a sustainable ecosystem where every application benefits from a common engineering foundation — consistent authentication, consistent UI, consistent API patterns, consistent data conventions — while each product maintains its own business identity, domain logic, and user experience.

Build once. Reuse everywhere. Applications own domains. The platform owns capabilities.

This is the standard every contributor, every AI agent, and every future engineer is expected to uphold.
