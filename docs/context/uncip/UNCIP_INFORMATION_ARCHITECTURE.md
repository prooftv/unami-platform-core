# UNCIP Information Architecture Decision Record

**Status:** DECIDED — architectural review complete, implementation not yet started
**Date:** 2026-08-12
**Supersedes:** Nothing. First architecture decision record for the UNCIP event/media/location layer.
**Prerequisite for:** Phase D implementation (case number, sighting location, child photo, alert media, map)

---

## Context

Phase A (write surface), Phase B (authorization/scoping), and Phase C (deployment, self-registration, seed data) are complete.

Before expanding the write surface further, an architectural review was conducted to ensure the information model is correct for UNCIP's operational purpose: an institutional child-safety coordination system, not a generic CRUD database.

The central operational object is an **incident/alert** and its **institutional response timeline**. All information architecture decisions flow from this.

---

## What UNCIP Is (Architectural Constraint)

UNCIP is an operational child-safety coordination system. The core workflow is:

```
Child identity record
  ↓
Incident raised (alert)
  ↓
Institutional response
  ├── School confirms last seen
  ├── Authority assigns case number
  ├── Community reports sighting
  └── Authority resolves
  ↓
Immutable timeline (permanent audit record)
```

Media and location must be **purpose-driven and event-scoped**. The system must never become a mechanism for tracking children or users continuously.

---

## A — Already Correct (Do Not Change)

- `uncip_alerts` structure and field set
- `uncip_alert_timeline` immutability model (INSERT only, no UPDATE/DELETE)
- `actor_role` denormalisation on timeline entries (role at time of action — correct because roles can change)
- `uncip_children.photo_url` column (schema exists, upload path missing)
- `uncip_child_medical` as a separate table (POPIA special category — correct)
- RLS + response stripping for community privacy
- `last_seen_location` as text (sufficient for pilot)
- `note TEXT` on timeline entries for narrative

---

## B — Must Not Change

- The incident-centric model (`uncip_alerts` as the central operational object)
- The immutable timeline (no UPDATE/DELETE on `uncip_alert_timeline`)
- The role-scoped RLS architecture
- The `actor_role` denormalisation pattern
- The separation of `uncip_child_medical` from `uncip_children`
- `last_seen_location` as a text field — do not replace with coordinates-only; text + optional coordinates is correct

---

## C — Should Become First-Class Data

### `case_number TEXT` on `uncip_alert_timeline`

A SAPS case number is a formal institutional reference. It is not narrative. It must not live in the `note` field.

- Nullable column — only populated for `authority_assigned_case` entries
- Queryable and indexable
- Displayed as a formal field in the timeline UI, not parsed from free text

### `sighting_location TEXT` on `uncip_alert_timeline`

A community sighting location is a structured operational fact. It must not live in the `note` field.

- Nullable column — only populated for `community_sighting_reported` entries
- Text description now; nullable `sighting_lat` / `sighting_lng` added later when map is built

**Why not JSONB?**
The action types are known and finite. First-class nullable columns are more correct than a generic JSONB blob for this domain. JSONB is appropriate for Moments (heterogeneous governance metadata). It is not appropriate for UNCIP's timeline where each action type has a specific, queryable operational field.

---

## D — Should Use Structured Metadata

Nothing in the current UNCIP model warrants a generic `metadata JSONB` column. All structured data has a known type and belongs in a named column.

---

## E — Separate Evidence/Media Abstraction

### Child identity photograph

- Belongs on `uncip_children.photo_url` (column already exists)
- Requires: Supabase Storage bucket (`children-photos`) + upload field in `/children/new`
- Access: parent/guardian (own children), school (enrolled), authority (station area), admin — **never community**
- This is a property of the child record, not of an incident

### Alert-level and timeline-level media

Future table: `uncip_alert_media`

```
id                uuid PRIMARY KEY
alert_id          uuid NOT NULL REFERENCES uncip_alerts(id)
timeline_entry_id uuid REFERENCES uncip_alert_timeline(id)  -- null = alert-level media
uploaded_by       uuid NOT NULL REFERENCES auth.users(id)
role_at_upload    text NOT NULL  -- UNCIPRole at time of upload
file_type         text NOT NULL  -- 'image' | 'document' | 'pdf'
storage_path      text NOT NULL
public_url        text NOT NULL
file_size         bigint NOT NULL
mime_type         text NOT NULL
created_at        timestamptz NOT NULL DEFAULT now()
```

`timeline_entry_id` nullable FK:
- `null` → media belongs to the alert itself (e.g. parent attaches photo when raising alert)
- set → media belongs to a specific timeline entry (sighting photo, SAPS document)

**Do not implement yet.** Child photo upload path is the immediate priority.

---

## F — Should Eventually Become Geospatial Data

All as plain `NUMERIC` columns (not PostGIS geometry — not needed for pin-on-map use case):

| Column | Table | When to add |
|---|---|---|
| `last_seen_lat`, `last_seen_lng` | `uncip_alerts` | When map input is built |
| `sighting_lat`, `sighting_lng` | `uncip_alert_timeline` | When map input is built |
| `lat`, `lng` | `uncip_schools` | When map is built |
| `lat`, `lng` | `uncip_saps_stations` | When map is built |

