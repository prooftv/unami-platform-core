# UNCIP Schema Decisions

**Authority:** This document is the gate before `supabase/migrations/009_uncip_schema.sql` can be written.

**Status:** DRAFT — three decisions are open. Migration cannot begin until all three are resolved.

**Relationship to constitution:** `apps/uncip/UNCIP_V2_FRONTEND.md` defines what the domain is.
This document defines how it is persisted, who can access it, and what constraints apply.

---

## Purpose

The UNCIP V2 frontend foundation is complete (Steps 1–6, commit `2cb1b3e`).
The frozen domain types in `apps/uncip/src/domain/uncip/types.ts` are the application's
contract with the backend. This document translates that contract into:

1. Physical table design — how TypeScript types map to PostgreSQL tables
2. Data-access invariants — the governance rules that RLS must enforce
3. Three open decisions — questions that must be answered before the migration is written

---

## Physical Table Design

### Relationship to TypeScript types

The TypeScript types define what the application expects. The physical schema defines how
persistence represents it. These are not the same thing.

```
TypeScript type          →  PostgreSQL table(s)
─────────────────────────────────────────────────
ChildRecord              →  uncip_children
ChildAddress             →  column group on uncip_children (not a separate table)
ChildMedicalInfo         →  uncip_child_medical (separate table — special category data)
GuardianLink             →  uncip_guardian_links
AlertRecord              →  uncip_alerts
AlertTimelineEntry       →  uncip_alert_timeline
School                   →  uncip_schools
SAPSStation              →  uncip_saps_stations
UserRecord               →  uncip_user_profiles (extends auth.users)
```

**Rationale for ChildAddress as columns (not a table):**
Address is a single-value sub-object. A child has one address. Normalising it into a separate
table adds a JOIN for no benefit. Columns on `uncip_children` are simpler and correct.

**Rationale for ChildMedicalInfo as a separate table:**
Medical information is a special category under POPIA. Separating it into its own table
allows independent RLS policies, independent audit logging, and future encryption at rest
without affecting the main child record. It also makes it possible to grant access to
medical data independently of identity data — relevant for emergency responders.

**Rationale for UserRecord as a profile table (not a replacement for auth.users):**
Supabase Auth owns identity. `uncip_user_profiles` extends it with UNCIP-specific fields:
`role`, `stationId`, `schoolId`, `isActive`. The profile is created on first sign-in via
a database trigger or Edge Function. The `id` column is a foreign key to `auth.users.id`.

---

## Table Definitions

### `uncip_saps_stations`

