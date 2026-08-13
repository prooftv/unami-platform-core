# UNCIP Operational Roadmap

**Status:** Active — post-foundation phase definition
**Supersedes:** Nothing. This is the first operational definition document.
**Foundation milestone:** `d381d8a` — foundational architecture complete
**Written after:** Steps 1–11 complete. Real auth, real database, real RLS, zero fixtures in production paths.

---

## What UNCIP Can Do Today

The system is real and operational. A user with a valid Supabase Auth account and an
`uncip_user_profiles` row can authenticate, receive a role-scoped session, and interact
with the application through typed API clients backed by Edge Functions and RLS.

**What works end-to-end today:**

```
Authentication          Real Supabase Auth → uncip_user_profiles → role-scoped session
Children list           GET /uncip-children — RLS-scoped by role
Child detail            GET /uncip-children/:id — with joined medical + guardians
Alerts list             GET /uncip-alerts — RLS-scoped by role
Alert detail            GET /uncip-alerts/:id — with joined timeline
Stations list           GET /uncip-stations
Users list              Direct query against uncip_user_profiles (admin only)
```

**What does not yet exist:**

```
Child registration form         No create UI
Alert creation form             No create UI
Guardian management             No add/remove guardian UI
School confirmation action      No UI action
Authority case assignment       No UI action
Community sighting report       No UI action
Status transitions              No UI action
Role-filtered navigation        All roles see all nav items
Notifications                   Not built
Vercel deployment               Not configured
```

The system has a complete read surface. It has no write surface.

---

## The Minimum Complete Pilot Workflow

This is the single vertical slice that must work end-to-end for the government pilot
presentation. Everything else is secondary to this.

```
1.  Admin registers a school
2.  Admin registers a SAPS station
3.  Admin creates a school user account (school staff)
4.  Admin creates an authority user account (SAPS officer)
5.  Admin creates a community user account (CPF member)
6.  Parent creates their own account (self-registration)
7.  Parent registers a child
8.  Parent links themselves as guardian
9.  Parent raises a missing-child alert
10. School receives the alert and confirms last seen
11. Authority receives the alert and assigns a case number
12. Community sees the alert in their station area
13. Community submits a sighting report
14. Authority receives the sighting and resolves the case
15. Complete immutable timeline exists on the alert record
16. Admin can view the full case history
```

This workflow is the product. Every capability decision should be evaluated against
whether it enables, supports, or is required by this workflow.

---

## What Each Role Must Be Able To Do

### Parent

**Must have:**
- Self-registration (create account, assigned `parent` role)
- Register a child (name, DOB, gender, photo, optional ID number)
- View own children
- View child detail (identity, medical if entered, guardians)
- Raise a missing-child alert for a registered child
- View own alerts and their timeline
- Cancel or mark false alarm on own active alerts
- Add notes to own alerts

**Should have (pilot):**
- Edit child record (update photo, address, school assignment)
- Add/update medical information
- Receive notification when alert status changes

**Deferred:**
- Multiple guardians per child (add co-guardian)
- Transfer primary guardian
- Child photo upload

---

### School

**Must have:**
- View children enrolled at their school
- View active alerts for enrolled children
- Confirm last seen on an alert (school_confirmed_last_seen action)
- Add notes to alerts for enrolled children

**Should have (pilot):**
- Raise a medical alert for an enrolled child
- View alert timeline

**Deferred:**
- Bulk enrollment management
- School profile editing

---

### Authority

**Must have:**
- View all active alerts within their station area
- View alert detail and full timeline
- Assign a case number (authority_assigned_case action)
- Resolve an alert (status_changed → resolved)
- Add notes to alerts

**Should have (pilot):**
- View children registered within their station area
- Filter alerts by type and status

**Deferred:**
- Cross-station escalation
- Reporting / export

---

### Community

**Must have:**
- View active alerts in their station area
- Submit a sighting report (community_sighting_reported action)
- Add a note to an alert

**Should have (pilot):**
- Alert detail view (limited — no child identity data)

**Deferred:**
- Push notifications
- WhatsApp integration

---

### Admin

**Must have:**
- Create and manage SAPS stations
- Create and manage schools (assign to station)
- Create user accounts (all roles)
- Assign and change user roles
- Deactivate users
- View all children, all alerts, all timeline entries
- View system-wide KPIs on dashboard

