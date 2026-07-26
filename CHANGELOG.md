# Changelog

All notable changes to Unami Platform Core are documented here.

This changelog follows the platform milestone model — not application releases.
Each entry represents a stable, verified state of the shared foundation.

---

## [v0.1.0-platform-foundation] — Platform Milestone 1

**Tag:** `v0.1.0-platform-foundation`
**Status:** Stable baseline — verified build, clean dependency audit, typecheck passing

This milestone establishes the reusable engineering foundation for the Unami digital ecosystem.
It is not a Moments release. It is the platform that Moments — and every future application — is built on.

---

### Phase 1 — Repository Foundation

- Turborepo monorepo workspace configured
- `pnpm` workspace with `pnpm-workspace.yaml`
- Root `tsconfig.json` with strict TypeScript baseline
- `turbo.json` build pipeline
- Workspace packages: `@moments/ui`, `@moments/shared`, `@moments/api`, `@moments/admin`, `@moments/web`
- `apps/admin` and `apps/web` scaffolded as Next.js 16 applications
- `dashboard-platform-export/` and `moments-v2-bootstrap/` preserved as architectural reference sources

---

### Phase 2 — Shared Foundation

**Package:** `packages/shared` (`@moments/shared`)

Established the cross-cutting primitive layer. Framework-agnostic. Zero React, zero Next.js, zero Supabase.

Contains:
- `enums/` — domain status enums, role enums, channel enums
- `constants/` — system limits, MCP thresholds, pagination defaults
- `types/` — shared TypeScript interfaces for domain entities
- `validators/` — Zod schemas for all input validation
- `helpers/` — pure utility functions (phone formatting, compliance checks, budget calculations)

**Dependency:** Zod only. No framework dependencies.

**Note:** Current content is Moments-domain-specific. As the platform matures, platform-agnostic primitives will be extracted and Moments-specific domain logic will migrate to `apps/moments/domain` or a dedicated `packages/domain/moments` package.

---

### Phase 3 — UI Platform Foundation

**Package:** `packages/ui` (`@moments/ui`)

Established the reusable presentation layer. No Supabase. No authentication. No application-specific terminology.

#### Theme System (`packages/ui/src/theme/`)
- `ThemeMode` — light / dark / system
- `ThemePreset` — default, brutalist, soft-pop, tangerine
- `ResolvedThemeMode` — computed runtime mode
- `PreferenceValueMap` — all user preference keys and types
- `PREFERENCE_DEFAULTS` and `PREFERENCE_PERSISTENCE` config
- `applyThemeMode`, `applyThemePreset`, `subscribeToSystemTheme` — DOM appliers
- Layout types: `SidebarVariant`, `SidebarCollapsible`, `ContentLayoutValue`, `NavbarStyle`
- Layout DOM appliers: `applySidebarVariant`, `applyContentLayout`, `applyFont`, etc.

#### Font System (`packages/ui/src/fonts/`)
- `FONT_CONFIG` — 17 font definitions with CSS variable mappings
- `FontKey` type
- `fontOptions` — label/variable pairs for UI font selectors
- Font instantiation intentionally delegated to consuming apps (Next.js boundary)

#### State (`packages/ui/src/stores/`)
- `createPreferencesStore` — Zustand vanilla store, SSR-safe
- `PreferencesState` — full preference state type with setters

#### Providers (`packages/ui/src/providers/`)
- `PreferencesStoreProvider` — React context provider, DOM sync on mount, system theme subscription
- `usePreferencesStore` — typed selector hook

#### Style Presets (`packages/ui/src/styles/presets/`)
- `brutalist.css` — high-contrast, zero-radius preset
- `soft-pop.css` — rounded, vibrant preset
- `tangerine.css` — warm, professional preset

#### Shell (`packages/ui/src/shell/`)
- `AppShell` — layout composition: sidebar + header + main slots
- `Sidebar` — renders `NavigationSection[]` via props, collapsed state, active path, no hardcoded routes
- `Header` — title / actions / userArea slots, sticky via `data-navbar-style`
- `MobileNav` — drawer with backdrop, Escape key, `aria-modal`
- `ContentLayout` — width/spacing, responds to `data-content-layout` attribute

#### Navigation (`packages/ui/src/navigation/`)
- `NavigationItem`, `NavigationSection`, `BreadcrumbItem` types
- `Breadcrumbs` — generic breadcrumb trail
- `PageHeader` — title + description + actions slot
- `SectionTitle` — section heading with optional description

