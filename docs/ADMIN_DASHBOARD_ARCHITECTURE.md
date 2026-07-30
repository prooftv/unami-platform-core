# Admin Dashboard Architecture
# Moments v2 — Operational Command Centre

**Status:** Architecture Phase — No code. Blueprint only.
**Applies to:** `apps/admin`
**Consumes:** `packages/ui`, `packages/api`, `packages/shared`
**Author:** Platform Architect
**Phase:** 6A

---

## 1. Dashboard Philosophy

### The Admin is Not a CRUD Application

A CRUD application organises itself around database tables. Its primary concern is creating, reading, updating and deleting records. Navigation leads to lists. Lists lead to forms. Forms write to tables. The operator is a data entry clerk.

Moments Admin is not this.

Moments Admin is an **operational command centre** for a WhatsApp-first community information platform. Its primary concern is the health, throughput and impact of a live publishing operation. The operator is a community publisher, a broadcast manager, a moderation supervisor and a platform steward — often simultaneously.

The distinction matters because it changes everything about how the interface is structured:

| CRUD Application | Operational Command Centre |
|---|---|
| Navigate to a table | See the operation at a glance |
| Open a record | Act on a signal |
| Fill a form | Trigger a workflow |
| Save and return | Monitor the outcome |
| One task at a time | Parallel situational awareness |

The dashboard is the **primary product**. It is the first thing an operator sees on login and the surface they return to between tasks. It must answer the question: *what is happening right now, and what needs my attention?*

Individual modules — Moments, Broadcasts, Subscribers, Moderation, Authority, Sponsors, Campaigns, Settings — are **secondary workspaces**. They exist to support deep work on a specific domain. They feed information back to the dashboard. They do not replace it.

### The Operator Mental Model

An operator opening Moments Admin should immediately know:

1. **Platform health** — is everything running? Any failures?
2. **Today's activity** — how many moments published, broadcasts sent, subscribers gained?
3. **What needs action** — moderation queue depth, failed broadcasts, pending approvals
4. **What is scheduled** — upcoming broadcasts, campaign deadlines
5. **Recent history** — what happened in the last 24 hours

Only after this situational awareness does the operator navigate into a module to perform a specific task.

---

## 2. Information Architecture

The dashboard is organised into seven sections. Each section represents a distinct operational concern. Sections are not tabs — they are zones within a single scrollable dashboard surface, or selectable views in a tabbed overview depending on screen size.

---

### Overview

**Purpose:** The landing surface. Answers "what is happening right now."

Contains:
- Operational Health widget — system status at a glance
- Today's KPIs — moments published, broadcasts sent, subscribers active, delivery rate
- Broadcast Queue — moments pending broadcast, scheduled moments
- Moderation Queue — messages and advisories awaiting review
- Recent Activity Feed — last 10 significant events across all modules
- Quick Actions — New Moment, Trigger Broadcast, Review Flagged, View Subscribers

This section is always visible. It is the default view on login. It is never replaced by a module.

---

### Operations

**Purpose:** Publishing pipeline health and throughput.

Contains:
- Broadcast Queue widget — moments in draft, scheduled, processing states
- Delivery Success Rate — rolling 7-day success percentage
- Failed Broadcasts — any broadcasts with failure_count > 0
- Automation Status — intent processor health, batch processing status
- Recent Broadcasts — last 5 broadcast records with recipient counts

This section answers: *is the publishing pipeline healthy and moving?*

---

### Publishing

**Purpose:** Content creation and scheduling workspace summary.

Contains:
- Recent Moments — last 10 moments with status badges
- Upcoming Scheduled Moments — moments with scheduled_at in the future
- Content Source Breakdown — admin vs community vs whatsapp vs campaign
- Category Distribution — moments by category (chart)
- Regional Distribution — moments by region (chart)

This section answers: *what content exists and what is coming?*

---

### Audience

**Purpose:** Subscriber base health and engagement.

Contains:
- Subscriber Growth — new subscribers over time (chart)
- Active Subscribers — opted-in count vs total
- Opt-out Rate — rolling 7-day opt-out percentage
- Delivery Schedule Breakdown — instant vs morning vs evening vs weekly
- Regional Subscriber Distribution — subscribers by region preference
- Top Categories — most subscribed categories

This section answers: *who is listening and are they engaged?*

---

### Governance

**Purpose:** Moderation, authority system and compliance oversight.

