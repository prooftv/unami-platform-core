# UNCIP V2 — SESSION RESET PROMPT

You are continuing an existing UNCIP V2 architecture and implementation project.

**Do not restart the project. Do not repeat completed work. Do not invent missing context.**

Before responding to anything, read these files from the repository:

```text
PROJECT_STATUS.md
apps/uncip/UNCIP_V2_FRONTEND.md
docs/context/uncip/UNCIP_SCHEMA_DECISIONS.md
```

Then inspect the current UNCIP source tree only where necessary.

The repository is the source of truth.

---

# CURRENT PROJECT

**UNCIP V2 — National Child Identification Program**

Repository: `prooftv/unami-platform-core`
Application: `apps/uncip`

---

# MILESTONE — FOUNDATIONAL ARCHITECTURE COMPLETE

**Commit: `d381d8a`**

UNCIP Reimagined is no longer a prototype. The application operates against its real backend and authorization model.

The full build sequence is complete:

```text
CONSTITUTION          FROZEN   apps/uncip/UNCIP_V2_FRONTEND.md
DOMAIN TYPES          FROZEN   apps/uncip/src/domain/uncip/types.ts
FIXTURES              FROZEN   apps/uncip/src/fixtures/uncip/ (historical reference only)
DOMAIN COMPONENTS     COMPLETE
PAGES                 COMPLETE
INTERACTION STATES    COMPLETE
SCHEMA DECISIONS      COMPLETE docs/context/uncip/UNCIP_SCHEMA_DECISIONS.md
DATABASE + RLS        COMPLETE b506f48 — 009_uncip_schema.sql, 8 tables, uncip_current_profile()
EDGE FUNCTIONS        COMPLETE 1ed6fc2 — uncip-children, uncip-alerts, uncip-schools, uncip-stations, uncip-timeline
API CLIENTS           COMPLETE 06bed7a — createUNCIPApiClient factory, all 5 typed clients
REAL AUTH             COMPLETE 0fcde4f — operator.ts, middleware.ts, login wired, all 6 pages
INTEGRATION AUDIT     COMPLETE d381d8a — as never removed, mock-session deleted, users page on real DB
```

---

# WHAT IS GONE

The following no longer exist in the codebase:

- `mock-session.ts` — deleted
- `RoleSwitcher` component — deleted
- `setMockRole` server action — removed
- Dev banner in layout — removed
- `as never` type bridges — all removed
- Fixture-backed routes — all 7 pages now on real API calls
- Domain → API translation hacks — components consume API types directly

---

# REAL AUTHORIZATION CHAIN

```text
User
 ↓
Supabase Auth (JWT validated server-side via getUser())
 ↓
uncip_user_profiles (role, station_id, school_id, is_active)
 ↓
getUNCIPSession() / getUNCIPClient()
 ↓
Edge Functions (business rules + Decision enforcement)
 ↓
PostgreSQL + RLS (community safeguarding boundary enforced at DB layer)
 ↓
UNCIP UI
```

---

# CONSTITUTION — FROZEN

File: `apps/uncip/UNCIP_V2_FRONTEND.md`

Central entity:

```text
Child
├── GuardianLink[]
├── schoolId → School
├── address (flat: addressStreet, addressCity, addressProvince, addressPostalCode)
├── medicalInfo (joined: uncipChildMedical)
└── Alert[]
      └── AlertTimelineEntry[] (joined: uncipAlertTimeline)
```

Five roles: `parent` `school` `authority` `community` `admin`

Core response workflow:

```text
Parent raises alert → School confirms last seen → Authority assigns case
→ Community reports sighting → Authority resolves
```

---

# CANONICAL TYPES — FROZEN

File: `apps/uncip/src/domain/uncip/types.ts`

These are the **conceptual UNCIP ontology**. Do not modify unless a genuine contradiction is discovered.

The API types in `packages/api/src/clients/uncip-*.ts` represent the actual persisted/API shape.
Components consume API types directly. The domain types remain the conceptual reference.

---