#### Primitives (`packages/ui/src/primitives/`)
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Badge` — 7 variants via CVA
- `Button` — 6 variants, 4 sizes via CVA
- `Separator` — horizontal/vertical

#### Dashboard (`packages/ui/src/dashboard/`)
- `MetricCard` — numeric metric with trend indicator, composes Card
- `KPIGrid` — responsive 2/3/4 column grid
- `AnalyticsCard` — card with header slot for chart content
- `ActivityFeed` — timestamped activity list
- `QuickActions` — action grid card
- `EmptyDashboard` — first-run state

#### Tables (`packages/ui/src/tables/`)
- `TableContainer`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell` — primitives
- `TableToolbar` — search input + actions + filters slots
- `TablePagination` — page controls with result count
- `EmptyTable` — zero-result state inside table
- `DataTable` — generic column-driven table composing all primitives

#### Feedback (`packages/ui/src/feedback/`)
- `Skeleton` — animated loading placeholder
- `StatusBadge` — semantic status → Badge variant mapping
- `EmptyState` — icon + title + description + action slot
- `ErrorState` — error display with destructive styling
- `LoadingCard`, `LoadingTable` — skeleton compositions

#### Forms (`packages/ui/src/forms/`)
- `FormSection` — titled section with separator
- `FieldGroup` — label + description + error wrapper
- `SubmitBar` — right-aligned action bar with top border
- `FormActions` — flexible action row with left/right/between alignment

#### Charts (`packages/ui/src/charts/`)
- `ChartContainer` — height-controlled wrapper
- `LineChart`, `BarChart`, `AreaChart`, `PieChart` — typed placeholder wrappers
- Ready for Recharts, Victory, or Chart.js integration

---

### Phase 3 — UI Showcase

**Application:** `apps/admin` — UI Showcase

A living component library and visual regression baseline. Not a Moments admin panel — a platform showcase.

Routes:
- `/ui` — component index
- `/ui/dashboard` — all dashboard components with fake data
- `/ui/tables` — DataTable with live search and pagination
- `/ui/forms` — form primitives and Button variants
- `/ui/charts` — all chart wrappers
- `/ui/feedback` — all feedback states, badges, skeletons
- `/ui/navigation` — Breadcrumbs, PageHeader, SectionTitle
- `/ui/theme` — preset swatches, mode options, CSS variable tokens

---

### Dependency Audit — Phase 3.5

Performed before tagging v0.1.0-platform-foundation.

| Check | Result |
|---|---|
| `packages/ui` imports Supabase | ✅ Clean |
| `packages/ui` imports `@moments/api` | ✅ Clean |
| `packages/ui` imports `apps/*` | ✅ Clean |
| `packages/ui` imports `next/*` | ✅ Clean |
| `packages/shared` imports React | ✅ Clean |
| `packages/shared` imports Next.js | ✅ Clean |
| `packages/shared` imports Supabase | ✅ Clean |
| `apps/*` imports from other `apps/*` | ✅ Clean |
| `packages/*` imports from `apps/*` | ✅ Clean |
| Circular dependencies | ✅ None detected |
| Duplicate export names | ✅ None |
| `packages/ui` typecheck | ✅ Passing |
| `packages/shared` typecheck | ✅ Passing |
| `pnpm turbo build` | ✅ 2 successful, 0 errors |

**Finding:** `packages/shared` currently contains Moments-domain-specific logic (enums, types, validators, helpers). This is correct for Phase 2 — it was migrated from the original codebase. It will be refactored into `packages/domain/moments` or `apps/moments/domain` in a future phase as the platform matures and additional applications are onboarded.

---

### Architecture Documents

- `README.md` — platform vision, consuming applications, package responsibilities, engineering rules
- `ARCHITECTURE.md` — dependency matrix, data flow rules, domain separation, component ownership rules, AI agent rules

---

## Planned

### v0.2.0 — Moments Domain Foundation
- Supabase schema
- Edge Functions
- `packages/api` typed client layer
- Authentication infrastructure (`packages/platform`)
- Moments admin modules

### v0.3.0 — Moments Public PWA
- Public-facing web application
- PWA configuration
- n8n workflow integration

### v1.0.0 — Platform Stable
- Second application onboarded (BeatsChain or Umkhandlu)
- `packages/shared` domain logic refactored to application-specific packages
- Full platform dependency audit passing
