# UNCIP V2 Frontend Constitution

**Authority:** This document is the single source of truth for the UNCIP V2 frontend.
**Supersedes:** All original extraction documents in `docs/reference/uncip-original/`.
**References:** `docs/context/PLATFORM_DASHBOARD_SHELL.md` for shell architecture.

---

## What UNCIP Is

UNCIP (Unami National Child Identification Programme) is a child safety platform for South African townships. It connects parents, schools, and authorities when a child is missing or at risk.

The strategic goal is a government pilot: 30 schools, 3 provinces, ~2,000 children, presented to the Minister of Basic Education.

**The self-determination principle:** Communities are the primary agents of child safety. Parents register their own children. Schools confirm. Communities mobilise. Authorities coordinate. UNCIP is infrastructure that communities own — not a charity intervention.

---

## Frontend Phase Boundary

This constitution governs the **UI-first, synthetic-data phase** of UNCIP V2.

```
WHAT THIS PHASE IS:
  ✅ Domain types defined in apps/uncip/src/domain/uncip/
  ✅ Synthetic fixtures in apps/uncip/src/fixtures/uncip/
  ✅ Components built against fixture contracts
  ✅ Pages built from components
  ✅ All five role experiences navigable
  ✅ All interaction states present (loading, empty, error, filled)

WHAT THIS PHASE IS NOT:
  ✗ No Supabase reads
  ✗ No Edge Function calls
  ✗ No real child data
  ✗ No authentication implementation
  ✗ No mutations (create, update, delete)
  ✗ No file uploads
  ✗ No notifications
```

The backend phase begins only after every domain surface is navigable with synthetic data.

---

## Platform Relationship

UNCIP is built on Platform Core. It does not reimplement what the platform provides.

```
Platform Core provides:              UNCIP provides:
  ThemeBootScript                      Domain types
  ShellLayoutControls                  Fixture layer
  ShellThemeSwitcher                   UNCIP components
  Nav types (NavGroup etc.)            UNCIP pages
  PageHeader                           Navigation configuration
  KPIGrid, MetricCard                  Role-specific experiences
  TablePagination, TableToolbar        app-config.ts
  DataTable, BulkActionBar             sidebar-items.ts
  EmptyState, ErrorState               app-sidebar.tsx
  PageSkeleton, TableSkeleton          lib/auth/operator.ts (mock)
  StatusBadge                          server/server-actions.ts
  Charts, ActivityFeed, QuickActions   lib/fonts/registry.ts
  31 shadcn primitives
```

**The constitutional test:** Deleting `apps/uncip/` must leave `packages/` compiling without modification.

---

## Five Roles — Confirmed

These five roles are confirmed from the original system and survive into V2.

| Role | Who they are | Primary concern |
|---|---|---|
| `admin` | Unami Foundation operator | System oversight, user management, all data |
| `parent` | Guardian of registered children | Register children, raise alerts, track status |
| `school` | School staff (principal, designated staff) | Confirm attendance, respond to alerts for enrolled children |
| `authority` | SAPS, ward councillor, DSD | Coordinate response, assign case numbers, jurisdiction view |
| `community` | Community champion, CPF member | Receive alerts, report sightings |

**V2 decision:** Role is assigned at registration and stored in the user profile. It is not selected at login. The original role-selector-at-login is retired.

**V2 decision:** Admin role-switching for demonstration purposes is preserved. It is a deliberate product feature, not a security workaround.

**Unresolved:** Whether a single user can hold multiple roles (e.g. a parent who is also a community champion). Deferred to auth phase.

---

## Entity Hierarchy

Child is the central entity. Everything else attaches to or operates around it.

```
                         CHILD
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   GuardianLink[]       schoolId         address
   (who is responsible) (seen daily)   (where they live)
          │
     medicalInfo
     (what responders need)
          │
          ▼
       Alert[]
          │
          ▼
  AlertTimelineEntry[]
          │
          └── who acted / what happened / when
```

This hierarchy is the constitutional constraint on implementation. Alert is not the central entity — it is a child of Child. A coding agent must not treat Alert as the root and Child as a lookup.

---

## Core Workflow

The product is not an alert board. It is an institutional coordination system around a child identity record. The core workflow is the multi-stakeholder response sequence.

```
Parent
  │
  │  raises alert (alert_raised)
  ▼
School
  │
  │  confirms last seen (school_confirmed_last_seen)
  ▼
Authority
  │
  │  assigns SAPS case number (authority_assigned_case)
  ▼
Community
  │
  │  reports sighting (community_sighting_reported)
  ▼
Authority
  │
  │  resolves alert (status_changed → resolved)
  ▼
Alert closed
```

