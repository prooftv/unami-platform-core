# Frontend Rebuild Plan
## Moments v2 — Admin Experience

**Decision date:** Phase 8 review  
**Status:** Approved — implementation pending  
**Supersedes:** All previous dashboard iteration notes (Phase 8A–8E)

---

## Decision

Stop iterating on the current dashboard shell.

Adopt the official shadcn/ui dashboard as the permanent frontend shell for Moments v2 admin.  
Treat it exactly as Laravel Breeze treats a Laravel application: the shell is sacred, the product grows inside it.

The dashboard is not redesigned. It is extended.

---

## What Does Not Change

Everything below this line is frozen. No modifications permitted.

| Layer | Assets | Status |
|---|---|---|
| Infrastructure | Turborepo, pnpm workspace, build pipeline | ✅ Frozen |
| Database | Supabase schema, migrations, RLS, `000_initial_schema.sql` | ✅ Frozen |
| Backend | Edge Functions: `moments`, `broadcast`, `webhook`, `subscribers`, `authority`, `moderation`, `sponsors`, `campaigns`, `settings` | ✅ Frozen |
| Auth | `getOperatorSession`, role system, Supabase auth | ✅ Frozen |
| API layer | `packages/api` — all typed clients | ✅ Frozen |
| Shared types | `packages/shared` — enums, validators, constants | ✅ Frozen |
| Business logic | Publishing pipeline, broadcast pipeline, authority system, POPIA masking | ✅ Frozen |

---

## What Changes

Only the visual application shell and module presentation layer.

| Layer | Change |
|---|---|
| `apps/admin` shell | Replace with official shadcn dashboard shell |
| Module pages | Rebuild presentation using shadcn components |
| `packages/ui` | Retain as engineering asset; reduce custom wrappers |
| Theme presets | Integrate as overlays on the official shell, not replacements |

---

## Route and Module Inventory

Complete map of every existing route. Backend contracts are preserved in all cases.

| Route | Keep Route | Replace UI | Reuse Backend | Current UI Pattern | Notes |
|---|---|---|---|---|---|
| `/dashboard` | ✅ | ✅ | ✅ | `DashboardClient` + 7 tabbed sections + 17 widgets | Replace composition with shadcn card grid. Keep all data providers. |
| `/moments` | ✅ | ✅ | ✅ | `DataTable` + `TableToolbar` + `FilterSelect` + `TablePagination` | Rebuild with shadcn Table. Keep `api.moments.list`. |
| `/moments/new` | ✅ | ✅ | ✅ | `FormSection` + `FieldGroup` + `SubmitBar` + raw inputs | Rebuild with shadcn Form + Input + Select + Textarea. Keep `api.moments.create`. |
| `/moments/[id]` | ✅ | ✅ | ✅ | Two-column card layout + broadcast trigger button | Rebuild with shadcn Cards. Keep `api.broadcasts.trigger`. |
| `/broadcasts` | ✅ | ✅ | ✅ | `DataTable` + `TablePagination` | Rebuild with shadcn Table. Keep `api.broadcasts.list`. |
| `/subscribers` | ✅ | ✅ | ✅ | `KPIGrid` + `MetricCard` + `DataTable` + two `FilterSelect` | Rebuild with shadcn Cards + Table. Keep `api.subscribers.list` + `api.subscribers.stats`. |
| `/moderation` | ✅ | ✅ | ✅ | Split layout: advisory table + message table | Rebuild with shadcn Tabs + Table. Keep moderation API clients. |
| `/authority` | ✅ | ✅ | ✅ | `KPIGrid` + `DataTable` + `ActivityFeed` side panel | Rebuild with shadcn Cards + Table + timeline. Keep authority API clients. |
| `/sponsors` | ✅ | ✅ | ✅ | `KPIGrid` + `MetricCard` + `DataTable` + `FilterSelect` | Rebuild with shadcn Cards + Table. Keep `api.sponsors.*`. |
| `/campaigns` | ✅ | ✅ | ✅ | `KPIGrid` + budget progress bars + `DataTable` | Rebuild with shadcn Cards + Progress + Table. Keep `api.campaigns.*`. |
| `/settings` | ✅ | ✅ | ✅ | System health + feature flag toggles + settings editor + session card | Rebuild with shadcn Cards + Switch. Keep `api.settings.*`. |

