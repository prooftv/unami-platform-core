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
├── apps/
│   ├── admin/          Next.js — Moments admin (complete)
│   └── web/            Next.js — Moments public PWA (not yet started)
├── packages/
│   ├── ui/             @unami/ui — design system, shell framework, component library
│   ├── shared/         @unami/shared — enums, types, validators, constants
│   └── api/            @unami/api — typed API clients
├── supabase/
│   ├── functions/      15 Edge Functions
│   └── migrations/     000_initial_schema.sql (baseline, immutable)
├── docs/
│   ├── DATABASE_SCHEMA.md
│   ├── SCHEMA_MAPPING.md
│   └── context/        architecture.md, decisions.md, security-model.md
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

**Note on package scope:** All packages are currently scoped `@moments/*`. This will be renamed to `@unami/*` before the second application onboards (Phase 16).

---

# Package Responsibilities

## packages/ui — `@unami/ui` ✅

Three distinct layers:

**1. UI Primitives**
Low-level building blocks: `Button`, `Card`, `Badge`, `Table`, `Input`, `Dialog`, `Drawer`, `Popover`.
These are shadcn/ui components — generic, unstyled, composable.

**2. Application Shell Framework** *(Phase 17 — in design)*
Generic shell infrastructure that every application can compose around:
`ShellProvider`, `ShellSidebar`, `ShellHeader`, `ShellContent`, `ShellSearch`,
`ShellCommandPalette`, `ShellPreferences`, `ShellUserMenu`, `ShellMobileNavigation`.

Critically: **no navigation, no branding, no product references.**
Each application composes its own sidebar and header on top of these primitives.
Moments builds `AppSidebar`. Umkhandlu builds `UmkhandluSidebar`. Same shell. Different composition.

The current `packages/ui/src/shell/` files are Phase 3 placeholders — unfinished, not for consumption.
The real shell framework is extracted from `apps/admin` in Phase 17.

**3. Shared Structural Components**
Patterns used across all admin and dashboard surfaces:
`PageHeader`, `KPIGrid`, `MetricCard`, `TableToolbar`, `TablePagination`, `BulkActionBar`,
`DataTable`, `EmptyState`, `ErrorState`, `PageSkeleton`, `TableSkeleton`, `StatusBadge`,
`AnalyticsCard`, `LineChart`, `BarChart`, `PieChart`, `AreaChart`, `ActivityFeed`, `QuickActions`.

**Rules:**
- No business logic
- No Supabase calls
- No authentication
- No application-specific terminology
- No domain models

---

## packages/shared — `@unami/shared` ✅

Cross-cutting primitives used across all packages and applications.

Contains: enums, constants, types, Zod validators, helpers.

**Rules:** No React, no Next.js, no Supabase.

**Note:** Currently contains Moments-domain enums. These will be extracted to `apps/admin/domain` in Phase 16.

---

## packages/api — `@unami/api` ✅

Typed communication layer. Applications never call backend endpoints directly.
All data flows through typed clients defined here → Edge Functions → database.

Two factories:
- `createApiClient` — authenticated, used by `apps/admin`
- `createPublicApiClient` — anon key, used by `apps/web` (public read only)

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

9. **No duplicated shells.** The shell framework is built once in `packages/ui/src/shell/`. Applications compose their own navigation and branding on top — they do not reimplement the shell infrastructure.

10. **Backwards compatibility is a first-class concern.** Platform packages are consumed by multiple applications. Breaking changes require explicit versioning and migration paths.

---

# Platform Status

| Layer | Status |
|---|---|
| Database — 26 tables | ✅ Complete |
| Edge Functions — 15 functions | ✅ Complete |
| `packages/shared` | ✅ Complete |
| `packages/ui` — primitives + structural components | ✅ Complete |
| `packages/api` — typed clients | ✅ Complete |
| `apps/admin` — Moments admin, all modules, full CRUD | ✅ Complete |
| `apps/web` — Moments public PWA | ⏳ Not started (Phase 14) |
| Shell Framework — `Shell*` primitives in `packages/ui` | ⏳ Phase 17 |

## Roadmap

**Phase 16 — Platform Expansion** *(next)*
- Rename `@moments/*` → `@unami/*`
- Extract Moments domain from `packages/shared`
- Scaffold second application

**Phase 17 — Shell Framework Extraction**
- Extract generic `Shell*` primitives from `apps/admin` into `packages/ui/src/shell/`
- `apps/admin` migrates to consume `Shell*` primitives
- Future apps inherit a polished, finished shell infrastructure — not a product

**Phase 14 — Public PWA** *(after shell framework)*
- `apps/web` — Moments public feed, moment detail, subscribe flow
- Consumes `packages/ui` and `packages/api`
- No auth, no Supabase client

**Last phase — Automation**
- n8n integration for scheduled broadcasts, intent execution, digest generation
- HELP/STATUS/MYAUTHORITY webhook reply handlers (Supabase-native Edge Functions first)

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
- Never reference Moments, BeatsChain, or any specific application inside `packages/ui`, `packages/shared`
- Never add Supabase imports to `packages/ui`
- Never add business logic to React components
- Never consume `packages/ui/src/shell/` — those are Phase 3 placeholders, not the shell framework
- The shell framework (`Shell*` primitives) does not exist yet — do not invent it prematurely
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