Each step produces an `AlertTimelineEntry`. The timeline is the permanent record of who acted, what they did, and when. This is what makes UNCIP an institutional coordination system rather than a simple reporting tool.

**Confirmed from extraction:** The three-role response flow (parent → school → authority) is documented in `playbook/00-MASTER-PLAYBOOK.md` and `playbook/09-FULL-CONTEXT-HANDOFF.md` as the core product intent. It was not implemented in V1. It is the primary V2 implementation target.

---

## Domain Entities — Confirmed

### Child

The central entity. A child registered in the UNCIP system.

```
id                  string
firstName           string
lastName            string
dateOfBirth         date
gender              ChildGender
photoUrl            string | null
identificationNumber string | null     — SA ID or birth certificate number
schoolId            string | null
address             ChildAddress | null
medicalInfo         ChildMedicalInfo | null
guardians           GuardianLink[]     — join table, not array of IDs
createdAt           datetime
updatedAt           datetime
```

**V2 decision:** The dual parent-child relationship model (parentId + guardians[]) is retired. V2 uses a proper `guardians` join table only.

**V2 decision:** Medical information is optional. It is not required to register a child.

**Unresolved:** Whether identification number (SA ID / birth certificate) is required or optional. Deferred to safeguarding review.

### Guardian Link

The relationship between a guardian and a child.

```
id                  string
childId             string
userId              string
relationship        GuardianRelationship
isPrimary           boolean
```

### Alert

A missing child or emergency alert raised by a parent or authority.

```
id                  string
childId             string
alertType           AlertType
status              AlertStatus
description         string
lastSeenAt          datetime
lastSeenLocation    string
lastSeenWearing     string | null
contactPhone        string
timeline            AlertTimelineEntry[]
createdBy           string
createdAt           datetime
updatedAt           datetime
resolvedAt          datetime | null
resolvedBy          string | null
```

**V2 decision:** The dual alert schema (nested lastSeen + flat fields) is retired. V2 uses a single flat schema.

**V2 decision:** The dual alert type field (alertType + type) is retired. V2 uses `alertType` only.

**V2 decision:** Alert timeline is a first-class concept in V2. Every stakeholder action on an alert is recorded as a `AlertTimelineEntry`.

### Alert Timeline Entry

```
id                  string
alertId             string
actorId             string
actorRole           UNCIPRole
action              AlertTimelineAction
note                string | null
timestamp           datetime
```

**AlertTimelineAction values (confirmed):**
- `alert_raised` — parent raises alert
- `school_confirmed_last_seen` — school confirms last-seen information
- `authority_assigned_case` — authority assigns SAPS case number
- `community_sighting_reported` — community member reports sighting
- `status_changed` — any status transition
- `note_added` — free-text note added by any stakeholder

**Unresolved:** Which roles are permitted to perform each `AlertTimelineAction`. The timeline structure belongs in this constitution. The authorization rules for who may create each action type belong in the authorization model. Deferred to auth phase.

### School

```
id                  string
name                string
emis                string | null     — EMIS number (DBE school identifier)
province            Province
address             string
contactPhone        string | null
contactEmail        string | null
```

### SAPS Station

```
id                  string
name                string
province            Province
district            string | null
contactPhone        string | null
```

**V2 decision:** SAPS station is the geographic scoping unit for authority users and community members. An authority user is scoped to one station area. A community member is scoped to one station area. Alerts are visible within a station area.

**Unresolved:** Whether admin sees all stations nationally or is also scoped. Assumed national for now.

### User

```
id                  string
email               string
name                string | null
role                UNCIPRole
stationId           string | null     — authority, community only (parent scope: unresolved)
schoolId            string | null     — school only
isActive            boolean
createdAt           datetime
```

**Unresolved:** Whether a parent has a `stationId` relationship, or whether station-area scoping is limited to authority and community users. The extraction material does not establish parent geographic scoping. Deferred to auth/domain policy phase.

---

## Alert Type Taxonomy — Confirmed

The original system had inconsistent alert types between the creation form and the filter UI. V2 uses a single agreed taxonomy.

| Value | Label |
|---|---|
| `missing` | Missing Child |
| `medical` | Medical Emergency |
| `danger` | Child in Danger |
| `other` | Other |

**V2 decision:** `emergency` and `school` (from the original filter UI) are retired. The four types above are the complete taxonomy.

---

