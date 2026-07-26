# Project Roadmap
## Ecommerce Operations — Dashboard Platform

---

This roadmap defines what gets built and in what order.
Amazon Q follows this roadmap. It does not decide priorities.

---

## Phase 1 — Dashboard Platform Shell

> Objective: Establish the reusable shell in `packages/ui`. Nothing in `apps/operations` until this is complete.

```
Turborepo scaffold
  pnpm workspaces
  packages/ui
  packages/types
  packages/api-client
  apps/operations
        ↓
packages/ui/dashboard/shell
  AppShell (slot-based: SidebarSlot, HeaderSlot, ContentSlot, FooterSlot)
  Sidebar (renders NavigationSection[])
  Header (search, notifications, user menu)
  MobileNav (drawer on mobile)
        ↓
packages/ui/dashboard/navigation
  navigation.types.ts (NavigationItem, NavigationSection)
  PageHeader
  Breadcrumbs
  SectionTitle
        ↓
Theme system
  Carry from dashboard-platform-export
  Wire ThemeBootScript in root layout
  Wire PreferencesStoreProvider
  Verify all presets (Default, Brutalist, Soft Pop, Tangerine)
        ↓
apps/operations
  Wire AppShell
  Define operationsNavigation config
  Verify: responsive, light/dark, sidebar variants, mobile drawer
```

**Done when:** Shell renders with correct navigation, theme switching works, mobile verified.

---

## Phase 2 — Shared Component Library

> Objective: Build all reusable dashboard components in `packages/ui` before any module page.

```
packages/ui/dashboard/data-display
  MetricCard (title, value, trend)
  KPIGrid (responsive MetricCard grid)
  ActivityFeed (timestamped event list)
        ↓
packages/ui/dashboard/charts
  AnalyticsCard (chart wrapper — title, chart, legend)
        ↓
packages/ui/dashboard/tables
  DataTable (TanStack Table — sort, filter, paginate, row actions)
  FilterBar (search + filter controls)
        ↓
packages/ui/dashboard/feedback
  EmptyState (icon, message, optional CTA)
  LoadingCard (skeleton placeholder)
  StatusBadge (colour-coded status pill)
        ↓
packages/ui/dashboard/actions
  QuickActions (action button group)
```

**Done when:** All components render correctly in light/dark, responsive, with loading/empty/error states.

---

## Phase 3 — Operations Module Pages

> Objective: Assemble pages in `apps/operations` using only components from `packages/ui`.

```
Dashboard
  KPIGrid (Today's Orders, Revenue, Inventory Alerts, Active Customers)
  AnalyticsCard (Sales Trend)
  ActivityFeed (Recent Orders)
        ↓
Orders
  PageHeader + FilterBar + DataTable
        ↓
Products
  PageHeader + FilterBar + DataTable
        ↓
Inventory
  PageHeader + FilterBar + DataTable
        ↓
Customers
  PageHeader + FilterBar + DataTable
        ↓
Reports
  PageHeader + export actions
        ↓
Notifications
  ActivityFeed pattern
        ↓
Settings
  PageHeader + form sections
```

**Done when:** All pages render with static data, correct layout, all three states (loading/empty/error).

---

## Phase 4 — API Integration

> Objective: Replace static data with live API data. No UI changes required.

```
packages/api-client/spree
  Orders
  Products
  Inventory
        ↓
packages/api-client/laravel
  Auth
  Users
  Permissions
        ↓
Wire service layer in apps/operations
  *-queries.ts (server-only GET)
  *.ts (client mutations)
        ↓
Verify all pages with live data
Verify loading, error, empty states end-to-end
```

**Done when:** All pages consume live API data. No mock data remains.

---

## Phase 5 — Authentication and Permissions

> Objective: Secure the operations app with Azure AD and role-based access.

```
Azure AD integration (MSAL)
  Login page
  Token exchange with Laravel
  Session via cookies
        ↓
Permission system
  Role definitions
  PermissionGate component
  Gate actions (Create, Edit, Delete) per module
        ↓
Route protection
  Middleware redirects unauthenticated users
  Unauthorised page
```

**Done when:** Login flow works end-to-end, protected routes redirect correctly, actions gated by role.

---

## Phase 6 — Notifications, Reports, Settings

> Objective: Complete remaining system modules.

```
Notifications
  Real-time or polling from Laravel
        ↓
Reports
  Export triggers (PDF/Excel via Laravel)
        ↓
Settings
  User profile
  App preferences
```

**Done when:** All modules functional with live data.

---

## Future Phases (Planned)

| Phase | Scope |
|-------|-------|
| Vendors | Vendor management module |
| Marketplace | Multi-vendor marketplace operations |
| Analytics | Advanced reporting and forecasting |
| Mobile | Progressive Web App enhancements |

---

## Reference Implementation

ITPMS is the reference implementation of the dashboard platform.
It proves the design works. It is not copied into this repository.

```
ITPMS (reference)
      ↓
dashboard-platform-export (specification + theme files)
      ↓
packages/ui (reusable implementation)
      ↓
apps/operations (first consumer)
```

---

END OF ROADMAP