Contains:
- Moderation Queue — pending messages and advisories count with escalation flags
- Authority Activity — recent authority profile actions, blast radius usage
- Advisory Confidence Distribution — AI risk score histogram
- Compliance Score Average — rolling compliance score across recent broadcasts
- POPIA Status — data retention indicators, opt-out processing status

This section answers: *is the platform operating safely and within compliance?*

---

### Commercial

**Purpose:** Sponsor and campaign financial performance.

Contains:
- Campaign Performance — active campaigns with budget utilisation
- Sponsor Overview — active sponsors by tier (bronze/silver/gold/platinum)
- Revenue Analytics — 30-day revenue, budget allocated vs spent
- Budget Utilisation — monthly budget burn rate
- Cost per Broadcast — average cost per recipient across recent broadcasts

This section answers: *is the commercial operation healthy and on budget?*

---

### Platform

**Purpose:** System health, infrastructure and configuration status.

Contains:
- API Health — Edge Function response times and error rates
- Storage Usage — Supabase Storage utilisation
- System Health — database connection, auth service, realtime status
- Feature Flags — current enabled/disabled state of all flags
- Error Log Summary — recent high/critical errors
- Rate Limit Status — current rate limit utilisation by endpoint

This section answers: *is the underlying platform healthy?*

---

## 3. Dashboard Widgets

Widgets are the atomic units of the dashboard. Each widget is a self-contained visual unit that:
- Has a single data concern
- Refreshes independently
- Degrades gracefully when data is unavailable
- Uses existing `packages/ui` components as its visual foundation

Widgets are **specified here** and **implemented in Phase 6B/6C**. No React code in this document.

---

### Operational Health

**Type:** Status grid
**Data source:** Edge Function health checks, Supabase status
**UI primitive:** `Card` + `Badge` (success/warning/destructive)
**Refresh:** 60 seconds
**Displays:**
- Database: connected / degraded / down
- Auth service: healthy / degraded
- Edge Functions: all healthy / N failing
- Storage: healthy / degraded
- Realtime: connected / disconnected
**Failure mode:** Shows last known state with stale timestamp

---

### Today's KPIs

**Type:** Metric grid
**Data source:** `analytics_events` aggregated by day
**UI primitive:** `KPIGrid` + `MetricCard` (4 columns desktop, 2 tablet, 1 mobile)
**Refresh:** 5 minutes
**Metrics:**
- Moments Published Today (count, trend vs yesterday)
- Broadcasts Sent Today (count, trend vs yesterday)
- New Subscribers Today (count, trend vs yesterday)
- Delivery Rate Today (percentage, trend vs yesterday)
**Failure mode:** Shows `—` with last updated timestamp

---

### Broadcast Queue

**Type:** Status list
**Data source:** `moments` where status IN (draft, scheduled) + `broadcasts` where status = processing
**UI primitive:** `Card` + `DataTable` (compact)
**Refresh:** 30 seconds
**Displays:** Title, status badge, scheduled_at or created_at, region, quick broadcast action
**Failure mode:** Empty state with retry

---

### Recent Activity

**Type:** Chronological feed
**Data source:** `audit_logs` + `analytics_events` joined, last 20 events
**UI primitive:** `ActivityFeed`
**Refresh:** 60 seconds
**Event types shown:**
- Moment created / broadcasted / scheduled
- Broadcast completed / failed
- Subscriber joined / left
- Advisory escalated
- Authority action taken
**Failure mode:** Shows cached feed with stale indicator

---

### Moderation Queue

**Type:** Alert widget
**Data source:** `messages` where moderation_status = pending + `advisories` where escalation_suggested = true
**UI primitive:** `Card` + count badges + `Button` (Review)
**Refresh:** 30 seconds
**Displays:**
- Pending messages count
- Escalated advisories count
- Oldest pending item age
- Direct link to Moderation module
**Failure mode:** Shows last known count with warning

---

### Subscriber Growth

**Type:** Time series chart
**Data source:** `analytics_events` where event_type = subscriber_joined, grouped by day, last 30 days
**UI primitive:** `AnalyticsCard` + `AreaChart`
**Refresh:** 10 minutes
**Displays:** Daily new subscribers, 7-day rolling average line
**Failure mode:** Empty chart with message

---

### Campaign Performance

**Type:** Progress list
**Data source:** `campaigns` where status = active, joined with `budget_transactions`
**UI primitive:** `Card` + progress bars
**Refresh:** 10 minutes
**Displays per campaign:** Name, sponsor, budget used / total, broadcasts sent, status badge
**Failure mode:** Empty state

