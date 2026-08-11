# UNCIP Reimagined — Step 8 Implementation Handoff

## READ FIRST

Before making any changes, read:

```text
docs/context/uncip/SESSION_RESET.md
docs/context/uncip/UNCIP_SCHEMA_DECISIONS.md
apps/uncip/UNCIP_V2_FRONTEND.md
apps/uncip/src/domain/uncip/types.ts
PROJECT_STATUS.md
PLATFORM.md
```

Also inspect the existing Supabase Edge Function conventions in the repository before creating new functions.

The repository is the source of truth.

---

## PROJECT IDENTITY

This is **UNCIP Reimagined**.

It is not Moments V2 and not a version of the Moments application.

UNCIP Reimagined takes architectural lessons from the Moments platform and reimagines them for:

- child identification
- safeguarding
- missing-child response
- institutional coordination

UNCIP has its own constitution, ontology, authorization model, database, and operational workflow.

Do not import Moments domain assumptions into UNCIP.

---

## CURRENT STATE

```text
Constitution              FROZEN
Domain Types              FROZEN
Synthetic Fixtures        FROZEN
Domain Components         COMPLETE
Pages                     COMPLETE
Interaction States        COMPLETE
Schema Decisions          DECIDED
Database Schema           COMPLETE  — commit b506f48
RLS                       COMPLETE  — commit b506f48
Edge Functions            COMPLETE  — commit 1ed6fc2
                         ↓
                    STEP 8 COMPLETE
                         ↓
                    STEP 9 NEXT
                  Typed API Clients
```

---

## WHAT WAS BUILT IN STEP 8

### `supabase/functions/_shared/uncip-auth.ts`

Shared UNCIP authentication helper. Key properties:

- `requireUNCIPAuth(req, allowedRoles?)` — resolves Supabase Auth user, fetches `uncip_user_profiles`, rejects inactive accounts
- Never trusts client-supplied `role`, `stationId`, `schoolId`, `userId`
- Returns a user-JWT-scoped Supabase client so RLS applies to every downstream query
- Service role used only for pre-flight checks that require elevated access (e.g. Decision 1 identification_number lookup)

### `supabase/functions/uncip-stations/index.ts`

```text
GET  /uncip-stations          — all authenticated roles, filterable by province
GET  /uncip-stations/:id      — all authenticated roles
POST /uncip-stations          — admin only
```

### `supabase/functions/uncip-schools/index.ts`

```text
GET  /uncip-schools           — all authenticated roles, filterable by province + station_id
GET  /uncip-schools/:id       — all authenticated roles
POST /uncip-schools           — admin only
```

### `supabase/functions/uncip-children/index.ts`

```text
GET   /uncip-children              — RLS-scoped list with guardian links
GET   /uncip-children/:id          — RLS-scoped detail with guardian links + medical
POST  /uncip-children              — parent or admin; parent auto-linked as primary guardian
PATCH /uncip-children/:id          — guardian or admin; RLS enforces ownership
POST  /uncip-children/:id/guardians — admin only
```

Decision 1 (identification_number nullable at registration) applied here — field is optional on create.

### `supabase/functions/uncip-alerts/index.ts`

```text
GET   /uncip-alerts              — RLS-scoped list, filterable by status/alert_type/child_id
GET   /uncip-alerts/:id          — RLS-scoped detail with timeline
POST  /uncip-alerts              — creates alert + auto-inserts alert_raised timeline entry
PATCH /uncip-alerts/:id/status   — status transition with timeline entry
```

Business rules enforced:

- **Decision 1**: `alert_type = 'missing'` blocked if `identification_number` is null on child record
- **Decision 3a**: school role restricted to `alert_type = 'medical'` only
- **Decision 3b**: parent role restricted to `cancelled` / `false_alarm` transitions only — cannot resolve
- `resolved_at` / `resolved_by` set automatically on `resolved` transition
- `alert_raised` timeline entry auto-inserted at creation
- `status_changed` timeline entry auto-inserted at every transition

