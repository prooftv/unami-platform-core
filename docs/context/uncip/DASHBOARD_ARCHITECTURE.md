# UNCIP Dashboard Architecture Decision

**Status:** Locked — implementation may proceed from this document.
**Governs:** `apps/uncip/src/app/(uncip)/dashboard/page.tsx`
**Date:** 2026-08-13

---

## Governing Principle

The dashboard is a **role-specific operational projection of canonical UNCIP records**.

It does not create a second interpretation of an incident.
It does not introduce new data, new tables, or new KPIs.
It answers one question per role: **what deserves my attention right now?**

The separation of concerns is:

| Surface | Question answered |
|---|---|
| Dashboard | What deserves my attention? |
| Incident page `/alerts/[id]` | What actually happened? |
| Timeline | What happened, by whom, and when? |
| Map `/map` | Where is this happening? |
| Media | What evidence is attached? |

The dashboard must not duplicate or replace any of these.

---

## Information Hierarchy — Role by Role

### ADMIN — Institutional overview

The admin sees the full system. The dashboard is a health check and escalation surface.

**Priority order:**
1. Active incidents — count + list (all active alerts, all children)
2. Incidents requiring attention — alerts with no timeline activity in 24h
3. Recent institutional actions — last 5 timeline entries across all alerts
4. Case activity — alerts with `authority_assigned_case` entries
5. Community sightings — recent `community_sighting_reported` entries

**Available actions from dashboard:**
- Navigate to any alert
- Navigate to children list
- Navigate to users (user management)

**Data sources:** `alerts.list()`, `children.list()`, timeline via alert detail

---

### AUTHORITY — Operational jurisdiction

The authority user is scoped to a SAPS station area. The dashboard is a case management surface.

**Priority order:**
1. Active incidents in jurisdiction — active alerts (RLS already scopes to station)
2. Alerts awaiting authority action — active alerts with no `authority_assigned_case` entry
3. Recent sightings — `community_sighting_reported` entries from active alerts
4. Latest timeline activity — most recent entries across jurisdiction alerts
5. Resolved this session — alerts closed by this authority user

**Available actions from dashboard:**
- Navigate to any alert to assign case number
- Navigate to map (jurisdiction spatial view)

**Data sources:** `alerts.list()` (RLS-scoped), alert detail for timeline

---

### SCHOOL — School responsibility

The school user is scoped to a single school. The dashboard is a child welfare surface.

**Priority order:**
1. Active alerts involving school children — active alerts where child.schoolId matches
2. Alerts awaiting school confirmation — active alerts with no `school_confirmed_last_seen` entry
3. Linked children — children enrolled at this school
4. Recent incident activity — timeline entries for school-linked alerts

**Available actions from dashboard:**
- Navigate to any alert to confirm last seen
- Navigate to children list (school-scoped)

**Data sources:** `alerts.list()` (RLS-scoped to school), `children.list()` (RLS-scoped)

---

### PARENT — My children

The parent sees only their own children and alerts. The dashboard is a personal status surface.

**Priority order:**
1. My children — all registered children (guardian link)
2. Active alerts — active alerts for my children (with current status)
3. Latest timeline activity — most recent entries on my children's alerts
4. Relevant sightings — `community_sighting_reported` on my children's active alerts
5. Next action — if an active alert has no school confirmation yet, surface that prompt

**Available actions from dashboard:**
- Navigate to child record
- Navigate to active alert
- Register a new child
- Raise a new alert

**Data sources:** `children.list()` (guardian-scoped), `alerts.list()` (guardian-scoped)

---

### COMMUNITY — Public contribution surface

Community is deliberately different. It is not a stripped-down admin dashboard.
It is a public operational surface oriented toward contribution, not oversight.
Child identity is never shown (F5 privacy boundary).

**Priority order:**
1. Active public incidents — active alerts in jurisdiction (no child identity)
2. Recent sightings — `community_sighting_reported` entries (location + time only)
3. Report a sighting — primary action, always visible

**Available actions from dashboard:**
- Navigate to any active incident to report a sighting
- Navigate to map (public spatial view)

**Data sources:** `alerts.list()` (RLS: active only, child_id stripped), timeline sightings

---

## What the Dashboard Must Not Do

- Introduce new database tables or columns
- Add dashboard-only status fields
- Duplicate incident data
- Replace the incident timeline
- Show AI summaries or generated content
- Add weather, context, or external data
- Change RLS to accommodate dashboard cards
- Show metrics that have no operational meaning for the role
- Show the same layout to all roles with different numbers substituted

---

## Metric vs Work Queue Distinction

The dashboard should lean toward **work queues**, not raw metrics.

| Avoid | Prefer |
|---|---|
| "4 active alerts" | "2 alerts awaiting authority action" |
| "1 child registered" | "Sipho Dlamini — active alert" |
| "3 sightings" | "Sighting reported 2h ago — Vilakazi St" |
| "5 timeline entries" | "School confirmation pending on alert #2" |

Metrics are acceptable as secondary context. They must not be the primary content.

---

## Implementation Constraints

**Single page file:** `apps/uncip/src/app/(uncip)/dashboard/page.tsx`

**No new components required** beyond what already exists:
- `AlertSummaryCard` — already built
- `ChildSummaryCard` — already built
- `MetricCard` / `KPIGrid` — already in `@unami/ui`
- `EmptyState` / `ErrorState` — already in `@unami/ui`
- `Card`, `CardHeader`, `CardContent` — already in shadcn

**Data fetching:** All data comes from existing Edge Functions via `getUNCIPClient()`.
No new Edge Functions. No direct Supabase queries from the page.

**Role branching:** A single `switch (session.role)` or equivalent in the page.
Each role renders a different set of cards from the same data fetches.

**Work queue derivation:** Computed in the page from existing alert + timeline data.
Example: "awaiting authority action" = `activeAlerts.filter(a => !a.uncipAlertTimeline?.some(t => t.action === 'authority_assigned_case'))`.
This requires fetching alert detail (with timeline) for active alerts — acceptable for a small pilot dataset.

---

## Current Dashboard State (pre-implementation)

The existing `dashboard/page.tsx` is role-blind. It shows:
- KPI grid: registered children, active alerts, resolved count, stations
- Active alerts list (same for all roles)
- Recently registered children (same for all roles)
- SAPS stations list (same for all roles)

This is the baseline to replace. The KPI grid pattern is correct; the content is not role-differentiated.

---

## Authorization to Implement

Implementation may proceed from this document.
The implementation must not deviate from the role hierarchy above.
If a data source is unavailable for a role (RLS returns empty), the dashboard must degrade gracefully — empty state, not error.
