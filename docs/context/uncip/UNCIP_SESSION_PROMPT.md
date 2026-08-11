# UNCIP v2 — Session Context
# Load this file at the start of every UNCIP development session.

---

## What UNCIP Is

UNCIP = Unami National Child Identification Programme.

A child safety platform for South African townships. It connects parents, schools, authorities (SAPS, ward councillors, DSD), and community members in real-time when a child is missing or at risk.

Built by the Unami Foundation. Strategic goal: present to the Minister of Basic Education for a government-funded pilot — 30 schools, 3 provinces, ~2,000 children, R2.4M budget.

This is not a charity project. It is infrastructure that communities own and operate themselves.

---

## Where It Lives

```
apps/uncip/          — Next.js application (to be scaffolded)
```

Consumes `@unami/ui`, `@unami/shared`, `@unami/api`. Does not modify `packages/`.

The Moments admin shell (`apps/admin`) is the structural template. Same shell, same patterns, different domain.

---

## Founder Decisions — All Locked

These were open questions. All are now answered. Do not re-open them.

### 1. Identification Kit
**Decision: Digital QR card.**
After registration, the system generates a printable/shareable digital identification card for the child containing: name, photo, ID number, QR code linking to their profile. No physical distribution workflow required in v2. The QR code links to a protected profile view accessible to authorities.

### 2. Alert Geographic Scoping
**Decision: SAPS station area.**
Alerts are scoped to the SAPS station area of the child's registered address. Community members and school users see alerts within their station area. Authority users (SAPS) see alerts for their assigned station. Admin sees all. National visibility is admin-only.

### 3. School and Authority Onboarding
**Decision: Admin-invite only.**
School and authority users cannot self-register. Admin creates their accounts and assigns them to a specific school or SAPS station. This prevents impersonation of institutions. Parents self-register.

### 4. Community Role Scope
**Decision: Sightings + alerts in their area.**
Community members (community champions, CPF members) can: receive alerts for their SAPS station area, submit sighting reports on active alerts, view the alert timeline. They cannot create alerts, edit child profiles, or access child identity data beyond what is on the public alert.

### 5. Cases Collection
**Decision: SAPS case number mirror.**
The `cases` table stores SAPS case numbers assigned by authority users to active alerts. It is not a separate case management system. An authority user assigns a SAPS case number to an alert — this creates a case record linking the alert to the official SAPS case. One alert can have one case record.

### 6. Data Retention
**Decision: 7 years for resolved alerts and audit logs. Child profiles retained until the child turns 18 or guardian requests deletion.**
This satisfies POPIA requirements for children's data. Retention is enforced by a scheduled Edge Function (monthly sweep). Deletion is cascade — removing a child profile removes all associated alerts, notifications, and case records.

---

## Domain Entities (v2 — Clean Model)

### `children`
Central entity. One record per child.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `first_name` | text | Required |
| `last_name` | text | Required |
| `date_of_birth` | date | Required |
| `gender` | text | `male \| female \| other` |
| `id_number` | text | SA ID or birth certificate number. Encrypted at rest. |
| `photo_url` | text | Supabase Storage URL |
| `school_id` | uuid | FK → `schools` |
| `saps_station_id` | uuid | FK → `saps_stations` (derived from address) |
| `address` | jsonb | `{ street, city, province, postal_code }` |
| `medical_info` | jsonb | `{ blood_type, allergies, conditions, medications }` |
| `emergency_contact` | jsonb | `{ name, relationship, phone }` |
| `created_by` | uuid | FK → `auth.users` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `guardians` (join table)
Many-to-many: users ↔ children.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `child_id` | uuid | FK → `children` |
| `user_id` | uuid | FK → `auth.users` |
| `relationship` | text | `parent \| grandparent \| foster_carer \| other` |
| `is_primary` | boolean | Primary guardian (alert contact) |
| `created_at` | timestamptz | |