## Alert Status Lifecycle — Confirmed

```
active → resolved
active → cancelled
active → false_alarm
```

**V2 decision:** `false` (the original status value) is renamed `false_alarm` for clarity.

**V2 decision:** Only authority and admin can transition an alert to `resolved`. The original creator can transition to `cancelled` or `false_alarm`.

---

## Geographic Scoping — V2 Decision

**V2 decision:** SAPS station area is the geographic scope unit.

- `authority` users see alerts within their assigned station area only.
- `community` users see alerts within their assigned station area only.
- `school` users see alerts for children enrolled at their school only.
- `parent` users see alerts they created only.
- `admin` users see all alerts nationally.

This replaces the original "all authenticated users see all alerts nationally" behaviour.

**Unresolved:** Whether alerts can be escalated beyond a station area (e.g. provincial or national escalation). Deferred to backend phase.

---

## Role Experiences — What Each Role Sees

### Admin

The Unami Foundation operator. Sees everything. Manages users and system health.

**Primary surfaces:**
- Dashboard — system-wide KPIs (total children, active alerts, registered users, stations)
- Children — full list, all stations, all schools
- Alerts — full list, all stations, all types, all statuses
- Users — user management (create, deactivate, role assignment)
- SAPS Stations — station registry
- Settings

**V2 decision:** Admin is the only role that can create and deactivate users in the UI phase.

### Parent

A guardian of registered children. The alert originator.

**Primary surfaces:**
- Dashboard — own children summary, own active alerts
- My Children — list of registered children, child detail
- Report Alert — raise a missing child alert for a registered child
- My Alerts — alerts raised by this parent, alert detail with timeline

**V2 decision:** Parent cannot see other parents' children or alerts.

**Unresolved:** Whether a parent can register a child without admin approval. Assumed yes for the UI phase.

### School

School staff. Confirms attendance and last-seen information.

**Primary surfaces:**
- Dashboard — enrolled children summary, active alerts for enrolled children
- Students — children enrolled at this school
- Alerts — active alerts for enrolled children only
- Alert detail — confirm last-seen action

**V2 decision:** School users see only children enrolled at their school. The original "all children" bug is retired.

### Authority

SAPS, ward councillor, DSD. Coordinates response within their station area.

**Primary surfaces:**
- Dashboard — station-area KPIs (active alerts, resolved this month, children registered in area)
- Alerts — all alerts within station area, all types, all statuses
- Alert detail — assign case number, add notes, update status
- Children — children registered within station area

**V2 decision:** Authority sees alerts within their station area only. National view is admin-only.

### Community

Community champion, CPF member. Receives alerts and reports sightings.

**Primary surfaces:**
- Dashboard — active alerts in station area
- Alerts — active alerts in station area (read-only list)
- Alert detail — report sighting action

**V2 decision:** Community is a read-and-report role. They cannot create alerts, manage children, or manage users.

**V2 decision:** Community dashboard is a first-class experience in V2. The original placeholder is retired.

---

## Navigation — Confirmed Structure

The current `sidebar-items.ts` defines a single navigation for all roles. This is correct for the foundation phase (admin mock session, all items visible).

**V2 decision:** Navigation is role-filtered in the auth phase. During the UI phase, the admin mock session shows all items.

**Confirmed navigation groups:**

```
Group 1 (ungrouped):
  Dashboard

Group 2 — Children:
  Children
  Alerts

Group 3 — Administration:
  Users
  SAPS Stations

Group 4 — System:
  Settings
```

**Unresolved:** Whether parent and community roles need a simplified navigation (e.g. "My Children", "My Alerts" instead of the admin navigation). Deferred to role-specific experience phase.

---

## Component Architecture

Components are built bottom-up. Pages are assembled from components. No giant page components.

```
@unami/ui (platform)
  └── PageHeader, KPIGrid, MetricCard, DataTable, EmptyState, etc.

apps/uncip/src/components/ui/ (shadcn primitives)
  └── 31 shadcn components

apps/uncip/src/components/uncip/ (UNCIP domain components)
  ├── child/
  │   ├── ChildSummaryCard      — compact child identity card (name, photo, age, school)
  │   ├── ChildDetailPanel      — full child profile (identity + medical + guardians)
  │   ├── ChildStatusBadge      — has active alert / no active alert
  │   └── GuardianList          — list of guardians with relationship labels
  ├── alert/
  │   ├── AlertSummaryCard      — compact alert card (child, type, status, last seen)
  │   ├── AlertDetailPanel      — full alert (description, last seen, timeline)
  │   ├── AlertTypeBadge        — colour-coded alert type
  │   ├── AlertStatusBadge      — colour-coded alert status
  │   └── AlertTimeline         — ordered list of timeline entries
  ├── station/
  │   └── StationSummaryCard    — station name, province, district
  └── user/
      └── UserRoleBadge         — role label badge
```

