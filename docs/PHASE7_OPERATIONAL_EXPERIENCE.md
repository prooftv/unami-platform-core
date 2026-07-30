# Phase 7 — Operational Experience
# Moments v2 Admin — Complete Implementation Record

**Status:** Complete
**Applies to:** `apps/admin`, `packages/ui`, `packages/api`, `supabase/functions/settings`
**Commits:** `02124a9` (7A) → `0ae75b6` (7B) → `4ce7320` (7C/7D/7E)
**Build:** 2 successful, 0 TypeScript errors

---

## Overview

Phase 7 transforms the Moments admin from a data-wired dashboard into a fully operational command centre. It is divided into five sub-phases, each a distinct capability increment:

| Sub-phase | Name | Scope |
|---|---|---|
| 7A | Operational Experience Foundation | Preferences, themes, presets, sidebar, skeletons, trends |
| 7B | Chart System | Platform chart library in `packages/ui`, 9 widgets wired |
| 7C | Platform UX Polish | `FilterSelect` in `packages/ui`, pagination across all modules |
| 7D | Realtime | P0 widget live subscriptions |
| 7E | Settings CRUD | Feature flag toggles, system settings editor, `settings` Edge Function |

---

## Phase 7A — Operational Experience Foundation

### Problem

The dashboard loaded with no visual feedback, no theme persistence, no preset switching, and no sidebar control. Operators had no way to personalise the interface.

### What was built

**Auth bug fix**
`supabase/functions/auth/index.ts` — `authority_profiles` query used `.eq('user_id', user.id)` but the schema column is `user_identifier TEXT`. Fixed.

**Server preferences** (`apps/admin/src/lib/preferences/server.ts`)
Reads `theme_mode`, `theme_preset`, `font`, `content_layout`, `navbar_style`, `sidebar_collapsible` from cookies server-side. Falls back to `PREFERENCE_DEFAULTS`. Used in root layout to hydrate `PreferencesStoreProvider` without a client round-trip.

**Client preferences** (`apps/admin/src/lib/preferences/client.ts`)
Hooks: `useThemeMode`, `useThemePreset`, `useSidebarCollapsible`, `useContentLayout`. Each setter writes to the Zustand store, applies the DOM attribute immediately, and persists to a 1-year cookie.

**Root layout** (`apps/admin/src/app/layout.tsx`)
Async server component. Reads server preferences, wraps children in `PreferencesStoreProvider`. Contains a synchronous inline `<script>` that sets all `data-*` attributes on `document.documentElement` before React hydrates — eliminates flash of unstyled content (FOUC).

**Preset CSS** (`apps/admin/src/app/globals.css`)
All three preset CSS blocks (Brutalist, Soft Pop, Tangerine) inlined directly. CSS files cannot be imported via `@moments/ui` package alias — inlining is the correct solution.

**PreferencesPanel** (`apps/admin/src/app/(admin)/components/PreferencesPanel.tsx`)
Slide-in panel from right. Theme mode segmented control, preset swatches showing actual `primary.light` colours, content width toggle, sidebar collapse toggle. Closes on Escape or outside click.

**AdminShell** (`apps/admin/src/app/(admin)/components/AdminShell.tsx`)
Collapse toggle in sidebar footer (ChevronLeft/Right icon). `SlidersHorizontal` icon in header opens PreferencesPanel.

**Dashboard skeletons** (`apps/admin/src/app/(admin)/dashboard/DashboardSections.tsx`)
`KPIGridSkeleton` and `WidgetGridSkeleton` exported. `DashboardClient` wraps active section in `<Suspense>` with skeleton fallback. All section root divs have `animate-in fade-in duration-300`.

**Trend indicators** (`apps/admin/src/app/(admin)/dashboard/widgets/OverviewWidgets.tsx`)
`MetricCard` `trend` prop wired to live metrics: broadcast ratio on Total Moments, success rate on Broadcasts Sent, active/total ratio on Active Subscribers.

---

## Phase 7B — Chart System

### Architecture decision

Recharts is installed in `packages/ui`, not `apps/admin`.

Charts are a platform capability. MetricCard, KPIGrid, ActivityFeed, and AnalyticsCard already live in `packages/ui`. Charts belong in exactly the same layer. Every future application — Spree Operations Dashboard, Umkhandlu Intelligence Dashboard, ITPMS — should inherit the same chart primitives without reinstalling or reimplementing them.

This is the same reasoning that puts the shell, navigation, tables, and forms in `packages/ui`.

### Chart API

All chart components are generic. They accept typed data props with no Moments-specific concepts. Any application can use them.

```typescript
// Generic data point — any key/value record
type ChartDataPoint = Record<string, string | number>;

// Series configuration
type ChartSeries = {
  key: string;       // dataKey in the data array
  label?: string;    // display name in legend/tooltip
  color?: string;    // override palette colour
};

// Pie-specific (label + value required)
type PieDataPoint = { label: string; value: number; color?: string };
```

### Colour palette

Charts use CSS variables so presets apply automatically:

```
hsl(var(--primary))
hsl(var(--chart-2, 220 70% 50%))
hsl(var(--chart-3, 160 60% 45%))
hsl(var(--chart-4, 30 80% 55%))
hsl(var(--chart-5, 280 65% 60%))
```

Brutalist, Soft Pop, and Tangerine presets all affect chart colours through `--primary` without any chart-specific code.

### Empty states

All charts render a dashed-border empty state when `data` is empty or undefined. No broken chart frames.

### Widgets wired

| Widget | Chart type | Data source |
|---|---|---|
| `SubscriberGrowthWidget` | AreaChart | `DailyStats[].newSubscribers` |
| `DeliveryScheduleWidget` | BarChart | `SubscriberStats.bySchedule` |
| `RegionalSubscriberWidget` | BarChart | `SubscriberStats.byRegion` |
| `DeliverySuccessWidget` | LineChart | Per-broadcast `successCount/recipientCount` |
| `ContentSourceWidget` | PieChart | Moment `contentSource` counts |
| `CategoryDistributionWidget` | BarChart | `CategoryStats[].momentCount` |
| `RegionalDistributionWidget` | BarChart | `RegionalStats[].momentCount` |
| `AdvisoryConfidenceWidget` | BarChart | `ModerationStats` breakdown |
| `RevenueAnalyticsWidget` | BarChart | `RevenueAnalytics` aggregate fields |
| `BudgetUtilisationWidget` | BarChart | Utilisation percentage |

---

## Phase 7C — Platform UX Polish

### FilterSelect

Added to `packages/ui/src/forms/FormPrimitives.tsx`.

```typescript
type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
};
```

Generic. No application concepts. Replaces raw `<select>` elements that were duplicated across every module with inconsistent inline Tailwind classes.

Consumed by: `MomentsClient`, `SubscribersClient`, `SponsorsClient`, `CampaignsClient`.

### Pagination

All 5 list module pages previously passed `page: 1` hardcoded to the API and had `onPageChange={() => {}}` no-ops in the client.

**Pattern applied uniformly:**

Server page component:
```typescript
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));
  const result = await api.resource.list({ page, limit: 20 });
  return <Client initialData={result} currentPage={page} />;
}
```

Client component:
```typescript
function handlePageChange(page: number) {
  router.push(`/route?page=${page}`);
}
```

Modules updated: `moments`, `subscribers`, `sponsors`, `campaigns`, `broadcasts`.

---

## Phase 7D — Realtime

### Architecture

Realtime subscriptions live in `apps/admin/src/lib/realtime/` — not in `packages/ui`.

`packages/ui` has no Supabase dependency and must never have one. Realtime is application-level infrastructure. The hook uses the browser Supabase client directly, which is correct — it is an `apps/admin` concern.

### useRealtimeTable

```typescript
export function useRealtimeTable(
  table: string,
  onUpdate: () => void,
  enabled = true,
)
```

Subscribes to `postgres_changes` (`event: '*'`) on the given table. Calls `onUpdate()` on any INSERT, UPDATE, or DELETE. Cleans up the channel on unmount. Uses a ref for `onUpdate` to avoid stale closure issues.

### P0 widgets wired

| Widget | Table subscribed | Refresh mechanism |
|---|---|---|
| `BroadcastQueueWidget` | `moments` | `router.refresh()` |
| `ModerationQueueWidget` | `messages` | `router.refresh()` |

`router.refresh()` triggers a server-side re-fetch of the page's server components, which re-runs the data providers and passes fresh data to the widgets. No client-side state management required.

---

## Phase 7E — Settings CRUD

### Settings Edge Function

`supabase/functions/settings/index.ts` — deployed to `dpydmpydyfrrdhuezvgi`.

Routes:

| Method | Path | Role | Action |
|---|---|---|---|
| GET | `/settings/flags` | all | List all feature flags |
| POST | `/settings/flags/:flagKey` | superadmin | Toggle `enabled`, write audit log |
| GET | `/settings/system` | all | List all system settings |
| POST | `/settings/system/:settingKey` | superadmin | Update `setting_value`, write audit log |

Every write operation calls `logAudit()` from `_shared/auth.ts` — all changes are traceable in `audit_logs`.

### Settings API client

`packages/api/src/clients/settings.ts` — follows identical pattern to all other API clients.

Exported types: `FeatureFlag`, `SystemSetting`.

### SettingsClient

`apps/admin/src/app/(admin)/settings/SettingsClient.tsx` — rewritten from static display to live CRUD.

**Feature flags:**
- Superadmin: toggle switches (accessible `role="switch"`, `aria-checked`)
- Other roles: read-only `Badge` (enabled/disabled)
- Optimistic UI: state updated immediately on success

**System settings:**
- Superadmin: inline edit (click Edit → input → Save/Cancel)
- Other roles: read-only value display
- Inline feedback on success/failure

**Data flow:** All mutations go through `packages/api` typed client. No direct Supabase calls from the UI component.

---

## Files Created