### `alerts`
Missing child or emergency alert.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `child_id` | uuid | FK → `children` |
| `alert_type` | text | `missing \| medical \| danger \| other` |
| `status` | text | `active \| resolved \| cancelled \| false_alarm` |
| `description` | text | |
| `last_seen_at` | timestamptz | |
| `last_seen_location` | text | |
| `last_seen_wearing` | text | |
| `contact_phone` | text | |
| `saps_station_id` | uuid | FK → `saps_stations` (scoping) |
| `created_by` | uuid | FK → `auth.users` |
| `resolved_at` | timestamptz | |
| `resolved_by` | uuid | FK → `auth.users` |
| `resolution_notes` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `alert_timeline`
Immutable append-only log of all actions on an alert.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `alert_id` | uuid | FK → `alerts` |
| `actor_id` | uuid | FK → `auth.users` |
| `actor_role` | text | Role at time of action |
| `action` | text | `created \| school_confirmed \| sighting_reported \| case_assigned \| status_changed \| note_added` |
| `detail` | jsonb | Action-specific data |
| `created_at` | timestamptz | Immutable |

### `sightings`
Community member sighting reports on active alerts.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `alert_id` | uuid | FK → `alerts` |
| `reported_by` | uuid | FK → `auth.users` |
| `location` | text | |
| `description` | text | |
| `sighted_at` | timestamptz | |
| `created_at` | timestamptz | |

### `cases`
SAPS case number assigned to an alert.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `alert_id` | uuid | FK → `alerts` (unique — one case per alert) |
| `case_number` | text | SAPS case number |
| `assigned_by` | uuid | FK → `auth.users` (authority role) |
| `station_id` | uuid | FK → `saps_stations` |
| `created_at` | timestamptz | |

### `schools`
School institution records. Created by admin only.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `emis_number` | text | DBE EMIS number (optional) |
| `address` | jsonb | |
| `saps_station_id` | uuid | FK → `saps_stations` |
| `contact_phone` | text | |
| `contact_email` | text | |
| `created_at` | timestamptz | |

### `saps_stations`
SAPS station records. Geographic scoping unit.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `province` | text | |
| `contact_phone` | text | |
| `created_at` | timestamptz | |

### `notifications`
In-app notifications per user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `auth.users` |
| `alert_id` | uuid | FK → `alerts` (optional) |
| `type` | text | `alert \| sighting \| case_assigned \| system` |
| `title` | text | |
| `message` | text | |
| `read` | boolean | Default false |
| `created_at` | timestamptz | |

---

## Five Roles

| Role | Who | Onboarding | Capabilities |
|---|---|---|---|
| `parent` | Guardian of a registered child | Self-register | Register children, create alerts, view own children and alerts |
| `school` | School staff | Admin-invite, assigned to a school | View enrolled children, confirm last-seen on active alerts |
| `authority` | SAPS officer, ward councillor, DSD | Admin-invite, assigned to a SAPS station | View all alerts in their station, assign SAPS case numbers, update alert status |
| `community` | Community champion, CPF member | Self-register, assigned to a SAPS station area | View active alerts in their area, submit sighting reports |
| `admin` | Unami Foundation operator | Supabase invite | Full access — user management, school/station management, all alerts |

---

## Core Workflows (v2)

### 1. Parent registers child
Parent creates account → creates child profile (name, DOB, gender, photo, ID number, school, address, medical info) → system generates digital ID card (QR code).

### 2. Parent reports missing child
Parent selects child → fills alert form (type, description, last seen details, contact) → alert created with `active` status → alert timeline entry created → notifications sent to: school (if child has school), authority users at the child's SAPS station, community members in the station area.

### 3. School confirms last seen
School user receives notification → opens alert → confirms or updates last-seen information → timeline entry created.

### 4. Community reports sighting
Community member sees alert → submits sighting (location, description, time) → sighting saved → timeline entry created → parent and authority notified.

### 5. Authority assigns case number
Authority user opens alert → assigns SAPS case number → case record created → timeline entry created → parent notified.

### 6. Alert resolved
Authority or parent marks alert resolved → status updated → `resolved_at` set → timeline entry created → all stakeholders notified.

---

## What Carries Over from Moments Admin

The entire shell infrastructure is reused:
- Auth pattern (`(uncip)/layout.tsx` as single auth gate, `getOperatorSession()`)
- `PageHeader`, `KPIGrid`, `MetricCard`, `TablePagination`, `TableToolbar`, `EmptyState`, `ErrorState`, `PageSkeleton`, `TableSkeleton` from `@unami/ui`
- Shadcn primitives from local `src/components/ui/`
- Edge Function pattern (Hono router, `_shared/auth.ts`, `_shared/cors.ts`)
- `packages/api` typed client pattern
- Form page layout (two-column, sticky sidebar)
- Detail page layout (`max-w-3xl`, `PageHeader` actions)