### `supabase/functions/uncip-timeline/index.ts`

```text
GET  /uncip-timeline?alert_id=:id  — read timeline for an alert
POST /uncip-timeline               — append timeline entry
```

Business rules enforced:

- Decision 3 permission table enforced: each role restricted to its permitted actions
- `alert_raised` blocked — owned by alerts function at creation
- `status_changed` blocked — owned by alerts function at transition
- Append-only: no UPDATE, no DELETE routes exist
- Actor identity and role always come from authenticated profile, never from request body

---

## AUTHORIZATION ARCHITECTURE

```text
Supabase Auth identity
        ↓
uncip_user_profiles (role, station_id, school_id, is_active)
        ↓
Edge Function business rules (workflow, domain constraints)
        ↓
RLS (data-access boundary — always active underneath)
```

RLS is never bypassed. The user-JWT-scoped client means every query goes through RLS regardless of what the Edge Function does.

---

## WHAT STEP 8 DOES NOT INCLUDE

- Notifications — deferred (depend on core alert lifecycle being real first)
- Frontend wiring — deferred to Step 10
- Fixture replacement — deferred to Step 10
- `mock_role` changes — irrelevant to backend, do not touch

---

## STEP 8 COMPLETION GATE

```text
✓ authenticated Edge Function requests work
✓ child reads work (RLS-scoped)
✓ child creation works (parent auto-linked)
✓ guardian linking works (admin-managed)
✓ alert creation works
✓ identification-number rule enforced (Decision 1)
✓ school alert type restriction enforced (Decision 3a)
✓ parent status restriction enforced (Decision 3b)
✓ timeline insertion works
✓ timeline permissions enforced (Decision 3 table)
✓ status transitions work
✓ timeline is append-only
✓ RLS active underneath all functions
✓ reference data reads work
✓ no fixture data used by backend
✓ no frontend wiring introduced
```

Negative authorization cases to verify before declaring Step 8 fully tested:

```text
Community → child lookup          → DENIED (RLS + no route)
Community → medical lookup        → DENIED (RLS)
Community → guardian lookup       → DENIED (RLS)
Parent → another parent's child   → DENIED (RLS)
Parent → another parent's alert   → DENIED (RLS)
School → unrelated school's child → DENIED (RLS)
Authority → another station's data → DENIED (RLS)
Parent → resolve alert            → DENIED (Edge Function)
School → non-medical alert        → DENIED (Edge Function)
Unauthorized role → prohibited timeline action → DENIED (Edge Function + RLS)
```

End-to-end workflow to verify:

```text
Parent raises missing-child alert
  → alert created, alert_raised inserted
School confirms last seen
  → school_confirmed_last_seen inserted
Authority assigns case
  → authority_assigned_case inserted
Community reports sighting
  → community_sighting_reported inserted
Authority resolves
  → status_changed inserted, alert.status = resolved
```

---

## NEXT PHASE — STEP 9

Typed API clients in:

```text
packages/api/src/clients/
```

Expected files:

```text
uncip-children.ts
uncip-alerts.ts
uncip-schools.ts
uncip-stations.ts
uncip-timeline.ts
```

The clients must use the canonical types from:

```text
apps/uncip/src/domain/uncip/types.ts
```

The existing frontend pages and components must not need to change their data shape — only their data source.

---

## STEP 10 (AFTER STEP 9)

Replace:

```text
import { FIXTURE_CHILDREN } from '@/fixtures/uncip'
```

with:

```text
const children = await uncipClient.children.list()
```

Replace `mock_role` with real Supabase Auth session resolution.

The existing pages and components are reused as-is. Do not rebuild the frontend.

---

## CONTINUITY

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
SCHEMA DECISIONS  ✅
     ↓
DATABASE / RLS    ✅  b506f48
     ↓
EDGE FUNCTIONS    ✅  1ed6fc2  ← CURRENT
     ↓
API CLIENTS            ← NEXT
     ↓
REAL AUTH + DATA
```