# THREE DECISIONS — LOCKED

## Decision 1 — Identification Number
**C — Optional at registration, required before missing-child alert.**
- `identification_number` nullable on `uncip_children`
- Edge Function rejects `alert_type = 'missing'` if `identification_number` is null

## Decision 2 — Parent Station Scope
**A — Guardian-link only.**
- Parent sees only their own children and alerts for those children
- `station_id` is NULL for parent rows in `uncip_user_profiles`

## Decision 3 — Alert Timeline Action Permissions
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

# SAFEGUARDING BOUNDARY

Community role has **zero access** to child identity, medical, or guardian data.
Enforced at RLS layer — not just UI. This is non-negotiable.

---

# CURRENT STATUS

```text
Foundational architecture     COMPLETE  d381d8a
Platform isolation            COMPLETE  43227f1
Environment guard             COMPLETE  (this commit)
Phase A write surface         COMPLETE  2478367
```

## Deployment Gate — must complete before operational features

```
✅ New UNCIP Supabase project created          — tqragjtvcnsmumtaijds
✅ Migration 009_uncip_schema.sql applied      — verified 2026-08-12
✅ UNCIP Edge Functions deployed               — all 5 ACTIVE (verified 2026-08-12)
✅ NEXT_PUBLIC_UNCIP_SUPABASE_URL set in Vercel
✅ NEXT_PUBLIC_UNCIP_SUPABASE_ANON_KEY set in Vercel
✅ Vercel root directory = apps/uncip
✅ Production build succeeds on Vercel         — commit 2478367 deployed, state=success
✅ Login works against UNCIP Auth              — getUser() confirmed working
□ RLS verified in UNCIP project               — not formally verified
□ Database contains no Moments data           — not verified
□ No Moments credentials present in UNCIP environment — not verified
```

## Known operational issue (2026-08-12)

Edge functions return WORKER_ERROR (HTTP 500) when called with non-user JWTs
(anon key, service role key). This is caused by supabase-js v2.50.0 throwing
on getUser() when the JWT has no `sub` claim (403 from auth server).

Real user JWTs (with sub claim) are expected to work correctly.
Dashboard showing ErrorState is most likely caused by Vercel env vars pointing
to the wrong Supabase project URL. Requires Vercel dashboard verification.

Production URL: https://unami-platform-core-uncip-admin.vercel.app

Once the deployment gate is cleared, begin Phase A of the operational roadmap.
See `docs/context/uncip/UNCIP_OPERATIONAL_ROADMAP.md`.

---

# CONTINUITY PRINCIPLE

```text
CONSTITUTION          ✅ FROZEN
TYPE FREEZE           ✅ FROZEN
FIXTURE FREEZE        ✅ FROZEN (historical reference only)
COMPONENTS            ✅ COMPLETE
PAGES                 ✅ COMPLETE
INTERACTION STATES    ✅ COMPLETE
SCHEMA DECISIONS      ✅ GATE CLEARED
DATABASE / RLS        ✅ b506f48
EDGE FUNCTIONS        ✅ 1ed6fc2 (redeployed 2026-08-12, all 5 ACTIVE)
API CLIENTS           ✅ 06bed7a
REAL AUTH             ✅ 0fcde4f
INTEGRATION AUDIT     ✅ d381d8a
PLATFORM ISOLATION    ✅ 43227f1
PHASE A WRITE SURFACE ✅ 2478367  ← child, alert, station, school, user creation

DEPLOYMENT GATE       ✅ Substantially cleared (see known issue above)
OPERATIONAL ROADMAP   ← ACTIVE — Phase A complete, Phase B next
```
API CLIENTS           ✅ 06bed7a
REAL AUTH             ✅ 0fcde4f
INTEGRATION AUDIT     ✅ d381d8a
PLATFORM ISOLATION    ✅ 43227f1  (separate Supabase project, env guard)

DEPLOYMENT GATE       ← NEXT (ops)
OPERATIONAL ROADMAP   ← AFTER DEPLOYMENT GATE
```
