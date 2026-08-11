# UNCIP V2 — SESSION RESET PROMPT

You are continuing an existing UNCIP V2 architecture and implementation project.

**Do not restart the project. Do not repeat completed work. Do not invent missing context.**

Before responding to anything, read these files from the repository:

```text
PROJECT_STATUS.md
PLATFORM.md
apps/uncip/UNCIP_V2_FRONTEND.md
docs/context/uncip/UNCIP_SCHEMA_DECISIONS.md
```

Then inspect the current UNCIP source tree only where necessary.

The repository is the source of truth.

---

# CURRENT PROJECT

**UNCIP V2 — National Child Identification Program**

Repository:

```text
prooftv/unami-platform-core
```

Application:

```text
apps/uncip
```

UNCIP V2 is being developed using a constitution-first process.

The objective is a **real application**, not a permanent prototype made from fixtures and mock implementations.

---

# COMPLETED FOUNDATION

The following phases are complete.

```text
1. Constitution
2. Canonical domain types
3. Synthetic fixtures
4. Domain components
5. Pages
6. Interaction states + role experience verification
```

The resulting architecture is:

```text
Source extraction
      ↓
UNCIP V2 Constitution
      ↓
Canonical domain types
      ↓
Synthetic fixtures
      ↓
Domain components
      ↓
Pages
      ↓
Interaction states
      ↓
Role experience verification
```

The frontend foundation is now complete.

---

# CONSTITUTION — FROZEN

File:

```text
apps/uncip/UNCIP_V2_FRONTEND.md
```

Status: **FROZEN**

The central entity is:

```text
Child
├── GuardianLink[]
├── schoolId → School
├── address
├── medicalInfo
└── Alert[]
      └── AlertTimelineEntry[]
```

Five roles exist:

```text
parent
school
authority
community
admin
```

The core response workflow is:

```text
Parent raises alert
        ↓
School receives / confirms last seen
        ↓
Authority receives / assigns case
        ↓
Community reports sighting
        ↓
Authority resolves
```

---

# CANONICAL TYPES — FROZEN

File:

```text
apps/uncip/src/domain/uncip/types.ts
```

Status: **FROZEN / AUDITED**

Do not casually alter them.

---

# FIXTURES — FROZEN

Commit: `405e357`

The fixtures are development/test data only. They are not the backend.

Do not expand the fixture system to simulate persistence.
Do not build fake mutations against fixtures.
Do not add increasingly sophisticated mock infrastructure.

---

# DOMAIN COMPONENTS — COMPLETE

Commit: `a74615f`

```text
child/
alert/
station/
user/
```

Props-driven. Reusable when real API data replaces fixture data.

---

# PAGES — COMPLETE

Commit: `27ffb33`

```text
/dashboard
/children
/children/[id]
/alerts
/alerts/[id]
/users
/stations
```

---

# INTERACTION STATES + ROLE EXPERIENCE — COMPLETE

Commit: `2cb1b3e`

Every applicable route has: loading, error, empty, populated, not-found where applicable.

---

# MOCK ROLE SESSION — DEVELOPMENT ONLY

The current role switcher uses `mock_role`. This is not production authentication.

Do not extend it. Do not build permission logic around it.

The eventual architecture uses Supabase Auth and a UNCIP user profile.

---

# SAFEGUARDING

Do not introduce real child information into fixtures, tests, screenshots, commits, documentation examples, or development data.

---

# SCHEMA DECISIONS DOCUMENT

File:

```text
docs/context/uncip/UNCIP_SCHEMA_DECISIONS.md
```

Status: **ALL THREE DECISIONS RECORDED — MIGRATION 009 UNBLOCKED**

---

# THREE DECISIONS — RECORDED

## Decision 1 — Identification Number

**DECIDED: C — Optional at registration, required before missing-child alert.**

- `identification_number` is nullable on `uncip_children`
- Alert creation Edge Function rejects `alert_type = 'missing'` if `identification_number` is null
- Medical and welfare alerts may proceed without identification

## Decision 2 — Parent Station Scope

**DECIDED: A — Guardian-link only.**

- Parent sees only their own children and alerts for those children
- `station_id` is NULL for parent rows in `uncip_user_profiles`
- No station-scoped community alert feed for parents in V2

## Decision 3 — Alert Timeline Action Permissions

**DECIDED.**

**3a — School alert creation:** School may raise `alert_raised` for medical alert type only.

**3b — Parent resolution:** Parent may perform `status_changed` for cancel/false_alarm on own alerts only. `resolved` is reserved for authority and admin.

**3c — `status_changed` action:** Keep as single action. Splitting would require modifying the frozen `AlertTimelineAction` type — not acceptable.

**Approved permission table:**

| Action | Parent | School | Authority | Community | Admin |
|---|---|---|---|---|---|
| `alert_raised` | ✓ own children | ✓ medical only | — | — | ✓ |
| `school_confirmed_last_seen` | — | ✓ enrolled | — | — | ✓ |
| `authority_assigned_case` | — | — | ✓ | — | ✓ |
| `community_sighting_reported` | — | — | — | ✓ | ✓ |
| `status_changed` | ✓ cancel/false_alarm own | — | ✓ resolve | — | ✓ |
| `note_added` | ✓ own alerts | ✓ enrolled | ✓ | ✓ | ✓ |

---

# CURRENT STATUS

```text
Constitution                  FROZEN
Domain types                  FROZEN
Synthetic fixtures            FROZEN
Domain components             COMPLETE
Pages                         COMPLETE
Interaction states            COMPLETE
Role experience verification  COMPLETE

Schema decisions document     COMPLETE
Founder decisions             ALL DECIDED

Database migration            COMPLETE  — b506f48
RLS                           COMPLETE  — b506f48
Edge Functions                COMPLETE  — 1ed6fc2
API clients                   NOT STARTED  ← NEXT
Real authentication           NOT STARTED
Fixture replacement           NOT STARTED
```

Latest commit: `1ed6fc2`

---

# THE NEXT SESSION'S JOB

Read `docs/context/uncip/STEP8_HANDOFF.md` for full Step 8 context and the Step 9 contract.

## Step 9 — Typed API clients

Create typed clients in `packages/api/src/clients/` that wrap the five Edge Functions.
Use canonical types from `apps/uncip/src/domain/uncip/types.ts`.

Expected files:

```text
packages/api/src/clients/uncip-children.ts
packages/api/src/clients/uncip-alerts.ts
packages/api/src/clients/uncip-schools.ts
packages/api/src/clients/uncip-stations.ts
packages/api/src/clients/uncip-timeline.ts
```

## Step 10 (after Step 9)

Replace fixture imports with API calls. Replace `mock_role` with real Supabase Auth.
Do not rebuild the frontend — pages and components are reused as-is.

Do not rebuild the frontend. The pages and components are reused as-is.
The structural change is replacing:

```typescript
import { FIXTURE_CHILDREN } from '@/fixtures/uncip';
```

with:

```typescript
const children = await uncipClient.children.list();
```

---

# CONTINUITY PRINCIPLE

```text
CONSTITUTION
     ↓
TYPE FREEZE
     ↓
FIXTURE FREEZE
     ↓
COMPONENTS
     ↓
PAGES
     ↓
INTERACTION STATES
     ↓
SCHEMA DECISIONS  ✅ GATE CLEARED
     ↓
DATABASE / RLS    ✅  b506f48
     ↓
EDGE FUNCTIONS    ✅  1ed6fc2
     ↓
API CLIENTS            ← YOU ARE HERE
     ↓
REAL AUTH
     ↓
REAL DATA
```