Text descriptions remain alongside coordinates — do not replace text with coordinates-only.

---

## G — Should Remain Optional

- All coordinate fields (text descriptions sufficient for pilot)
- Sighting photo (text sighting description sufficient for pilot)
- Alert-level media (child photo on child record sufficient for pilot)
- School confirmation structured fields (`note` + `actor_role` + `timestamp` sufficient)

---

## H — Must Never Be Captured

- Reporter/user device location (parent location when raising alert, community member location when reporting sighting)
- Continuous child location tracking of any kind
- Biometric data
- Weather context (description field is sufficient; weather does not change operational response in a structured way for the pilot)
- Any data not directly tied to the incident or the child's identity

---

## I — Role-Specific Map Visibility

| Layer | Admin | Parent | School | Authority | Community |
|---|---|---|---|---|---|
| Active incident pins | All nationally | Own children only | Enrolled children | Station area | Station area (type + status only — no child identity) |
| Last-seen location | Yes | Own alerts | Enrolled children | Station area | Location only, no child name/photo |
| Sighting locations | Yes | Own alerts | Enrolled children | Station area | Own sightings only |
| School locations | All | Child's school | Own school | Station area schools | No |
| Station boundaries | All | No | No | Own station | Own station |
| Child address | Yes | Own children | Enrolled children | Station area | **Never** |

Community map pins must show: alert type, status, general area. Never: child name, child photo, child address, identification number.

---

## J — Role-Specific Media Visibility

| Media type | Admin | Parent | School | Authority | Community |
|---|---|---|---|---|---|
| Child identity photo | Yes | Own children | Enrolled children | Station area | **Never** |
| Sighting photos | Yes | Own alerts | Enrolled children | Station area | Own uploads only |
| SAPS documents | Yes | No | No | Own station | **Never** |
| Alert-level media | Yes | Own alerts | Enrolled children | Station area | **Never** |

---

## K — Implementation Order

### Step 1 — `case_number` and `sighting_location` on `uncip_alert_timeline`

One migration. No RLS change (columns are nullable, existing table-level RLS covers them).
Update `uncip-timeline` Edge Function to accept and return these fields.
Update `AddTimelineEntryInput` in `packages/api`.
Update `AlertActionPanel` to use dedicated inputs for case number and sighting location.

**This is the next implementation task.**

### Step 2 — Child photo upload

Supabase Storage bucket (`children-photos`) + upload field in `/children/new`.
The `photo_url` column already exists on `uncip_children` and the Edge Function already accepts it.
Only the upload mechanism is missing.

### Step 3 — Alert action panel completion

The timeline actions exist in schema and Edge Functions but the UI forms are minimal.
`school_confirmed_last_seen`, `authority_assigned_case` (with case number field), and
`community_sighting_reported` (with sighting location field) need proper form inputs.
This is the core pilot workflow demonstration.

### Step 4 — `uncip_alert_media` table + storage

Design and implement after Steps 1–3 are working. Not before.

### Step 5 — Coordinate columns + map UI

Add nullable lat/lng columns to `uncip_alerts`, `uncip_alert_timeline`, `uncip_schools`,
`uncip_saps_stations` when the map component is ready. Not before.

---

## Conceptual Model

```
Child (uncip_children)
  ├── Identity: name, DOB, gender, ID number, photo_url → Storage
  ├── School: school_id → uncip_schools
  ├── Address: text columns
  └── Medical: uncip_child_medical (separate table — POPIA special category)

Alert / Incident (uncip_alerts)
  ├── child_id → Child
  ├── alert_type, status, description
  ├── Last-seen context
  │    ├── last_seen_at (timestamp)
  │    ├── last_seen_location (text)
  │    ├── last_seen_wearing (text)
  │    └── [future] last_seen_lat, last_seen_lng (nullable numeric)
  ├── contact_phone
  └── lifecycle: created_by, resolved_at, resolved_by

Timeline (uncip_alert_timeline — immutable, append-only)
  ├── actor_id, actor_role (denormalised), action, timestamp
  ├── note TEXT (narrative — all action types)
  ├── case_number TEXT (nullable — authority_assigned_case only)
  └── sighting_location TEXT (nullable — community_sighting_reported only)
       └── [future] sighting_lat, sighting_lng (nullable numeric)

Media (uncip_alert_media — not yet built)
  ├── alert_id → Alert
  ├── timeline_entry_id → Timeline entry (nullable — null = alert-level)
  ├── uploaded_by, role_at_upload
  └── file_type, storage_path, public_url, file_size, mime_type
```

---

## What This Document Is Not

This document does not:
- Authorize any implementation
- Replace the UNCIP constitution (`apps/uncip/UNCIP_V2_FRONTEND.md`)
- Replace the schema decisions document (`UNCIP_SCHEMA_DECISIONS.md`)
- Define the full API contract for new fields (that follows implementation authorization)