**Rules:**
- No component imports from `@/lib/supabase/` or any backend client
- No component calls `fetch()` or any async data function
- All data is passed as props
- Components are pure presentation

---

## Page Architecture

Each page follows this pattern:

```
page.tsx (server component)
  ├── imports fixture data (UI phase) or fetches from API (backend phase)
  ├── renders PageHeader from @unami/ui
  └── renders UNCIP components with data as props
```

**Page inventory:**

| Route | Page | Primary component |
|---|---|---|
| `/dashboard` | Dashboard | KPIGrid + AlertSummaryCard list + ChildSummaryCard list |
| `/children` | Children list | DataTable or card grid of ChildSummaryCard |
| `/children/[id]` | Child detail | ChildDetailPanel + alert history |
| `/alerts` | Alerts list | DataTable or card list of AlertSummaryCard |
| `/alerts/[id]` | Alert detail | AlertDetailPanel + AlertTimeline |
| `/users` | Users list | DataTable (admin only) |
| `/stations` | Stations list | DataTable or card list of StationSummaryCard |
| `/settings` | Settings | Platform shell settings (profile, appearance, platform) |

**Unresolved:** Whether children and alerts are best presented as DataTable (dense, sortable) or card grid (visual, photo-forward). Decision deferred to component build — try both, decide on visual evidence.

---

## Fixture Layer

Fixtures live in `apps/uncip/src/fixtures/uncip/`.

**Fixture contracts must match domain types exactly.** Fixtures are not free-form mock data — they are typed instances of domain entities.

```
fixtures/uncip/
  ├── children.ts       — ChildRecord[]
  ├── alerts.ts         — AlertRecord[]
  ├── users.ts          — UserRecord[]
  ├── stations.ts       — SAPSStation[]
  ├── schools.ts        — School[]
  └── index.ts          — re-exports all fixtures
```

**Fixture design principles:**
- Enough records to show pagination (minimum 12 children, 8 alerts)
- Represent all statuses (active, resolved, cancelled, false_alarm)
- Represent all alert types (missing, medical, danger, other)
- Represent all roles (at least one user per role)
- Represent geographic scoping (at least 2 stations, children distributed across them)
- No real names, addresses, ID numbers, or photographs
- Synthetic identity only — names like "Amahle Dlamini", "Sipho Nkosi" are acceptable as culturally appropriate placeholders

**Fixture files are not the data model.** Domain types in `apps/uncip/src/domain/uncip/types.ts` are the authoritative contract. Fixtures are instances of those types.

---

## Domain Types — Current State and Gaps

**Currently defined in `apps/uncip/src/domain/uncip/types.ts`:**
- `UNCIPRole` ✅
- `UNCIP_ROLE_LABELS` ✅
- `UNCIPSession` ✅
- `AlertType` ✅
- `AlertStatus` ✅
- `ALERT_TYPE_LABELS` ✅
- `ALERT_STATUS_LABELS` ✅
- `ChildGender` ✅
- `CHILD_GENDER_LABELS` ✅
- `GuardianRelationship` ✅
- `GUARDIAN_RELATIONSHIP_LABELS` ✅

**Not yet defined — required before fixtures:**
- `ChildRecord` — full child entity
- `ChildAddress` — address sub-type
- `ChildMedicalInfo` — medical sub-type
- `GuardianLink` — guardian join record
- `AlertRecord` — full alert entity
- `AlertTimelineEntry` — timeline entry
- `AlertTimelineAction` — action enum
- `School` — school entity
- `SAPSStation` — station entity
- `UserRecord` — user entity
- `Province` — South African province enum

**The sequence:** Domain types → Fixtures → Components → Pages. Do not write fixtures before types are defined.

---

## Safeguarding Boundary

UNCIP handles sensitive data about children. This boundary is non-negotiable during the UI phase.

**What the UI phase must never do:**
- Display real child names, photographs, or identification numbers
- Display real addresses or last-known locations
- Connect to any live database containing real child data
- Expose any real personal data in fixture files
- Implement any authentication that could be mistaken for production auth