**Should have (pilot):**
- Invite user by email (send registration link)
- View audit log

**Deferred:**
- Bulk import (schools, children)
- Reporting / export
- Multi-province dashboard

---

## Capability Inventory

Derived from the role requirements above. Grouped by type.

### Write capabilities not yet built

| Capability | Role(s) | Priority |
|---|---|---|
| Child registration form | parent | P0 — pilot blocker |
| Alert creation form | parent, school (medical) | P0 — pilot blocker |
| School confirmation action | school | P0 — pilot blocker |
| Authority case assignment action | authority | P0 — pilot blocker |
| Community sighting action | community | P0 — pilot blocker |
| Alert status transition (resolve/cancel/false_alarm) | authority, parent | P0 — pilot blocker |
| Note added action | all roles | P0 — pilot blocker |
| User creation (admin) | admin | P0 — pilot blocker |
| Station creation (admin) | admin | P0 — pilot blocker |
| School creation (admin) | admin | P0 — pilot blocker |

### Read capabilities not yet built

| Capability | Role(s) | Priority |
|---|---|---|
| Role-filtered navigation | all | P1 — pilot quality |
| Parent: own children only | parent | P1 — pilot quality |
| School: enrolled children only | school | P1 — pilot quality |
| Authority: station-area alerts only | authority | P1 — pilot quality |
| Community: station-area alerts only | community | P1 — pilot quality |

### Infrastructure not yet built

| Capability | Priority |
|---|---|
| Vercel deployment (`apps/uncip`) | P0 — required for pilot |
| Self-registration flow (parent) | P0 — pilot blocker |
| Role-based navigation filtering | P1 — pilot quality |
| Notifications (in-app or WhatsApp) | P2 — post-pilot |

---

## What Should Remain Outside the Pilot

These are real product requirements but they are not required to demonstrate the core
proposition to the Minister of Basic Education.

```
Push notifications
WhatsApp integration
Child photo upload
Multiple guardians per child
Cross-station escalation
Bulk import
Reporting / export
Multi-province dashboard
Audit log UI
Mobile-optimised PWA
```

The pilot demonstrates the workflow. It does not need to be the finished product.

---

## What the Pilot Demonstration Proves

The government pilot presentation must prove one proposition:

> **One child record becomes the common operational reference through which parents,
> schools, authorities and communities coordinate a safeguarding response.**

Specifically:

1. A parent can register a child and raise an alert in under 5 minutes
2. A school receives the alert immediately and can confirm last seen
3. A SAPS officer receives the alert, assigns a case number, and coordinates response
4. A community member sees the alert and can submit a sighting
5. The authority resolves the case and the timeline is complete and immutable
6. An administrator can see the full case history across all participants

If those six things work in a live demonstration, the proposition is proven.

---

## Implementation Sequence

The sequence follows the pilot workflow, not the technical module structure.

### Phase A — Write Surface (P0 blockers)

Build the forms and actions that enable the pilot workflow.

```
A1  Child registration form (parent)
A2  Alert creation form (parent + school medical)
A3  Alert action panel — school confirmation, authority case assignment,
    community sighting, status transitions, note added
A4  Admin user management — create user, assign role, deactivate
A5  Admin station + school creation
```

### Phase B — Role Experience (P1 quality)

Ensure each role sees only what they should see.

```
B1  Role-filtered navigation (parent/community see simplified nav)
B2  Parent scope — own children and alerts only
B3  School scope — enrolled children and their alerts only
B4  Authority scope — station-area alerts and children
B5  Community scope — station-area alerts, no child identity
```

### Phase C — Deployment (P0 infrastructure)

```
C1  Vercel deployment for apps/uncip
C2  Self-registration flow (parent account creation)
C3  Environment variables and secrets configured
C4  Migration 009 applied to production Supabase
C5  Seed data — at least 2 stations, 5 schools, test accounts for all 5 roles
```

### Phase D — Pilot Validation

```
D1  End-to-end workflow test with real accounts (all 5 roles)
D2  Safeguarding review — confirm no real child data in any environment
D3  Pilot demonstration rehearsal
```

---

## Deliberate Constraints

These constraints are not limitations — they are product decisions.

**Community sees alerts, not children.**
The community role has zero access to child identity records. This is enforced at RLS.
A community member sees that a child is missing in their area. They do not see the child's
full identity record. This is the safeguarding boundary.