---

### Authority Activity

**Type:** Activity list
**Data source:** `authority_audit_log` last 10 entries
**UI primitive:** `ActivityFeed`
**Refresh:** 5 minutes
**Displays:** Action type, authority level, scope, blast radius applied, timestamp
**Failure mode:** Empty state

---

### Automation Status

**Type:** Status indicators
**Data source:** `moment_intents` grouped by status
**UI primitive:** `Card` + status rows
**Refresh:** 60 seconds
**Displays:**
- Pending intents count
- Processing intents count
- Failed intents count (with alert if > 0)
- Last processed timestamp
**Failure mode:** Warning state

---

### System Health

**Type:** Infrastructure status
**Data source:** Supabase health endpoint + Edge Function ping
**UI primitive:** `Card` + `StatusBadge`
**Refresh:** 60 seconds
**Displays:** Database, Auth, Storage, Realtime, Edge Functions — each with latency
**Failure mode:** Degraded state shown explicitly

---

### Storage Usage

**Type:** Utilisation meter
**Data source:** Supabase Storage API
**UI primitive:** `Card` + progress bar
**Refresh:** 30 minutes
**Displays:** Used / total storage, breakdown by bucket (media, avatars)
**Failure mode:** Shows last known value

---

### API Health

**Type:** Latency table
**Data source:** Edge Function response time logs from `error_logs`
**UI primitive:** `AnalyticsCard` + `DataTable` (compact)
**Refresh:** 5 minutes
**Displays per function:** Name, avg response time, error rate last 24h, last error
**Failure mode:** Empty state

---

### Delivery Success

**Type:** Gauge + trend
**Data source:** `broadcasts` last 30 days, success_count / recipient_count
**UI primitive:** `AnalyticsCard` + `LineChart`
**Refresh:** 10 minutes
**Displays:** Rolling success rate percentage, 30-day trend line, best/worst day
**Failure mode:** Shows `—`

---

### Quick Actions

**Type:** Action grid
**Data source:** None — navigation only
**UI primitive:** `QuickActions`
**Actions:**
- New Moment → `/moments/new`
- View Broadcast Queue → `/moments?status=draft`
- Review Moderation → `/moderation`
- View Subscribers → `/subscribers`
- View Campaigns → `/campaigns`
- Platform Settings → `/settings`
**Failure mode:** N/A — always renders

---

### Recent Moments

**Type:** Compact list
**Data source:** `moments` ordered by created_at desc, limit 5
**UI primitive:** `Card` + compact rows
**Refresh:** 2 minutes
**Displays:** Title, status badge, region, category, created_at
**Failure mode:** Empty state

---

### Upcoming Scheduled Moments

**Type:** Timeline list
**Data source:** `moments` where status = scheduled, ordered by scheduled_at asc
**UI primitive:** `Card` + timeline rows
**Refresh:** 2 minutes
**Displays:** Title, scheduled_at (relative time), region, category, countdown
**Failure mode:** Empty state with message "No scheduled moments"

---

### Recent Broadcasts

**Type:** Compact results list
**Data source:** `broadcasts` joined with `moments`, ordered by broadcast_started_at desc, limit 5
**UI primitive:** `Card` + compact rows with success rate inline
**Refresh:** 2 minutes
**Displays:** Moment title, recipient count, success rate, status badge, completed_at
**Failure mode:** Empty state

---

## 4. Dashboard Layout

The dashboard uses `AppShell` from `packages/ui/src/shell/AppShell.tsx` as its outer container. The sidebar is always present on desktop. Content fills the main area.

---

### Desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar (w-60)          │ Header (sticky)                        │
│                         │────────────────────────────────────────│
│  Moments v2             │ Overview | Operations | Publishing |   │
│  Admin                  │ Audience | Governance | Commercial |   │
│                         │ Platform                               │
│  ── Content ──          │────────────────────────────────────────│
│  Dashboard              │                                        │
│  Moments                │  [Today's KPIs — 4 columns]           │
│  Broadcasts             │                                        │
│  Campaigns              │  [Broadcast Queue] [Moderation Queue] │
│                         │                                        │
│  ── Community ──        │  [Recent Activity] [Quick Actions]    │
│  Subscribers            │                                        │
│  Moderation             │  [Subscriber Growth — full width]     │
│  Authority              │                                        │
│                         │  [Delivery Success] [API Health]      │
│  ── Commerce ──         │                                        │
│  Sponsors               │  [Recent Moments] [Upcoming Scheduled]│
│                         │                                        │
│  ── System ──           │                                        │
│  Settings               │                                        │
│                         │                                        │
│  ─────────────          │                                        │
│  [user] [role]          │                                        │
│  Sign out               │                                        │
└─────────────────────────────────────────────────────────────────┘
```

Grid system: 12-column CSS grid within `ContentLayout`.
- Full-width widgets: 12 columns
- Half-width widgets: 6 columns
- Third-width widgets: 4 columns
- KPI cards: 3 columns each (4 × 3 = 12)

Section tabs render as a horizontal tab bar below the header, above the widget grid.

---

### Tablet (768px – 1023px)

```
┌──────────────────────────────────────────┐
│ Header (sticky) + hamburger menu         │
│──────────────────────────────────────────│
│ Section tabs (scrollable horizontal)     │
│──────────────────────────────────────────│
│                                          │
│  [KPI] [KPI]   [KPI] [KPI]              │
│  (2 columns)                             │
│                                          │
│  [Broadcast Queue — full width]          │
│                                          │
│  [Moderation Queue] [Quick Actions]      │
│  (2 columns)                             │
│                                          │
│  [Recent Activity — full width]          │
│                                          │
│  [Subscriber Growth — full width]        │
│                                          │
└──────────────────────────────────────────┘
```

Sidebar collapses to `MobileNav` drawer (hamburger trigger in header).
Grid collapses to 2-column layout.
Section tabs scroll horizontally.

---

### Mobile (< 768px)

```
┌──────────────────────────┐
│ Header + hamburger       │
│──────────────────────────│
│ Section tabs (scroll)    │
│──────────────────────────│
│                          │
│  [KPI — full width]      │
│  [KPI — full width]      │
│  [KPI — full width]      │
│  [KPI — full width]      │
│                          │
│  [Broadcast Queue]       │
│                          │
│  [Moderation Queue]      │
│                          │
│  [Quick Actions]         │
│                          │
│  [Recent Activity]       │
│                          │
└──────────────────────────┘
```

Single column. All widgets stack vertically.
Sidebar replaced entirely by `MobileNav` drawer.
Section tabs scroll horizontally with touch.
Non-critical widgets (Storage, API Health) deprioritised — appear below fold.

---

## 5. Dashboard Presets

The three style presets in `packages/ui/src/styles/presets/` affect the dashboard beyond colour. Each preset changes the **density, weight and spatial character** of the entire interface.

---

### Brutalist (`data-theme-preset="brutalist"`)

**Character:** High contrast. Zero radius (`--radius: 0px`). Hard black borders. Offset shadows (4px solid).

**Dashboard effect:**
- All cards render with sharp square corners and thick black borders
- Shadows are hard offset blocks — cards appear to "lift" with physical weight
- KPI numbers feel stamped, not floated
- Status badges are high-contrast blocks
- The sidebar has a stark, monochrome quality
- Charts use saturated primary/secondary/accent colours with no softening
- Appropriate for operators who prefer maximum information density and zero visual noise

**Layout implication:** The hard borders create natural visual separation between widgets. Padding can be tighter. The grid feels more structured.

---

### Soft Pop (`data-theme-preset="soft-pop"`)

**Character:** Maximum radius (`--radius: 1rem`). Vibrant colours. Near-zero shadows. Warm green background.

**Dashboard effect:**
- All cards are heavily rounded — pill-like at small sizes
- KPI cards feel friendly and approachable
- Status badges are soft coloured pills
- The sidebar has a warm green tint
- Charts use vibrant, saturated palette
- Activity feeds feel conversational
- Appropriate for operators who prefer a modern, consumer-grade feel

**Layout implication:** The large radius requires more internal padding to avoid content touching rounded corners. Widgets need slightly more breathing room. The grid feels more open.

---

### Tangerine (`data-theme-preset="tangerine"`)

**Character:** Medium radius (`--radius: 0.625rem`). Warm orange primary. Muted blue-grey backgrounds. Subtle shadows.

**Dashboard effect:**
- Cards have a professional, warm quality — neither stark nor playful
- The orange primary draws attention to primary actions and active states
- KPI trend indicators use the warm orange for positive trends
- The sidebar is a cool blue-grey, contrasting with the warm content area
- Charts use a restrained palette — blues and warm accents
- Appropriate for professional operators in a business context

**Layout implication:** The medium radius and subtle shadows create a layered depth. The contrast between sidebar (cool) and content (warm) creates natural visual hierarchy. Standard padding works well.

---

### Preset-Aware Widget Design Rule

All widgets must be designed to work correctly across all three presets. This means:
- Never hardcode border-radius values — always use `rounded-[var(--radius)]` or Tailwind's `rounded` which inherits the CSS variable
- Never hardcode shadow values — use Tailwind shadow utilities which map to the preset shadow tokens
- Never hardcode border colours — use `border-border` which maps to the preset border token
- Status colours (success/warning/destructive) are semantic and preset-independent

---

## 6. Module Relationship to Dashboard

The dashboard **consumes** the modules. The modules do not define the dashboard.

Each module is a deep-work workspace. When an operator finishes a task in a module, they return to the dashboard with updated situational awareness. The dashboard reflects the outcome of module actions in near-real-time.

---

### Moments → Dashboard

- Every moment created increments Today's KPIs (Moments Published)
- Every moment with status = draft or scheduled appears in Broadcast Queue widget
- Every moment with status = broadcasted appears in Recent Moments widget
- Moments with scheduled_at in the future appear in Upcoming Scheduled widget
- Category and region distributions in Publishing section reflect the moments corpus

---

### Broadcasts → Dashboard

- Every broadcast completion updates Delivery Success widget
- Failed broadcasts surface in Operations section as alerts
- Recent Broadcasts widget pulls from broadcast history
- Broadcast count increments Today's KPIs
- Broadcast batches feed Automation Status widget (intent processing)

---

### Subscribers → Dashboard

- New opt-ins increment Today's KPIs (New Subscribers)
- Opt-out events feed Subscriber Growth chart (negative signal)
- Active subscriber count feeds Audience section KPIs
- Regional distribution feeds Audience section charts

---

### Moderation → Dashboard

- Pending messages count feeds Moderation Queue widget (Overview section)
- Escalated advisories (confidence > 0.7) surface as alerts in Moderation Queue
- Oldest pending item age creates urgency signal
- Approved/rejected counts feed Governance section metrics

---

### Authority → Dashboard

- Authority actions feed Authority Activity widget (Governance section)
- Blast radius usage feeds Governance section
- Authority level distribution feeds Governance section charts

---

### Sponsors → Dashboard

- Active sponsor count feeds Commercial section
- Sponsor tier distribution feeds Commercial section
- Sponsor-linked moments feed Campaign Performance widget

---

### Campaigns → Dashboard

- Active campaigns feed Campaign Performance widget (Commercial section)
- Budget utilisation feeds Commercial section KPIs
- Campaign broadcasts feed Delivery Success widget
- Budget transactions feed Revenue Analytics widget

---

### Settings → Dashboard

- Feature flag states feed Platform section (flags widget)
- System settings (budget limits) feed Commercial section warning thresholds
- Admin user count feeds Platform section
- Error logs feed Platform section (error summary widget)

---

## 7. Implementation Roadmap

---

### Phase 6A — Dashboard Architecture (Current)

**Output:** This document.
**Goal:** Establish the blueprint before any implementation begins.
**Deliverable:** `docs/ADMIN_DASHBOARD_ARCHITECTURE.md`
**No code. No components. No routes.**

---

### Phase 6B — Dashboard Composition

**Goal:** Build the dashboard shell structure — sections, layout grid, section tabs, widget slot system.
**Scope:**
- Replace current `/dashboard` page with the sectioned Overview layout
- Implement section tab navigation (Overview / Operations / Publishing / Audience / Governance / Commercial / Platform)
- Implement the 12-column widget grid with responsive breakpoints
- Implement widget slot components (empty shells, loading states, error boundaries)
- Wire `ContentLayout` from `packages/ui` for full-width / centered modes
- Wire `MobileNav` for tablet/mobile sidebar

**Rules:**
- All layout uses existing `packages/ui` shell components
- No new packages/ui components — only consume what exists
- Widget slots render `LoadingCard` or `EmptyDashboard` until data is wired
- No API calls in Phase 6B

---

### Phase 6C — Widget Data Providers

**Goal:** Build the data provider layer for each widget.
**Scope:**
- Server components that fetch data and pass to client widget shells
- One server component per widget data concern
- All data flows through `packages/api` typed clients
- Extend `packages/api` with missing clients: subscribers, moderation, authority, sponsors, campaigns
- Implement widget-level error boundaries and loading states
- Implement widget refresh intervals (client-side polling where appropriate)

**Rules:**
- No direct Supabase calls from `apps/admin`
- All data through `packages/api` → Edge Functions → Supabase
- Widget data providers are server components
- Widget renderers are client components
- Separation is strict: provider fetches, renderer displays

---

### Phase 6D — Live API Integration

**Goal:** Wire all widgets to live data from the deployed Supabase project.
**Scope:**
- Deploy any missing Edge Functions required by new API clients
- Verify all widget data flows end-to-end against the live database
- Implement real-time updates for high-frequency widgets (Moderation Queue, Broadcast Queue) using Supabase Realtime
- Implement Today's KPIs aggregation query
- Implement Subscriber Growth time series query
- Implement Delivery Success rolling calculation

**Rules:**
- Realtime subscriptions only for widgets that genuinely need sub-minute updates
- All other widgets use server-side fetch with revalidation
- No client-side Supabase calls — all through API boundary

---

### Phase 6E — Module Refinement

**Goal:** Elevate the 8 existing modules from structure to full operational workspaces.
**Scope:**
- `/moments` — add bulk actions, advanced filters, inline status transitions
- `/moments/[id]` — add schedule picker, media upload, sponsor assignment
- `/broadcasts` — add broadcast detail view, batch breakdown, retry failed
- `/subscribers` — full list with search, filter by region/category, export
- `/moderation` — review queue with approve/flag/reject actions, advisory detail
- `/authority` — profile management, level assignment, blast radius editor
- `/sponsors` — sponsor CRUD, tier management, campaign linkage
- `/campaigns` — campaign workflow (pending_review → approved → active), budget tracking
- `/settings` — live system settings editor, feature flag toggles, admin user management

**Rules:**
- All module actions go through `packages/api` typed clients
- Role enforcement at Edge Function layer — UI reflects permissions, does not enforce them
- Broadcasted moments remain immutable — no edit/delete UI rendered for them
- Phone numbers masked in all subscriber/moderation views (POPIA)

---

## Appendix A — Widget Priority Matrix

| Widget | Section | Priority | Data Complexity | Realtime |
|---|---|---|---|---|
| Today's KPIs | Overview | P0 | Medium | No |
| Broadcast Queue | Overview | P0 | Low | Yes |
| Moderation Queue | Overview | P0 | Low | Yes |
| Quick Actions | Overview | P0 | None | No |
| Recent Activity | Overview | P1 | Medium | No |
| Operational Health | Overview | P1 | Low | No |
| Recent Moments | Overview | P1 | Low | No |
| Upcoming Scheduled | Overview | P1 | Low | No |
| Recent Broadcasts | Overview | P1 | Low | No |
| Delivery Success | Operations | P1 | Medium | No |
| Automation Status | Operations | P2 | Low | No |
| Subscriber Growth | Audience | P1 | High | No |
| Campaign Performance | Commercial | P2 | Medium | No |
| Authority Activity | Governance | P2 | Low | No |
| API Health | Platform | P2 | Medium | No |
| Storage Usage | Platform | P3 | Low | No |
| System Health | Platform | P2 | Low | No |

**P0** — Must exist on first dashboard render
**P1** — Required for operational usefulness
**P2** — Required for full operational picture
**P3** — Nice to have, low urgency

---

## Appendix B — Existing packages/ui Components Used

| Widget | Primary Component | Secondary Components |
|---|---|---|
| Today's KPIs | `KPIGrid` + `MetricCard` | `Card` |
| Broadcast Queue | `DataTable` | `Badge`, `Button` |
| Moderation Queue | `Card` | `Badge`, `Button` |
| Recent Activity | `ActivityFeed` | — |
| Quick Actions | `QuickActions` | — |
| Subscriber Growth | `AnalyticsCard` + `AreaChart` | — |
| Delivery Success | `AnalyticsCard` + `LineChart` | — |
| Campaign Performance | `Card` | `Badge` |
| Authority Activity | `ActivityFeed` | `Badge` |
| Operational Health | `Card` | `StatusBadge` |
| API Health | `AnalyticsCard` + `DataTable` | `Badge` |
| Storage Usage | `Card` | — |
| System Health | `Card` | `StatusBadge` |
| Recent Moments | `Card` | `Badge` |
| Upcoming Scheduled | `Card` | `Badge` |
| Recent Broadcasts | `Card` | `Badge` |

No new `packages/ui` components are required for Phase 6B or 6C.
All widgets compose from the existing library.

---

*This document is the authoritative blueprint for all dashboard implementation from Phase 6B onwards.*
*No implementation decisions should be made that contradict this architecture without updating this document first.*