Reference data. Created by admin. Read by all authenticated users.

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
province      text NOT NULL  -- Province enum value
district      text
contact_phone text
created_at    timestamptz NOT NULL DEFAULT now()
```

### `uncip_schools`

Reference data. Created by admin. Read by all authenticated users.

```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
name          text NOT NULL
emis          text           -- EMIS number (DBE identifier) — nullable until safeguarding review
province      text NOT NULL
address       text NOT NULL
contact_phone text
contact_email text
created_at    timestamptz NOT NULL DEFAULT now()
```

### `uncip_user_profiles`

One row per Supabase Auth user. Created on first sign-in.

```sql
id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
email      text NOT NULL
name       text
role       text NOT NULL  -- UNCIPRole enum value
station_id uuid REFERENCES uncip_saps_stations(id)  -- authority, community; parent: see Decision 2
school_id  uuid REFERENCES uncip_schools(id)         -- school role only
is_active  boolean NOT NULL DEFAULT true
created_at timestamptz NOT NULL DEFAULT now()
```

### `uncip_children`

Central entity. Address stored as column group.

```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
first_name            text NOT NULL
last_name             text NOT NULL
date_of_birth         date NOT NULL
gender                text NOT NULL  -- ChildGender enum value
photo_url             text
identification_number text           -- see Decision 1
school_id             uuid REFERENCES uncip_schools(id)
-- address columns (ChildAddress)
address_street        text
address_city          text
address_province      text           -- Province enum value
address_postal_code   text
created_by            uuid NOT NULL REFERENCES auth.users(id)
created_at            timestamptz NOT NULL DEFAULT now()
updated_at            timestamptz NOT NULL DEFAULT now()
```

**Note:** `identification_number` nullability is Decision 1.

### `uncip_child_medical`

Special category data. Separate table for independent access control.
One row per child. Created when medical information is first provided.

```sql
id                          uuid PRIMARY KEY DEFAULT gen_random_uuid()
child_id                    uuid NOT NULL UNIQUE REFERENCES uncip_children(id) ON DELETE CASCADE
blood_type                  text
allergies                   text[] NOT NULL DEFAULT '{}'
conditions                  text[] NOT NULL DEFAULT '{}'
medications                 text[] NOT NULL DEFAULT '{}'
emergency_contact_name      text
emergency_contact_relationship text
emergency_contact_phone     text
created_at                  timestamptz NOT NULL DEFAULT now()
updated_at                  timestamptz NOT NULL DEFAULT now()
```

### `uncip_guardian_links`

Join table between users and children. Replaces V1 dual model.

```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
child_id     uuid NOT NULL REFERENCES uncip_children(id) ON DELETE CASCADE
user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
relationship text NOT NULL  -- GuardianRelationship enum value
is_primary   boolean NOT NULL DEFAULT false
created_at   timestamptz NOT NULL DEFAULT now()
UNIQUE (child_id, user_id)
```

### `uncip_alerts`

One row per alert. Flat schema — V1 dual schema is retired.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
child_id            uuid NOT NULL REFERENCES uncip_children(id)
alert_type          text NOT NULL  -- AlertType enum value
status              text NOT NULL DEFAULT 'active'  -- AlertStatus enum value
description         text NOT NULL
last_seen_at        timestamptz NOT NULL
last_seen_location  text NOT NULL
last_seen_wearing   text
contact_phone       text NOT NULL
created_by          uuid NOT NULL REFERENCES auth.users(id)
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()
resolved_at         timestamptz
resolved_by         uuid REFERENCES auth.users(id)
```

### `uncip_alert_timeline`

Immutable append-only log. Entries are never updated or deleted.

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
alert_id    uuid NOT NULL REFERENCES uncip_alerts(id) ON DELETE CASCADE
actor_id    uuid NOT NULL REFERENCES auth.users(id)
actor_role  text NOT NULL  -- UNCIPRole enum value (denormalised — role at time of action)
action      text NOT NULL  -- AlertTimelineAction enum value
note        text
timestamp   timestamptz NOT NULL DEFAULT now()
```

**Immutability rule:** No UPDATE or DELETE on `uncip_alert_timeline`. RLS enforces INSERT only.
`actor_role` is denormalised because a user's role may change after the fact — the timeline
must record what role they held when they acted.

---

## Data-Access Invariants

These are the governance rules. RLS policies implement them. If the database implementation
changes, these invariants do not change.

### ADMIN

```
uncip_children        → all rows, all columns
uncip_child_medical   → all rows, all columns
uncip_guardian_links  → all rows
uncip_alerts          → all rows
uncip_alert_timeline  → all rows (read); can insert any action
uncip_user_profiles   → all rows; can create, deactivate, change role
uncip_schools         → all rows; can create, update
uncip_saps_stations   → all rows; can create, update
```

### PARENT

```
uncip_children        → rows where a guardian_link exists for this user
uncip_child_medical   → rows for children this user is guardian of
uncip_guardian_links  → rows where user_id = this user
uncip_alerts          → rows where child_id is a child this user is guardian of
uncip_alert_timeline  → read: same scope as alerts
                        insert: alert_raised, status_changed (own alerts), note_added
uncip_user_profiles   → own row only
uncip_schools         → read only (reference data)
uncip_saps_stations   → read only (reference data)
```

### SCHOOL

```
uncip_children        → rows where school_id = this user's school_id
uncip_child_medical   → rows for children enrolled at this school
uncip_guardian_links  → rows for children enrolled at this school (read only)
uncip_alerts          → rows where child_id is enrolled at this school
uncip_alert_timeline  → read: same scope as alerts
                        insert: school_confirmed_last_seen, note_added
uncip_user_profiles   → own row only
uncip_schools         → own school row only
uncip_saps_stations   → read only (reference data)
```

### AUTHORITY

```
uncip_children        → rows where child's school is in this user's station area
                        OR where an alert exists within this user's station area
