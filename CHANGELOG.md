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
- Workspace packages: `@unami/ui`, `@unami/shared`, `@unami/api`, `@unami/admin`, `@moments/web`
- `apps/admin` and `apps/web` scaffolded as Next.js 16 applications
- `dashboard-platform-export/` and `moments-v2-bootstrap/` preserved as architectural reference sources

---

### Phase 2 — Shared Foundation

**Package:** `packages/shared` (`@unami/shared`)

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

**Package:** `packages/ui` (`@unami/ui`)

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
| `packages/ui` imports `@unami/api` | ✅ Clean |
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

---

## [v0.3.0-operational-experience] — Platform Milestone 3

**Tag:** `v0.3.0-operational-experience`
**Status:** Stable — verified build, zero TypeScript errors, Settings Edge Function deployed
**Commits:** `02124a9` (7A) → `0ae75b6` (7B) → `4ce7320` (7C/7D/7E)

This milestone elevates the Moments admin from a data-wired dashboard into a fully operational command centre. Every sub-phase is a distinct, verifiable capability increment.

---

### Phase 7A — Operational Experience Foundation

**Scope:** `apps/admin`, `packages/ui`

- **Auth bug fix** — `authority_profiles` query corrected from `.eq('user_id', ...)` to `.eq('user_identifier', ...)` matching actual schema column
- **Preferences system** — server-side cookie reader (`lib/preferences/server.ts`), client hooks with store + DOM + cookie persistence (`lib/preferences/client.ts`)
- **FOUC prevention** — synchronous inline `<script>` in root layout sets all `data-*` attributes before React hydrates
- **PreferencesPanel** — slide-in panel with theme mode (Light/Dark/System), preset swatches, content width toggle, sidebar collapse toggle
- **Preset CSS** — Brutalist, Soft Pop, Tangerine CSS variable blocks inlined into `globals.css` (CSS files not importable via package alias)
- **Sidebar collapse** — collapse toggle button in sidebar footer, `useSidebarCollapsible` hook, icon-only collapsed state
- **Dashboard skeletons** — `KPIGridSkeleton`, `WidgetGridSkeleton` exported from `DashboardSections`, `Suspense` wrapping active section in `DashboardClient`
- **Trend indicators** — `MetricCard` trend prop wired to live metrics on Total Moments, Broadcasts Sent, Active Subscribers

---

### Phase 7B — Chart System

**Scope:** `packages/ui/src/charts/`, `apps/admin` dashboard widgets

**Architecture decision:** Recharts installed in `packages/ui` — not `apps/admin`. Charts are a platform capability consumed by every future application (Spree Operations, Umkhandlu, ITPMS), exactly as MetricCard, KPIGrid, and ActivityFeed are platform capabilities.

- **`recharts ^3.10.1`** added to `packages/ui/package.json`
- **`packages/ui/src/charts/Charts.tsx`** fully rewritten — real Recharts implementations replacing placeholder stubs:
  - `LineChart` — monotone line with CartesianGrid, XAxis, YAxis, Tooltip
  - `BarChart` — vertical bars with rounded tops, hover cursor
  - `AreaChart` — gradient fill area chart with `linearGradient` defs
  - `PieChart` — accepts `PieDataPoint[]`, Cell-coloured, Legend
  - `ChartContainer` — height-controlled wrapper
  - All charts: CSS variable palette (`hsl(var(--primary))` etc.) — presets apply automatically
  - All charts: empty state with dashed border when no data
  - All charts: generic typed props (`ChartDataPoint`, `ChartSeries`, `PieDataPoint`) — zero Moments-specific concepts
- **9 widgets wired with real data:**
  - `SubscriberGrowthWidget` → AreaChart from `DailyStats[]`
  - `DeliveryScheduleWidget` → BarChart from `SubscriberStats.bySchedule`
  - `RegionalSubscriberWidget` → BarChart from `SubscriberStats.byRegion`
  - `DeliverySuccessWidget` → LineChart from per-broadcast success rates
  - `ContentSourceWidget` → PieChart from moment content source counts
  - `CategoryDistributionWidget` → BarChart from `CategoryStats[]`
  - `RegionalDistributionWidget` → BarChart from `RegionalStats[]`
  - `AdvisoryConfidenceWidget` → BarChart from `ModerationStats` breakdown
  - `RevenueAnalyticsWidget` → BarChart from `RevenueAnalytics` aggregate
  - `BudgetUtilisationWidget` → BarChart from utilisation percentage

---

### Phase 7C — Platform UX Polish

**Scope:** `packages/ui/src/forms/`, `apps/admin` all list modules