**No route is removed. No backend call changes. No API contract changes.**

---

## Current UI Components in Use (Audit)

These are the `@unami/ui` components currently consumed by module clients.  
Each must be evaluated: keep as-is, replace with shadcn primitive, or retire.

| Component | Used In | Decision |
|---|---|---|
| `PageHeader` | All 9 modules | Replace — use `h1` + `p` directly per shadcn convention |
| `DataTable` | moments, broadcasts, subscribers, moderation, authority, sponsors, campaigns | Replace — use shadcn `Table` primitives |
| `TableToolbar` | moments, subscribers, sponsors, campaigns | Replace — compose inline with shadcn `Input` + `Button` |
| `TablePagination` | moments, broadcasts, subscribers, sponsors, campaigns | Replace — use shadcn `Pagination` |
| `FilterSelect` | moments, subscribers, sponsors, campaigns, moderation | Replace — use shadcn `Select` |
| `KPIGrid` | subscribers, authority, sponsors, campaigns, settings, dashboard | Replace — use `grid grid-cols-4 gap-4` directly |
| `MetricCard` | subscribers, authority, sponsors, campaigns, settings, dashboard | Replace — use shadcn `Card` + `CardHeader` + `CardContent` directly |
| `ActivityFeed` | authority, dashboard | Replace — compose with shadcn `Card` + timeline markup |
| `QuickActions` | dashboard | Remove — not in shadcn reference pattern |
| `FormSection` | moments/new | Replace — use shadcn `Card` as form section container |
| `FieldGroup` | moments/new | Replace — use `Label` + `Input` directly |
| `SubmitBar` | moments/new | Replace — use `div` with `flex justify-end gap-2` |
| `Card`, `CardHeader`, `CardTitle`, `CardContent` | All modules | Keep — these are already shadcn primitives |
| `Badge` | All modules | Keep — already shadcn-compatible |
| `Button` | moments, moments/new, moments/[id] | Keep — already shadcn-compatible |
| `StatusBadge` | settings, dashboard | Keep for now — evaluate in Phase B |
| `AppShell`, `Sidebar`, `Header`, `MobileNav` | `AdminShell` | Replace entirely with official shadcn dashboard shell |

---

## Build Phases

### Phase A — Official Shell

**Objective:** The admin application looks identical to the official shadcn dashboard. No Moments content yet.

Tasks:
- Clone official shadcn dashboard shell into `apps/admin`
- Wire existing auth (`getOperatorSession`) into the shell
- Wire existing routing (Next.js App Router) — no route changes
- Wire existing theme engine and presets as CSS variable overlays
- Wire command palette to existing NAV structure
- Wire sidebar to existing `NavigationSection[]` type

Definition of done: Open `/dashboard` and see the official shadcn dashboard shell. No Moments widgets. No custom components. Auth works. Sidebar navigates.

---

### Phase B — Shell Integration

**Objective:** The shell behaves exactly like the original while using our existing backend.

Tasks:
- Reconnect `PreferencesPanel` (theme mode, preset, sidebar variant)
- Reconnect `useSidebarCollapsible` preference
- Reconnect session display (name, role, avatar initials) in sidebar footer
- Reconnect "New moment" primary action button
- Reconnect command palette search across all routes
- Reconnect notifications bell (placeholder — no backend yet)
- Verify breadcrumb renders correct page title per route

Definition of done: Every shell interaction works. Preferences persist. Session displays correctly. Navigation is complete.

---

### Phase C — Dashboard

**Objective:** The Moments dashboard is operational inside the shell.