uncip_child_medical   → same scope as children (emergency access)
uncip_guardian_links  → same scope as children (read only)
uncip_alerts          → rows where the alert's child is within this user's station area
uncip_alert_timeline  → read: same scope as alerts
                        insert: authority_assigned_case, status_changed, note_added
uncip_user_profiles   → own row only
uncip_schools         → schools within station area (read only)
uncip_saps_stations   → own station row (read only)
```

**Note on authority scope:** The station-area boundary for children requires a geographic
relationship between schools and stations. This relationship is not yet modelled.
See Open Question below.

### COMMUNITY

```
uncip_children        → no access (community does not see child identity records)
uncip_child_medical   → no access
uncip_guardian_links  → no access
uncip_alerts          → rows where the alert is within this user's station area (read only)
uncip_alert_timeline  → read: same scope as alerts
                        insert: community_sighting_reported, note_added
uncip_user_profiles   → own row only
uncip_schools         → no access
uncip_saps_stations   → own station row (read only)
```

**V2 decision confirmed:** Community is a read-and-report role. They see alerts in their
station area but never see child identity records directly.

---

## RLS Implementation Notes

### Session context

RLS policies need access to the current user's `role`, `station_id`, and `school_id`.
These are stored in `uncip_user_profiles`. Policies cannot JOIN against this table inline
without a performance penalty on every row evaluation.

The standard Supabase pattern is a security-definer function:

```sql
CREATE OR REPLACE FUNCTION uncip_current_profile()
RETURNS uncip_user_profiles
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT * FROM uncip_user_profiles WHERE id = auth.uid()
$$;
```

Policies then call `(uncip_current_profile()).role` etc. The function result is cached
per transaction, so it is evaluated once per query, not once per row.

### Station-area scoping for authority

The authority invariant requires knowing which children/alerts are "within a station area."
This requires a relationship between schools and stations. Two options:

**Option A:** Add `station_id` column to `uncip_schools`. Each school belongs to one station.
Authority scope = children enrolled at schools in their station.

**Option B:** Add a `uncip_school_stations` join table. Schools can span multiple stations.

Option A is simpler and sufficient for the pilot (30 schools, 3 provinces). Option B is
more correct for the real geography but adds complexity. This is an open question — see below.

---

## Three Open Decisions

These must be answered before the migration is written. They are not implementation details —
they are product and policy decisions that affect the schema, RLS, and Edge Function behaviour.

---

### Decision 1: Is `identification_number` required or optional?

**What it affects:**
- `NOT NULL` constraint on `uncip_children.identification_number`
- Validation in the child registration Edge Function
- The child registration form (required vs optional field)
- POPIA consent model (collecting SA ID numbers for children requires specific legal basis)

**Evidence from V1:**
The original system treated `identificationNumber` as optional. The field existed on the
`ChildProfileForm` but was not required. The privacy audit flagged collection of SA ID numbers
as requiring safeguarding/legal review.

**The question:**
Can a child be registered in UNCIP without an identification number? Or is the ID number
required to prevent duplicate registrations and ensure the record refers to a specific child?

**Options:**
- **Optional** — lower barrier to registration, more children enrolled, but duplicate records
  are possible and identity verification is weaker
- **Required** — stronger identity guarantee, but excludes children without documentation
  (a real concern in the target communities)
- **Optional at registration, required before alert** — a middle path: register without ID,
  but require it before raising a missing child alert

**Recommendation for consideration:** Optional at registration, required before alert.
This matches the product's self-determination principle — communities register children
first, documentation follows. But this is a founder decision, not an engineering decision.

**Status: OPEN — requires founder decision**

---

### Decision 2: Does the parent role have a `station_id`?

**What it affects:**
- `station_id` column on `uncip_user_profiles` for parent rows
- Parent registration flow (does it ask for station area?)
- Parent data-access invariant (is it purely guardian-link based, or also station-scoped?)
- Whether parents can see alerts for children in their area beyond their own children

**Evidence from V1:**
The original system had no geographic scoping at all. All authenticated users saw all alerts.
The V1 `UserProfile` type had no `stationId` field.

**The question:**
Is a parent's data access defined entirely by their guardian relationships (they see only
their own children and alerts), or are parents also geographically scoped to a station area?

**Options:**
- **Guardian-link only** — parent sees only children they are registered as guardian of,
  and alerts for those children. No station scoping. Simpler model.
- **Guardian-link + station scope** — parent also sees community alerts in their area
  (e.g. other missing children in their neighbourhood). More complex, but potentially
  more useful for community safety awareness.

**Recommendation for consideration:** Guardian-link only for V2. Station scoping for parents
can be added in a later phase if the product requires it. Starting with the simpler model
avoids over-engineering the auth layer before the product is validated.

**Status: OPEN — requires founder decision**

---

### Decision 3: Which roles may perform which `AlertTimelineAction`?

**What it affects:**
- RLS INSERT policy on `uncip_alert_timeline`
- Validation in the alerts Edge Function
- The UI (which action buttons are shown to which roles)
- The core workflow integrity (preventing out-of-sequence actions)

**Evidence from V1:**
The original system had no alert timeline at all. The multi-stakeholder response workflow
(parent → school → authority → community → authority) was described in the playbook but
never implemented. There is no V1 precedent for timeline action permissions.

**The proposed model (from the data-access invariants above):**

| Action | Parent | School | Authority | Community | Admin |
|---|---|---|---|---|---|
| `alert_raised` | ✓ own alerts | ✓ (medical) | ✓ | — | ✓ |
| `school_confirmed_last_seen` | — | ✓ enrolled | — | — | ✓ |
| `authority_assigned_case` | — | — | ✓ | — | ✓ |
| `community_sighting_reported` | — | — | — | ✓ | ✓ |
| `status_changed` | ✓ own (cancel/false_alarm) | — | ✓ (resolve) | — | ✓ |
| `note_added` | ✓ own alerts | ✓ enrolled | ✓ | ✓ | ✓ |

**Open sub-questions within this decision:**
- Can a school raise `alert_raised`? (V1 evidence: yes, for medical emergencies. The fixture
  `alert-003` demonstrates this. The constitution's core workflow shows parent as the raiser,
  but medical emergencies are typically raised by school staff.)
- Can a parent transition to `resolved`? (Proposed: no — only authority and admin can resolve.
  Parent can cancel or mark false alarm on their own alerts.)
- Is `status_changed` a single action covering all transitions, or should `resolved`,
  `cancelled`, and `false_alarm` be separate actions for cleaner audit trail?

**Status: OPEN — requires founder decision on the table above and the three sub-questions**

---

## Open Question: School-to-Station Geographic Relationship

This is not one of the three primary decisions, but it must be resolved before the authority
RLS policy can be written.

**The question:** How is a school associated with a SAPS station area?

**Proposed resolution:** Add `station_id uuid REFERENCES uncip_saps_stations(id)` to
`uncip_schools`. Each school belongs to one station. This is sufficient for the pilot scope
(30 schools, 3 provinces) and can be extended to a join table if multi-station schools
emerge as a real requirement.

**This is a schema design decision, not a product policy decision.** It can be resolved
by the engineering team without founder input, but it is recorded here because it affects
the authority RLS policy.

**Proposed answer:** Add `station_id` to `uncip_schools`. Record this as a schema decision
in `decisions.md` when the migration is written.

---

## What Happens After These Decisions Are Made

Once all three decisions are recorded with answers:

1. Update this document with the decisions
2. Write `supabase/migrations/009_uncip_schema.sql` — tables + RLS policies
3. Write Edge Functions: `children`, `alerts`, `schools`, `stations`
4. Write API clients: `packages/api/src/clients/uncip-children.ts` etc.
5. Wire the frontend: replace fixture imports with API calls, implement real auth

The frontend requires minimal changes in Step 5. The domain types are already the API
contract. The components are props-only. The pages have the correct data-fetching seam.
The structural change is replacing:

```typescript
import { FIXTURE_CHILDREN } from '@/fixtures/uncip';
```

with:

```typescript
const children = await uncipClient.children.list();
```

---

## What This Document Is Not

This document does not:
- Implement authentication (that is the auth phase, after Edge Functions)
- Define the Edge Function API surface (that is `UNCIP_API_CONTRACT.md`, written after this)
- Replace the constitution (`apps/uncip/UNCIP_V2_FRONTEND.md`)
- Modify the frozen domain types

The frozen domain types remain the application's contract. This document defines how
persistence represents those types — not what the types are.