- **`FilterSelect`** added to `packages/ui/src/forms/FormPrimitives.tsx` — generic `{ value, onChange, options, placeholder }` component. Replaces raw `<select>` elements across all modules. No app-specific concepts.
- **Pagination wired** across all 5 list modules — previously all `onPageChange` callbacks were no-ops:
  - `MomentsPage`, `SubscribersPage`, `SponsorsPage`, `CampaignsPage`, `BroadcastsPage` — all accept `searchParams: Promise<{ page?: string }>`, pass `page` to API, pass `currentPage` to client
  - All client components (`MomentsClient`, `SubscribersClient`, `SponsorsClient`, `CampaignsClient`, `BroadcastsClient`) — `handlePageChange` calls `router.push` with updated `?page=N`
- All raw `<select>` filter elements replaced with `FilterSelect` from `@unami/ui`

---

### Phase 7D — Realtime

**Scope:** `apps/admin/src/lib/realtime/`, `apps/admin` dashboard widgets

**Architecture:** Realtime subscriptions live in `apps/admin` — they are application-level infrastructure, not platform-level. `packages/ui` has no Supabase dependency.

- **`useRealtimeTable`** hook (`apps/admin/src/lib/realtime/useRealtimeTable.ts`) — subscribes to `postgres_changes` on any table, calls `onUpdate()` on any INSERT/UPDATE/DELETE, cleans up channel on unmount
- **`BroadcastQueueWidget`** — subscribes to `moments` table, calls `router.refresh()` on change
- **`ModerationQueueWidget`** — subscribes to `messages` table, calls `router.refresh()` on change
- Both P0 widgets now reflect live database state without manual page reload

---

### Phase 7E — Settings CRUD

**Scope:** `supabase/functions/settings/`, `packages/api/src/clients/settings.ts`, `apps/admin/settings/`

- **`settings` Edge Function** (`supabase/functions/settings/index.ts`) — deployed to `dpydmpydyfrrdhuezvgi`:
  - `GET /settings/flags` — list all feature flags (all roles)
  - `POST /settings/flags/:flagKey` — toggle `enabled` (superadmin only), writes audit log
  - `GET /settings/system` — list all system settings (all roles)
  - `POST /settings/system/:settingKey` — update `setting_value` (superadmin only), writes audit log
- **`createSettingsClient`** (`packages/api/src/clients/settings.ts`) — typed wrappers for all 4 endpoints, `FeatureFlag` and `SystemSetting` types exported
- **`SettingsClient`** rewritten with live data:
  - Feature flags rendered as toggle switches for superadmin, read-only badges for other roles
  - System settings rendered with inline edit (click Edit → input → Save/Cancel) for superadmin
  - All mutations go through `packages/api` typed client — no direct Supabase calls from UI
  - Feedback messages on success/failure
  - Audit trail written by Edge Function on every change

---

### Edge Functions — Final State

| Function | Status | Deployed |
|---|---|---|
| `auth` | Complete | `dpydmpydyfrrdhuezvgi` |
| `moments` | Complete | `dpydmpydyfrrdhuezvgi` |
| `broadcast` | Complete | `dpydmpydyfrrdhuezvgi` |
| `webhook` | Complete | `dpydmpydyfrrdhuezvgi` |
| `subscribers` | Complete | `dpydmpydyfrrdhuezvgi` |
| `moderation` | Complete | `dpydmpydyfrrdhuezvgi` |
| `authority` | Complete | `dpydmpydyfrrdhuezvgi` |
| `sponsors` | Complete | `dpydmpydyfrrdhuezvgi` |
| `campaigns` | Complete | `dpydmpydyfrrdhuezvgi` |
| `analytics` | Complete | `dpydmpydyfrrdhuezvgi` |
| `settings` | Complete | `dpydmpydyfrrdhuezvgi` |

---

### API Clients — Final State

| Client | Methods |
|---|---|
| `moments` | `list`, `get`, `create` |
| `broadcasts` | `list`, `trigger` |
| `auth` | `login`, `session` |
| `subscribers` | `list`, `stats` |
| `moderation` | `listMessages`, `listAdvisories`, `stats`, `approve`, `reject` |
| `authority` | `listProfiles`, `auditLog`, `stats` |
| `sponsors` | `list`, `stats` |
| `campaigns` | `list`, `budgetOverview` |
| `analytics` | `dashboardMetrics`, `dailyStats`, `regionalStats`, `categoryStats`, `revenueAnalytics`, `intentStats` |
| `settings` | `listFlags`, `updateFlag`, `listSystemSettings`, `updateSystemSetting` |

---

### packages/ui — Additions in Phase 7

| Component/Export | Location | Notes |
|---|---|---|
| `LineChart` | `packages/ui/src/charts/Charts.tsx` | Real Recharts, generic typed props |
| `BarChart` | `packages/ui/src/charts/Charts.tsx` | Real Recharts, generic typed props |
| `AreaChart` | `packages/ui/src/charts/Charts.tsx` | Real Recharts, gradient fill |
| `PieChart` | `packages/ui/src/charts/Charts.tsx` | Real Recharts, `PieDataPoint[]` |
| `ChartDataPoint` | `packages/ui/src/charts/Charts.tsx` | Shared chart data type |
| `ChartSeries` | `packages/ui/src/charts/Charts.tsx` | Series config type |
| `PieDataPoint` | `packages/ui/src/charts/Charts.tsx` | Pie-specific data type |
| `FilterSelect` | `packages/ui/src/forms/FormPrimitives.tsx` | Generic select filter |

