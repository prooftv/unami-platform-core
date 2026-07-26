# Frontend Implementation Guide
## Ecommerce Platform — Operations Dashboard

---

## Document Hierarchy

```
PLATFORM_BLUEPRINT.md                    → ecosystem architecture
        ↓
DASHBOARD_PLATFORM_SPEC.md               → reusable UI framework
        ↓
FRONTEND_IMPLEMENTATION_GUIDE.md         → this document (build rules + sequence)
        ↓
docs/09_PROGRESS.md                      → completed work log
        ↓
docs/10_BACKLOG.md                       → what comes next
```

Read all documents above this one before starting any session.

---

## Repository State

| Item | Detail |
|------|--------|
| Repository | ecommerce-platform |
| Monorepo | pnpm Turborepo |
| Apps | `apps/operations` (admin dashboard) |
| Shared packages | `packages/ui`, `packages/types`, `packages/api-client` |
| Current objective | Build Dashboard Platform — shell first, modules after |

---

## Non-Negotiable Rules

### Never
- Build business logic inside UI components
- Duplicate a component that already exists in `packages/ui`
- Fetch APIs inside client components — use server components
- Hardcode navigation items inside `Sidebar`
- Hardcode permissions inside components
- Use mock data after Sprint 4
- Use `any` type
- Use default exports
- Introduce a new dependency without confirming first
- Modify `packages/ui` behaviour from inside an app

### Always
- Check `packages/ui` before building a new component
- Use `packages/types` for shared TypeScript interfaces
- Use `packages/api-client` for all API calls
- Use server components for data fetching
- Use server actions for mutations
- Keep `apps/operations` presentation-only — no business logic
- Split server queries (`*-queries.ts`) from client mutations (`*.ts`)
- Enforce `server-only` on all server-side query files
- Verify build passes before every commit

---

## Package Ownership

| Package | Owns |
|---------|------|
| `packages/ui` | All visual components — shell, cards, tables, forms, charts, feedback |
| `packages/types` | All shared TypeScript interfaces and enums |
| `packages/api-client` | All API clients — Spree, Laravel, Sanity |
| `apps/operations` | Pages, routing, navigation config, branding, permissions, business modules |

No overlap. If something belongs in two places, it belongs in the higher package.

---

## Extension Rules

Applications may:
- ✓ Compose components from `packages/ui`
- ✓ Configure components via props
- ✓ Extend locally for app-specific needs that don't belong in shared UI

Applications may not:
- ✗ Duplicate shared components
- ✗ Fork shared components
- ✗ Patch shared package behaviour from inside the app

All shared UI changes happen in `packages/ui` only.

---

## Decision Tree

### Need a new UI component?
```
Does packages/ui already have it?
├── Yes → reuse it
└── No → build it in packages/ui, then consume in app
```

### Need an API call?
```
Which backend?
├── Spree (products, orders, inventory) → packages/api-client/spree
├── Laravel (auth, users, permissions) → packages/api-client/laravel
└── Sanity (content) → packages/api-client/sanity
```

### Need a TypeScript type?
```
Is it shared across apps or packages?
├── Yes → packages/types
└── No → local to the app/component
```

### Need data fetching?
```
Server component (page/layout) → server query file (*-queries.ts) with server-only
Client component → receive data via props only, never fetch directly
Mutation (form submit, button action) → server action or client mutation file (*.ts)
```

### Need business logic?
```
apps/operations → owns it
packages/ui → never touches it
```

---

## Build Sequence

### Phase 1 — Dashboard Shell
```
Turborepo scaffold
        ↓
packages/ui/dashboard/shell
  AppShell (slot-based layout)
  Sidebar (renders NavigationSection[])
  Header (search + notifications + user menu)
  MobileNav
        ↓
Navigation config types (NavigationItem, NavigationSection)
        ↓
apps/operations navigation config
        ↓
Theme system (carry from dashboard-platform-export)
        ↓
Verify: responsive, light/dark, all sidebar variants
```

### Phase 2 — Component Library
```
packages/ui/dashboard/data-display
  MetricCard
  KPIGrid
  ActivityFeed
        ↓
packages/ui/dashboard/charts
  AnalyticsCard
        ↓
packages/ui/dashboard/tables
  DataTable
  FilterBar
        ↓
packages/ui/dashboard/feedback
  EmptyState
  LoadingCard
  StatusBadge
        ↓
packages/ui/dashboard/navigation
  PageHeader
  SectionTitle
  Breadcrumbs
```