---

## What Is New (Does Not Exist in Platform)

| Item | Notes |
|---|---|
| 8 new database tables | `children`, `guardians`, `alerts`, `alert_timeline`, `sightings`, `cases`, `schools`, `saps_stations` |
| 5 role-based dashboards | parent, school, authority, community, admin |
| Outbound notifications | Email via Supabase (or SMS via future integration) |
| Digital ID card generation | QR code + printable card layout |
| POPIA consent capture | At child registration — explicit consent, recorded |
| Data retention sweep | Scheduled Edge Function |
| RLS policies | Role + relationship + station-scoped |

---

## Security and Safeguarding — Non-Negotiable

These are not optional. They are the minimum bar before any real data is handled.

1. No hardcoded credentials anywhere
2. No debug API routes — ever
3. All API routes require authentication
4. Supabase Auth only — no NextAuth, no Firebase
5. POPIA consent captured and recorded at child registration
6. Child ID numbers encrypted at rest (Supabase Vault or column-level encryption)
7. RLS enforced at database level — not just application level
8. Cascade deletion: deleting a child removes all associated records
9. Audit log for all sensitive operations (child profile access, alert creation, case assignment)
10. No plaintext passwords — Supabase Auth handles this natively

---

## What to Read Before Writing Code

1. `docs/context/uncip/UNCIP_EXTRACTION_SUMMARY.md` — what the original was
2. `docs/context/uncip/UNCIP_V2_MIGRATION_MAP.md` — what survives, what doesn't
3. `docs/context/uncip/UNCIP_PRIVACY_AND_SAFEGUARDING.md` — what must not be repeated
4. `docs/DATABASE_SCHEMA.md` — before any schema changes
5. `PROJECT_STATUS.md` — current phase and rules

---

## Implementation Sequence

Do not skip steps. Do not begin a step until the previous is complete.

**Step 1 — Database**
- Update `docs/DATABASE_SCHEMA.md` with all 8 new tables
- Write migration `009_uncip_schema.sql`
- RLS policies for all tables

**Step 2 — Edge Functions**
- `supabase/functions/uncip-children/` — CRUD for child profiles
- `supabase/functions/uncip-alerts/` — alert creation, status updates, timeline
- `supabase/functions/uncip-sightings/` — community sighting reports
- `supabase/functions/uncip-notifications/` — outbound notification dispatch

**Step 3 — API Clients**
- `packages/api/src/clients/uncip-children.ts`
- `packages/api/src/clients/uncip-alerts.ts`
- `packages/api/src/clients/uncip-sightings.ts`

**Step 4 — App Scaffold**
- `apps/uncip/` — Next.js app, same structure as `apps/admin`
- Auth, shell, navigation, role-based routing

**Step 5 — Admin Dashboard**
- User management (invite school/authority users, assign to school/station)
- School management
- SAPS station management
- All alerts view

**Step 6 — Parent Dashboard**
- Child profile management (create, view, edit)
- Digital ID card view
- Alert creation
- Alert history

**Step 7 — School Dashboard**
- Enrolled children list
- Active alerts for enrolled children
- Last-seen confirmation workflow

**Step 8 — Authority Dashboard**
- Active alerts for their station
- Case number assignment
- Alert status management

**Step 9 — Community Dashboard**
- Active alerts in their area
- Sighting report submission

**Step 10 — Notifications**
- Outbound email on alert creation
- Outbound email on sighting, case assignment, resolution

---

## Reference Files

All original UNCIP analysis is in `docs/context/uncip/`:
- `UNCIP_PRODUCT_CONTEXT.md` — product intent and domain
- `UNCIP_DATA_MODEL.md` — original data model (reference only)
- `UNCIP_WORKFLOWS.md` — original workflows (reference only)
- `UNCIP_ROLES_AND_ACCESS.md` — original access model (reference only)
- `UNCIP_PRIVACY_AND_SAFEGUARDING.md` — security audit of original
- `UNCIP_V2_MIGRATION_MAP.md` — what survives into v2
- `UNCIP_EXTRACTION_SUMMARY.md` — entry point summary