Tasks:
- Implement status banner (green/amber/red platform state)
- Implement 4-col KPI row using shadcn `Card` directly
- Implement 3-col operations row (Broadcast Queue, Moderation, Scheduled)
- Implement 3-col bottom row (Platform Health, Recent Moments, Recent Broadcasts)
- Wire all existing data providers from `dashboard/providers/`
- Preserve realtime subscriptions (`useRealtimeTable`)
- Preserve all 7 tab sections (Overview, Operations, Publishing, Audience, Governance, Commercial, Platform)

Definition of done: Dashboard feels native to the shell. All data loads. Realtime works. Tabs switch correctly.

---

### Phase D — Module Migration

Migrate modules one by one. Each module must inherit shell typography, spacing, interactions, forms, tables, dialogs, and navigation without exception.

**Migration order:**

| # | Module | Route | Primary Pattern |
|---|---|---|---|
| 1 | Moments list | `/moments` | shadcn Table + search + filter + pagination |
| 2 | Create moment | `/moments/new` | shadcn Form + Card sections |
| 3 | Moment detail | `/moments/[id]` | shadcn Cards + broadcast action |
| 4 | Broadcasts | `/broadcasts` | shadcn Table + pagination |
| 5 | Subscribers | `/subscribers` | shadcn Cards (KPIs) + Table + filters |
| 6 | Moderation | `/moderation` | shadcn Tabs + two Tables |
| 7 | Authority | `/authority` | shadcn Cards + Table + timeline |
| 8 | Sponsors | `/sponsors` | shadcn Cards + Table + filter |
| 9 | Campaigns | `/campaigns` | shadcn Cards + Progress + Table |
| 10 | Settings | `/settings` | shadcn Cards + Switch + inline edit |

**Module standard — every page must have:**

```
Page header (h1 + description paragraph)
Toolbar (search input + filter selects + primary action button)
Primary content (table or card grid)
Empty state (centered message when no data)
Loading state (skeleton)
Error state (inline error message)
```

No exceptions.

---

## Component Policy

1. Prefer official shadcn components first.
2. Use `packages/ui` components only when they provide genuine reusable value that shadcn does not cover.
3. Do not wrap shadcn components in custom abstractions.
4. Do not create new layout components — use Tailwind grid/flex directly.
5. `Card`, `Badge`, `Button` from `packages/ui` are already shadcn-compatible — keep them.
6. `DataTable`, `KPIGrid`, `MetricCard`, `PageHeader`, `ActivityFeed`, `FormSection`, `FieldGroup`, `SubmitBar` — retire in favour of direct shadcn composition.

---

## Theme Strategy

The official shadcn shell uses CSS custom properties for all colour tokens.  
Our existing presets (Brutalist, Soft Pop, Tangerine) already write to the same token names.

Integration approach:
- Shell renders with default shadcn tokens
- `data-theme-preset` attribute on `:root` activates preset token overrides
- Preset CSS blocks in `globals.css` remain as-is
- No layout changes per preset — only colour, radius, shadow, typography

Presets become overlays. Not replacements.

---

## Acceptance Criteria

The rebuild is complete when:

- [ ] The application visually matches the quality and interaction patterns of the official shadcn dashboard
- [ ] Every existing backend API call continues to work without modification
- [ ] Every Moments module is integrated into the shell rather than redefining it
- [ ] Themes and presets enhance the official design instead of replacing it
- [ ] Operators experience a single coherent interface from login to settings
- [ ] No module introduces its own layout system
- [ ] No module introduces its own navigation
- [ ] No module introduces its own typography scale
- [ ] The build passes with zero TypeScript errors
- [ ] The application is deployable to Vercel without configuration changes

---

## Rules (Non-Negotiable)

1. Never redesign the shell.
2. Never invent a new layout system.
3. Never create another navigation architecture.
4. Moments modules adapt to the shell — the shell never adapts to Moments.
5. Every page feels like it naturally belongs inside the dashboard.
6. No page looks custom. No module feels disconnected.
7. Backend contracts are immutable throughout this rebuild.