### Phase 3 — Module Pages
```
Dashboard (KPIGrid + AnalyticsCard + ActivityFeed)
        ↓
Orders (PageHeader + FilterBar + DataTable)
        ↓
Products
        ↓
Inventory
        ↓
Customers
        ↓
Reports
        ↓
Notifications
        ↓
Settings
```

### Phase 4 — API Integration
```
Wire packages/api-client/spree → Orders, Products, Inventory
        ↓
Wire packages/api-client/laravel → Auth, Users, Permissions
        ↓
Replace static data with live data
        ↓
Verify loading, error, empty states end-to-end
```

---

## Page Template

Every module page follows this exact structure. No exceptions.

```
PageHeader
  title
  description
  action buttons (Create, Export, etc.)
        ↓
FilterBar
  search input
  filter dropdowns
        ↓
DataTable
  sortable columns
  row actions
  pagination
        ↓
EmptyState (when data is empty)
```

---

## Interaction States

Every data-bearing page must implement all three:

| State | Implementation |
|-------|---------------|
| Loading | `<Suspense>` wrapping async server component + `LoadingCard` skeleton |
| Error | `error.tsx` boundary with retry action |
| Empty | `EmptyState` component with icon, message, optional CTA |

---

## Definition of Done

A sprint is complete when all of the following pass:

- ✓ `pnpm build` passes with zero errors
- ✓ TypeScript strict mode — zero errors
- ✓ Biome lint — zero errors
- ✓ Mobile layout verified (sidebar drawer, content reflow)
- ✓ Dark mode verified
- ✓ Loading state present on every data page
- ✓ Empty state present on every data page
- ✓ Error boundary present on every data page
- ✓ No hardcoded navigation
- ✓ No hardcoded permissions
- ✓ No mock data (Phase 4+)

---

## Coding Standards

| Rule | Detail |
|------|--------|
| Exports | Named exports only — no default exports |
| Naming | camelCase for functions/variables, PascalCase for components/types |
| Types | Strict TypeScript — no `any`, no type assertions without justification |
| Server boundary | `server-only` on all server query files |
| Data fetching | Server components only — never inside client components |
| Mutations | Server actions or client mutation files — never inline in components |
| Comments | Minimal — code should be self-documenting |
| Interfaces | Shared interfaces in `packages/types` — never duplicated |
| CSS | Tailwind only — no inline styles, no CSS modules |
| Dates | ISO 8601 everywhere — no `toLocaleDateString()` |

---

## Versioning

The dashboard platform follows semantic versioning.

| Change | Version bump |
|--------|-------------|
| Breaking changes to shared UI APIs | Major |
| New components, slots, or theme presets | Minor |
| Bug fixes and visual improvements | Patch |

Tag releases on `packages/ui` so consuming apps can pin versions.

---

## Design Tokens

Token files live in `packages/ui/tokens/`:

| File | Owns |
|------|------|
| `colors.ts` | Brand, status, chart palette |
| `spacing.ts` | Base 4px grid scale |
| `radius.ts` | Border radius scale |
| `typography.ts` | Font family, size scale, weight |
| `z-index.ts` | Elevation layers |
| `motion.ts` | Transition durations and easing |

Components consume tokens — never hardcode values.

---

## Amazon Q Instructions

Read before every session:
1. `PLATFORM_BLUEPRINT.md`
2. `DASHBOARD_PLATFORM_SPEC.md`
3. `FRONTEND_IMPLEMENTATION_GUIDE.md` (this document)
4. `docs/09_PROGRESS.md` (current state)
5. `docs/10_BACKLOG.md` (next tasks)

### Guardrails
- Never introduce new architecture not defined in these documents
- Never rename folders or move packages without explicit instruction
- Never create duplicate components — check `packages/ui` first
- Never add a dependency without asking first
- Always preserve domain ownership boundaries
- Always preserve workspace package boundaries
- Always prefer extension over replacement
- Always prefer the simplest solution that satisfies the requirement
- Build must pass before every commit

---

END OF GUIDE