**What the UI phase must always do:**
- Use clearly synthetic fixture data (names, IDs, addresses are obviously fictional)
- Display a visible "DEVELOPMENT MODE — SYNTHETIC DATA ONLY" indicator in the shell during the UI phase
- Treat the mock session as a clearly labelled development tool, not a real auth mechanism

**The safeguarding review (from `UNCIP_PRIVACY_AND_SAFEGUARDING.md`) must be completed before any production deployment.** The UI phase does not trigger this requirement — it handles no real data.

---

## What Is Retired from V1

These concepts from the original system do not survive into V2.

| Retired concept | Reason |
|---|---|
| Firebase Auth + NextAuth dual auth | Replaced by Supabase Auth |
| Firebase Firestore | Replaced by PostgreSQL (Supabase) |
| Firebase Storage | Replaced by Supabase Storage |
| `demo123` universal backdoor | Critical security concern |
| Hardcoded admin credentials | Critical security concern |
| Plaintext password storage | Critical security concern |
| `/api/debug/*` routes | Critical security concern |
| Role selector at login | Role comes from user profile, not login selection |
| Dual parent-child relationship model | Replaced by guardian join table |
| Dual alert schema (nested + flat) | Replaced by single flat schema |
| Dual alert type field | Single `alertType` field |
| All users see all alerts nationally | Replaced by station-area scoping |
| All users see all user profiles | Restricted to own profile + admin |
| School users see all children | Restricted to enrolled children |
| Community dashboard placeholder | First-class experience in V2 |
| `cases`, `reports`, `resources` collections | Purpose unclear — not carried forward until clarified |
| Debug links in production navigation | Never in production |
| Test HTML files in `/public/` | Never deployed |

---

## What Is Unresolved

These questions have not been deliberately decided. They are deferred, not forgotten.

| Question | Deferred to |
|---|---|
| Can a user hold multiple roles? | Auth phase |
| Is identification number required or optional at registration? | Safeguarding review |
| Can alerts be escalated beyond a station area? | Backend phase |
| Are children/alerts best shown as DataTable or card grid? | Component build |
| Does parent role need simplified navigation? | Role-specific experience phase |
| What is the `community` role's exact sighting report workflow? | Community experience phase |
| What are `cases` and `reports` collections for? | Founder clarification |
| Was a physical/digital identification kit intended? | Founder clarification |
| What consent model is required at child registration? | Safeguarding review |
| What data retention periods apply? | Safeguarding review |
| Does a parent have a `stationId`, or is station scoping limited to authority/community? | Auth/domain policy phase |
| Which roles are permitted to perform each `AlertTimelineAction`? | Auth phase |

---

## Build Sequence

```
1. Domain types          apps/uncip/src/domain/uncip/types.ts
                         Add missing entity types (ChildRecord, AlertRecord, etc.)

2. Fixtures              apps/uncip/src/fixtures/uncip/
                         Typed instances of domain entities — synthetic data only

3. UNCIP components      apps/uncip/src/components/uncip/
                         Pure presentation, props-only, no data fetching

4. Pages                 apps/uncip/src/app/(uncip)/
                         Assemble components, pass fixture data as props

5. Interaction states    Every page: loading, empty, error, filled
                         Every list: empty state, populated state, paginated state
                         Every detail: not-found state, populated state

6. Role experiences      Verify each role's navigation and data scope
                         (using mock session role switching)

7. Freeze                All surfaces navigable, all states present
                         Constitution updated with any decisions made during build

8. Backend phase         Domain types become API contracts
                         Fixtures replaced by real data fetching
                         Auth phase begins
```

---

## Information Architecture — Constitutional Principles

**Authority:** `docs/context/uncip/UNCIP_INFORMATION_ARCHITECTURE.md` contains the full decision record.
This section locks the principles into the constitution.

**Established:** 2026-08-12, after Phase A–C completion and before Phase D implementation.

---

### The Governing Principle

Every piece of information in UNCIP belongs to a specific **information object**, has an **operational context**, and carries a **visibility scope**. Information is never collected merely because the technology can collect it.

```
Record
  ↓
Why does this information exist?
  ↓
What operational object does it belong to?
  ↓
Who is allowed to see it?
  ↓
How long does it matter?
  ↓
Can it become evidence or provenance?
```

---

### The Information Hierarchy

```
CHILD
  identity
      ↓
INCIDENT
  what happened / last known context
      ↓
TIMELINE
  institutional response (immutable)
      ↓
MEDIA
  evidence attached to the appropriate object
      ↓
LOCATION
  spatial representation of those objects
      ↓
MAP
  authorised operational projection
```