| File | Purpose |
|---|---|
| `apps/admin/src/lib/preferences/server.ts` | Server-side cookie preference reader |
| `apps/admin/src/lib/preferences/client.ts` | Client hooks with store + DOM + cookie persistence |
| `apps/admin/src/app/(admin)/components/PreferencesPanel.tsx` | Slide-in preferences panel |
| `apps/admin/src/lib/realtime/useRealtimeTable.ts` | Realtime subscription hook |
| `packages/api/src/clients/settings.ts` | Settings API client |
| `supabase/functions/settings/index.ts` | Settings Edge Function |

---

## Files Modified

| File | Change |
|---|---|
| `supabase/functions/auth/index.ts` | Fixed `user_id` → `user_identifier` bug |
| `apps/admin/src/app/layout.tsx` | Async server component, FOUC prevention, PreferencesStoreProvider |
| `apps/admin/src/app/globals.css` | Preset CSS blocks inlined |
| `apps/admin/src/app/(admin)/components/AdminShell.tsx` | Collapse toggle, preferences panel trigger |
| `apps/admin/src/app/(admin)/dashboard/DashboardSections.tsx` | Skeleton exports, fade-in animations |
| `apps/admin/src/app/(admin)/dashboard/DashboardClient.tsx` | Suspense with skeleton fallback |
| `apps/admin/src/app/(admin)/dashboard/widgets/OverviewWidgets.tsx` | Trend indicators, Realtime subscriptions |
| `apps/admin/src/app/(admin)/dashboard/widgets/AudienceWidgets.tsx` | AreaChart + BarChart with real data |
| `apps/admin/src/app/(admin)/dashboard/widgets/OperationsWidgets.tsx` | LineChart with real data |
| `apps/admin/src/app/(admin)/dashboard/widgets/PublishingWidgets.tsx` | PieChart + BarChart with real data |
| `apps/admin/src/app/(admin)/dashboard/widgets/GovernanceWidgets.tsx` | BarChart with real data |
| `apps/admin/src/app/(admin)/dashboard/widgets/CommercialWidgets.tsx` | BarChart with real data |
| `apps/admin/src/app/(admin)/moments/page.tsx` | searchParams pagination |
| `apps/admin/src/app/(admin)/moments/MomentsClient.tsx` | currentPage, handlePageChange, FilterSelect |
| `apps/admin/src/app/(admin)/subscribers/page.tsx` | searchParams pagination |
| `apps/admin/src/app/(admin)/subscribers/SubscribersClient.tsx` | currentPage, handlePageChange, FilterSelect |
| `apps/admin/src/app/(admin)/sponsors/page.tsx` | searchParams pagination |
| `apps/admin/src/app/(admin)/sponsors/SponsorsClient.tsx` | currentPage, handlePageChange, FilterSelect |
| `apps/admin/src/app/(admin)/campaigns/page.tsx` | searchParams pagination |
| `apps/admin/src/app/(admin)/campaigns/CampaignsClient.tsx` | currentPage, handlePageChange, FilterSelect |
| `apps/admin/src/app/(admin)/broadcasts/page.tsx` | searchParams pagination |
| `apps/admin/src/app/(admin)/broadcasts/BroadcastsClient.tsx` | currentPage, handlePageChange |
| `apps/admin/src/app/(admin)/settings/page.tsx` | Fetches flags + system settings |
| `apps/admin/src/app/(admin)/settings/SettingsClient.tsx` | Live toggles + inline edit |
| `packages/ui/src/charts/Charts.tsx` | Full rewrite — real Recharts components |
| `packages/ui/src/forms/FormPrimitives.tsx` | FilterSelect added |
| `packages/api/src/index.ts` | settings client registered, types exported |

---

## Dependency Changes

| Package | Location | Version | Reason |
|---|---|---|---|
| `recharts` | `packages/ui` | `^3.10.1` | Platform chart library |

---

## Architecture Compliance Verification

| Rule | Status |
|---|---|
| `packages/ui` has no Supabase imports | ✅ Clean |
| `packages/ui` has no auth imports | ✅ Clean |
| `packages/ui` has no app-specific concepts | ✅ Clean |
| `packages/shared` not modified | ✅ Clean |
| `packages/api` clients follow existing pattern | ✅ Clean |
| All mutations go through `packages/api` | ✅ Clean |
| No direct Supabase calls from UI components | ✅ Clean |
| Realtime hook lives in `apps/admin` | ✅ Correct layer |
| Edge Function is only layer touching DB directly | ✅ Clean |
| `000_initial_schema.sql` not modified | ✅ Immutable |
| `.env.example` not modified | ✅ Immutable |

---

## Build Verification

```
pnpm turbo build

Tasks:    2 successful, 2 total
Cached:    0 cached, 2 total
TypeScript errors: 0
```

---

## What Phase 7 Does Not Include

Phase 7F (production integrations) was deferred per the original product-builder priority order:

- WhatsApp live integration (webhook live testing)
- n8n workflow automation
- Vercel environment variable sync
- Error monitoring (Sentry or equivalent)

These are Phase 7F scope and require production traffic to validate meaningfully.

---

*This document is the complete implementation record for Phase 7.*
*Read alongside `CHANGELOG.md` and `PROJECT_STATUS.md` for full context.*