**Parents see only their own children.**
A parent cannot browse other children in the system. Guardian-link is the only access path.

**Authority is station-scoped.**
An authority user sees alerts within their station area only. National visibility is admin-only.
This prevents a single SAPS officer from accessing the entire national dataset.

**The timeline is immutable.**
No timeline entry can be edited or deleted. The audit trail is permanent.
This is enforced at RLS (INSERT only on `uncip_alert_timeline`).

**Identification number is optional at registration, required before missing alert.**
A child can be registered without documentation. But a missing-child alert requires
identification to prevent false reports and ensure the record refers to a specific child.

---

## Production Status (2026-08-13)

**Baseline commit: `cedffd5`**

The deployment gate is cleared. The pilot workflow is partially operational.

### What works end-to-end in production

```
Authentication          Supabase Auth → uncip_user_profiles → role-scoped session ✅
Children list/detail    GET /uncip-children — RLS-scoped, fromWire() mapped ✅
Alert list/detail       GET /uncip-alerts — RLS-scoped, timeline joined ✅
Alert creation          POST /uncip-alerts (parent, school, admin) ✅
Timeline actions        POST /uncip-timeline (all roles, permission-enforced) ✅
Status transitions      PATCH /uncip-alerts/:id/status ✅
Schools/stations        GET /uncip-schools, /uncip-stations ✅
Media upload/retrieval  /uncip-media (D5) ✅
Spatial projection      /map — stations, schools, alerts with coordinates ✅
Role-aware dashboard    Five distinct role projections (F9) ✅
Community privacy       child_id stripped, case_number not rendered ✅
```

### D1–D5 data layer milestones

| Milestone | What it added | Commit |
|---|---|---|
| D1 | `case_number`, `sighting_location` on timeline | `6eb2db2` |
| D2 | `children-photos` storage bucket, `photo_url` | `e3be370` |
| D3 | Role/action permission matrix, RLS recursion fix | `1e193ec` |
| D4 | `lat`/`lng` on stations, schools, alerts, sightings | `26af25f` |
| D5 | `uncip-media` Edge Function, alert + timeline evidence | `855e2cf` |

### Frontend audit F1–F9

| Finding | Resolution | Commit |
|---|---|---|
| F1 status/type in header | AlertDetailPage header | `fb34b7d` |
| F2 timeline provenance | AlertTimeline redesign | `fb34b7d` |
| F3 actor identity | `actor_name` column + Edge Function writes | `fb34b7d` |
| F4 active/closed separation | alerts/page.tsx split | `fb34b7d` |
| F5 community privacy presentation | AlertSummaryCard `isCommunity` | `fb34b7d` |
| F6 map spatial projection | Seed data populated | (data) |
| F7 incident documents context | AlertDetailPage evidence section | `fb34b7d` |
| F8 operational card ordering | AlertDetailPanel reorder | `fb34b7d` |
| F9 role-aware dashboard | Five role projections, work queues | `b4c4044` |
| Community case_number exposure | AlertTimeline role guard | `cedffd5` |

### Remaining pilot workflow items

The following from the Phase A/B capability inventory are still needed for a complete pilot demonstration:

| Capability | Status |
|---|---|
| Child registration form | ✅ Built (Phase A) |
| Alert creation form | ✅ Built (Phase A) |
| School confirmation action | ✅ Built (Phase A) |
| Authority case assignment | ✅ Built (Phase A) |
| Community sighting action | ✅ Built (Phase A) |
| Status transitions | ✅ Built (Phase A) |
| Role-filtered navigation | ✅ Built (Phase B) |
| Role-aware dashboard | ✅ Built (F9) |
| Spatial map projection | ✅ Built (D4) |
| Evidence/media | ✅ Built (D5) |
| Self-registration (parent) | ✅ Built |
| Pilot seed data (5 roles, 2 stations, 5 schools, 1 child) | ✅ Populated |

**The minimum complete pilot workflow (steps 1–16 in this document) is now demonstrable.**

### What remains before a formal government pilot presentation

1. Real child data — the current seed data uses test accounts and fictional children
2. Safeguarding review — confirm no test data persists in production before real children are registered
3. Pilot rehearsal — end-to-end walkthrough with real accounts across all five roles
4. Terms of service / privacy policy routes (currently linked but not built)

These are operational/legal items, not engineering blockers.