---

### Dependency Changes

| Package | Location | Change |
|---|---|---|
| `recharts ^3.10.1` | `packages/ui` | Added — platform chart library |

---

### Architecture Compliance

All Phase 7 work was verified against the architecture rules before implementation:

- `packages/ui` — no Supabase, no auth, no app-specific logic. Recharts added as a UI library dependency. `FilterSelect` is generic. Chart components have no Moments concepts.
- `packages/api` — `settings` client added following identical pattern to all other clients. No business logic.
- `apps/admin` — Realtime hook lives here (correct layer). All mutations go through `packages/api`. No direct Supabase calls from UI components.
- `supabase/functions/settings` — only layer touching `system_settings` and `feature_flags` tables directly. Writes audit log on every mutation.
- `packages/shared` — not modified.
- `000_initial_schema.sql` — not modified.

---

## [Phase 17A] — Public PWA Shell and Information Architecture

**Commit:** `1200046`
**Branch:** `main`
**Status:** Complete — build passing, 16 routes, TypeScript clean

### Goal
Transform `apps/web` from a minimal scaffold into the complete public Moments community experience. Data source: Supabase via existing public API. No Sanity.

### Files Created

| File | Description |
|---|---|
| `apps/web/src/components/ThemeToggle.tsx` | Client theme toggle — reads/writes `dark` class, persists to localStorage |
| `apps/web/src/components/MobileNav.tsx` | Mobile navigation drawer with backdrop, Escape key, aria-modal |
| `apps/web/src/app/(public)/layout.tsx` | Full responsive layout — desktop nav, mobile drawer, theme toggle, structured footer |
| `apps/web/src/app/(public)/page.tsx` | Homepage — 9 sections: urgent strip, hero, featured, latest, categories, sponsored, community notices, authority updates, subscribe CTA |
| `apps/web/src/app/(public)/feed/page.tsx` | Dedicated feed page — all broadcasted moments, paginated |
| `apps/web/src/app/(public)/about/page.tsx` | About page — static, Sanity-ready in Phase 17C |
| `apps/web/src/app/(public)/help/page.tsx` | Help page — WhatsApp commands reference, static |
| `apps/web/src/app/(public)/privacy/page.tsx` | Privacy policy — POPIA compliant, static |
| `apps/web/src/app/(public)/terms/page.tsx` | Terms of service — static |
| `apps/web/src/app/(public)/sponsors/page.tsx` | Sponsors directory — shell, data in Phase 17C |
| `apps/web/src/app/(public)/campaigns/page.tsx` | Campaigns — shell, data in Phase 17C |
| `apps/web/src/app/(public)/authority/page.tsx` | Authority — shell with level descriptions, data in Phase 17C |
| `apps/web/src/app/not-found.tsx` | Global 404 page |

### Files Modified

| File | Change |
|---|---|
| `apps/web/src/app/layout.tsx` | Added inline theme initialisation script to prevent FOUC |

### Route Map

| Route | Type | Data Source |
|---|---|---|
| `/` | Dynamic | Supabase — moments list (3 parallel queries) |
| `/feed` | Dynamic | Supabase — moments list |
| `/moments/[id]` | Dynamic | Supabase — moment detail |
| `/category/[category]` | Dynamic | Supabase — filtered list |
| `/region/[region]` | Dynamic | Supabase — filtered list |
| `/search` | Dynamic | Supabase — search |
| `/subscribe` | Static | — |
| `/about` | Static | Sanity in Phase 17C |
| `/help` | Static | Sanity in Phase 17C |
| `/privacy` | Static | Sanity in Phase 17C |
| `/terms` | Static | Sanity in Phase 17C |
| `/sponsors` | Static | Sanity + Supabase in Phase 17C |
| `/campaigns` | Static | Supabase in Phase 17C |
| `/authority` | Static | Supabase in Phase 17C |
| `/offline` | Static | — |
| `/_not-found` | Static | — |

### Architecture Compliance
- `packages/ui`, `packages/shared`, `packages/api` — not modified
- `apps/admin` — not modified
- Edge Functions — not modified
- All new components are in `apps/web` only
- No Supabase client in components — all data fetching in server page components
- Theme toggle is pure DOM + localStorage — no server state

### Remaining for Phase 17B
- Sanity project creation and schema design
- `@sanity/client` added to `apps/web`
- Content model: `homePage`, `featuredStory`, `sponsorPage`, `helpArticle`, `aboutPage`
- Sanity Studio deployment
