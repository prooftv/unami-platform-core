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

**Production baseline: `cedffd5` (2026-08-13)**

```text
Foundational architecture     COMPLETE  d381d8a
Platform isolation            COMPLETE  43227f1
Phase A write surface         COMPLETE  2478367
D1 incident/timeline fields   COMPLETE  6eb2db2
D2 child identity media       COMPLETE  e3be370
D3 role/action permissions    COMPLETE  1e193ec
D4 spatial foundation         COMPLETE  26af25f
D5 incident/timeline evidence COMPLETE  855e2cf
/children contract fix        COMPLETE  cdedbf4  ← fromWire() mapper
F3 actor provenance           COMPLETE  fb34b7d
Dashboard architecture        COMPLETE  3cbd60c  ← locked spec
F9 role-aware dashboard       COMPLETE  b4c4044
Community privacy fix         COMPLETE  cedffd5  ← case_number guard
```

## Production URL

```
https://unami-platform-core-uncip-admin.vercel.app
```

## Supabase Project

```
Project ref:  tqragjtvcnsmumtaijds
Migrations:   000–014 applied
Edge Functions: uncip-children, uncip-alerts, uncip-schools, uncip-stations,
                uncip-timeline, uncip-media (all deployed, all ACTIVE)
```

## Frontend Audit Status

```
F1  incident status/type in header          ✅  fb34b7d
F2  timeline provenance                     ✅  fb34b7d
F3  actor identity (actor_name)             ✅  fb34b7d + migration 014
F4  active/closed alert separation          ✅  fb34b7d
F5  community privacy presentation          ✅  fb34b7d
F6  map spatial projection                  ✅  spatial seed data populated
F7  incident documents/media context        ✅  fb34b7d
F8  operational card ordering               ✅  fb34b7d (partly)
F9  role-aware dashboard                    ✅  b4c4044
```

## Verification

F9 verification: 35/35 checks passed (2026-08-13).
All five role branches verified against live production data.
Every work queue traceable to canonical timeline state.
Community privacy boundary confirmed: child_id stripped, case_number not rendered.
Cross-role consistency confirmed: same alert has same status/timeline across all roles.

## Known Resolved Issues (architectural history)

| Issue | Resolution | Commit |
|---|---|---|
| `/children` Server Component crash (digest 2257899953) | `fromWire()` mapper added to `uncip-children.ts` API client | `cdedbf4` |
| RLS infinite recursion on cross-table policies | SECURITY DEFINER helper functions break cycles | `1e193ec` / migration 013 |
| Missing table grants (authenticated role) | Explicit GRANT SELECT/INSERT/UPDATE in migration 013 | migration 013 |
| Edge Runtime `npm:` import specifiers | All Edge Function imports use `npm:` prefix | `1e193ec` |
| `actor_name` not persisted on timeline | Migration 014 + Edge Function writes `profile.name` | `fb34b7d` |
| `case_number` rendered to community role | `currentRole !== 'community'` guard in `AlertTimeline` | `cedffd5` |
| Stations/schools/alerts had no spatial coordinates | Seed data populated via REST PATCH | (data only) |

---

# CONTINUITY PRINCIPLE

```text
CONSTITUTION          ✅ FROZEN   apps/uncip/UNCIP_V2_FRONTEND.md
DOMAIN TYPES          ✅ FROZEN   apps/uncip/src/domain/uncip/types.ts
FIXTURES              ✅ FROZEN   apps/uncip/src/fixtures/uncip/ (historical reference)
COMPONENTS            ✅ COMPLETE
PAGES                 ✅ COMPLETE
SCHEMA DECISIONS      ✅ COMPLETE docs/context/uncip/UNCIP_SCHEMA_DECISIONS.md
DATABASE / RLS        ✅ COMPLETE migrations 000–014
EDGE FUNCTIONS        ✅ COMPLETE all 6 deployed and ACTIVE
API CLIENTS           ✅ COMPLETE packages/api/src/clients/uncip-*.ts
REAL AUTH             ✅ COMPLETE operator.ts, middleware.ts
INTEGRATION AUDIT     ✅ COMPLETE d381d8a
PHASE A WRITE SURFACE ✅ COMPLETE 2478367
D1–D5 DATA LAYER      ✅ COMPLETE 855e2cf
FRONTEND AUDIT F1–F9  ✅ COMPLETE cedffd5
DASHBOARD ARCH        ✅ LOCKED   docs/context/uncip/DASHBOARD_ARCHITECTURE.md

NEXT                  ← Dashboard architecture checkpoint complete.
                        See docs/context/uncip/UNCIP_OPERATIONAL_ROADMAP.md
                        for remaining pilot workflow items.
```