The map is a **projection** of authorised operational information. It is not a new source of truth. It inherits the same RLS and privacy boundaries as the underlying records.

---

### Information Objects and Their Scope

| Information | Belongs to | Visibility scope |
|---|---|---|
| Child identity photo | Child record | Parent/guardian → School → Authority → Admin. **Never community.** |
| Last-seen location | Incident (alert) | Same scope as the incident |
| Sighting location | Sighting timeline event | Authority/Admin + the reporter's own sighting |
| Sighting photo | Sighting timeline event | Same event scope |
| SAPS case document | Authority timeline action | Authority/Admin only |
| School location | School record | Appropriate institutional scope |
| Station location/boundary | Station record | Appropriate operational scope |
| Community incident pin | Incident | Station-area, **no child identity** |
| Parent's device location | Person | **Never captured** |
| Community reporter's device location | Person | **Never captured** |

---

### Location Semantics — Three Distinct Concepts

These must never collapse into one generic `location` field.

```
CHILD
  registered address (uncip_children address columns)

INCIDENT
  last-seen location (uncip_alerts.last_seen_location)

TIMELINE EVENT
  sighting location (uncip_alert_timeline.sighting_location)
```

Future coordinates follow the same separation:
- `uncip_alerts.last_seen_lat / last_seen_lng`
- `uncip_alert_timeline.sighting_lat / sighting_lng`
- `uncip_schools.lat / lng`
- `uncip_saps_stations.lat / lng`

All as nullable columns added when the map UI is built. Not before.

---

### Media — Scoped Attachment Model

```
Child
  └── identity photo (uncip_children.photo_url → Storage)

Alert
  └── alert-level evidence (uncip_alert_media, timeline_entry_id = null)
        │
        └── Timeline event
              ├── sighting photo (uncip_alert_media, timeline_entry_id set)
              └── SAPS document  (uncip_alert_media, timeline_entry_id set)
```

Every attachment has an explicit relationship to either the alert or a specific timeline event. There is no indiscriminate upload mechanism.

---

### Timeline — First-Class Operational Fields

The `uncip_alert_timeline` table carries:
- `note TEXT` — narrative (all action types)
- `case_number TEXT` — nullable, `authority_assigned_case` only
- `sighting_location TEXT` — nullable, `community_sighting_reported` only

These are first-class columns, not JSONB. The action types are known and finite. Named columns are queryable, indexable, and unambiguous.

---

### What Is Never Captured

- Reporter or user device location (parent raising alert, community member reporting sighting)
- Continuous child location tracking of any kind
- Biometric data
- Weather context (the `description` field is sufficient; weather is not a structured operational input for the pilot)
- Any data not directly tied to the incident or the child's identity

---

### Map — Authorised Operational Projection

The map is not a decorative UI feature. Its location semantics are designed now even though the map UI is built later.

**Community map view:** incident pins in station area showing alert type and status only. Never child name, child photo, child address, or identification number. The map inherits the existing RLS and response-stripping boundaries.

**The map must never become a privacy bypass.**

---

### Implementation Sequence (Phase D onwards)

```
D1  case_number + sighting_location columns on uncip_alert_timeline
    One migration. Update Edge Function, API client, AlertActionPanel.

D2  Child identity photo upload
    Supabase Storage bucket (children-photos) + upload field in /children/new.
    photo_url column already exists.

D3  Alert action panel completion
    Proper form inputs for school confirmation, authority case assignment,
    community sighting. Core pilot workflow demonstration.

D4  uncip_alert_media table + storage
    After D1–D3 are working.

D5  Coordinate columns + map UI
    Nullable lat/lng on alerts, timeline, schools, stations.
    Map component built against these columns.
```

---

## Relationship to Platform Documents

| Document | What it governs |
|---|---|
| `docs/context/PLATFORM_DASHBOARD_SHELL.md` | Shell architecture, templates, extraction history |
| `docs/context/PLATFORM.md` | What Platform Core is, ownership boundaries |
| `docs/context/ARCHITECTURE.md` | Technical structure, layer boundaries |
| `docs/context/decisions.md` | Platform-level architectural decisions |
| `apps/uncip/UNCIP_V2_FRONTEND.md` | **This document — UNCIP domain, roles, entities, build sequence** |
| `docs/context/uncip/UNCIP_INFORMATION_ARCHITECTURE.md` | Information architecture decisions — media, location, map, provenance |

**The rule:** Platform Core tells UNCIP how the application is built. This constitution tells it what the application is.
