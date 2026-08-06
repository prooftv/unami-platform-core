# Moments Evolution

Constitutional bridge document.
Read before any Phase 17D–17H implementation.
Read alongside `docs/abstractions/umkhandlu/11_MOMENTS_ADAPTATION.md` and `09_PLATFORM_MAPPING.md`.

This document answers one question:

> Now that the platform capabilities are established through Umkhandlu,
> how does Moments evolve to use them — without becoming Umkhandlu?

---

## What Changed

When Moments was first designed, it was a broadcast platform:

```
Admin creates moment
  → moment is approved
    → moment is broadcast via WhatsApp
      → subscribers receive it
```

That model is still correct. It does not change.

What changes is the **depth** of what a moment can be, and the **intelligence** the platform
can derive from the community activity that moments generate.

The Umkhandlu work established that the platform already has:
- A record architecture (typed, authored, lineage-linked institutional events)
- A notice architecture (typed, dated public communications that initiate processes)
- An evidence architecture (attachments, environmental context, verification)
- A participation architecture (consent-gated, webhook-delivered, never stored)
- A commercial architecture (campaigns, certified deliverables, project tracking)
- An intelligence architecture (aggregations, health signals, derived metrics)

Moments does not need to rebuild any of these. It needs to **consume** them with community vocabulary.

---

## The Vocabulary Decision

This table is frozen. These names are used everywhere — in the database, in the admin UI,
in the public PWA, in API responses, in documentation. Do not invent alternatives.

| Platform Concept | Moments Vocabulary | What it means in Moments |
|---|---|---|
| Record | Community Record | A formal community outcome — meeting minutes, decision, report, concern |
| Notice (community) | Moment | A typed community communication — the existing core concept |
| Notice (statutory) | Consultation Moment | A moment that opens a formal participation window |
| Evidence | Community Evidence | Media, documents, and environmental context attached to a moment |
| Participation submission | Community Response | A structured response to a consultation moment |
| Participation log | Response Log | Anonymised record of community responses |
| Campaign (ad/activation) | Sponsored Campaign | Existing — a sponsored communication initiative |
| Campaign (csr) | Community Project | A development or infrastructure project with tracking |
| Certified deliverable | Project Milestone | A verified completion point in a community project |
| Progress log | Project Update | An append-only update on a community project |
| RAG status | Project Health | Green / Amber / Red — community project status |
| Beneficiary count | Community Impact | Number of community members directly affected |
| Lineage chain | Community Timeline | The chain of moments and records that document a community matter |
| Intelligence dashboard | Community Intelligence | Aggregated community activity, trends, and health signals |

---

## Concept-by-Concept Evolution

### 1. Moment (unchanged core)

The moment remains the central unit. Nothing about the existing moment model changes.

What evolves is the **type vocabulary** — moments gain new types that unlock new capabilities.

**Current types:** `standard` · `community` · `opportunity` · `infrastructure` · `consultation`

**These are already correct.** The evolution is in what each type enables:

| Type | Current capability | Evolution |
|---|---|---|
| `standard` | Broadcast | Unchanged |
| `community` | Broadcast | Can produce a Community Record |
| `opportunity` | Broadcast | Unchanged |
| `infrastructure` | Broadcast | Can produce a Community Project, attach Community Evidence |
| `consultation` | Broadcast | Opens a Response Window, accepts Community Responses |

No new moment types are needed. The existing types are extended with optional capabilities.

---

### 2. Community Record (new — Phase 17D)

A Community Record is a formal outcome produced by a community moment.

It is not a replacement for a moment. It is what a moment can produce.

```
Community Moment (type = 'community')
  → community meeting happens
    → admin creates Community Record
      → record is linked to the originating moment
        → record becomes part of the Community Timeline
```

**What it is:**
- Minutes of a community meeting
- A community decision or resolution
- A community report or status update
- A community concern with an ongoing life

**What it is not:**
- A governance record (no traditional authority vocabulary)
- A statutory instrument (no legal mandate)
- A replacement for a moment (moments still broadcast; records document outcomes)

**Database impact:**
The platform `records` table (added in migration 006) already exists.
Moments uses it with community-appropriate type values.
No new table needed. The `origin_notice_id` FK links the record to its originating moment
(moments are notices in the platform model).

**Admin UI:** A "Create Record" action on community and infrastructure moment detail pages.
The record form is simple: type, title, content, status. The moment link is automatic.

**Public PWA:** Records appear in the Community Timeline on a moment's detail page.
They are not broadcast — they are discoverable context.

---

### 3. Consultation Moment + Community Response (new — Phase 17E)

A Consultation Moment is a moment of type `consultation` that opens a formal response window.

The participation engine already exists (Phase 17E in the original plan). The evolution is:
- The public PWA surfaces the response form as a first-class experience
- The response window has a deadline
- The response count is displayed publicly
- Responses are consent-gated, webhook-delivered, never stored (same architecture as governance)

**What it is:**
- A community survey
- A public objection window
- An RSVP for a community event
- A structured feedback form on an infrastructure project

**What it is not:**
- A statutory public participation process (that is Umkhandlu's domain)
- A data collection tool (personal data is never stored — webhook-delivered only)

**Database impact:** `participation_log` table already exists (migration 003).
`participation_enabled` and `participation_deadline` columns already exist on `moments` (migration 002).
No new tables needed.

**Admin UI:** The consultation moment form already has participation toggle and deadline.
Evolution: response count displayed on moment detail, response type breakdown in analytics.

**Public PWA:** Response form on consultation moment detail. Deadline countdown.
Response count displayed. Consent gate enforced.

---

### 4. Community Evidence (existing — formalised in Phase 17F)

Community Evidence already exists as the `evidence` table (migration 004).
The evolution is in how it is presented and what it enables.

**Current state:** Evidence is an admin-only upload attached to a moment.

**Evolution:**
- Evidence is surfaced publicly on moment detail pages
- Infrastructure moments display evidence as a project record
- Environmental context (weather snapshot) is captured automatically on moment creation
- Evidence count is a signal in Community Intelligence

**What it is:**
- Photos of infrastructure work
- Documents related to a community matter
- Environmental context at the time of a community event
- Verification that something happened

**What it is not:**
- A media gallery (evidence has formal status — it is not decorative)
- User-generated content (evidence is admin-uploaded and admin-verified)

**Database impact:** No new tables. `evidence` table and `weather_context` column already exist.

---

### 5. Community Project (new — Phase 17G)

A Community Project is a campaign of type `csr` — a development or infrastructure initiative
with full project tracking.

The commercial layer already supports this (migration 005). The evolution is in the admin UX
and the public PWA surface.

**What it is:**
- A road construction project
- A community hall renovation
- A water infrastructure upgrade
- A school feeding programme
- Any initiative with a sponsor, a budget, deliverables, and community beneficiaries

**What it is not:**
- A sponsored advertisement (that is campaign type `ad`)
- A community event (that is a moment)
- A governance project (that is Umkhandlu's domain)

**Database impact:** No new tables. `campaign_type = 'csr'`, `project_health`, `project_phase`,
`deliverables_certified`, `progress_log`, `beneficiaries` already exist on `campaigns` (migration 005).

**Admin UI:** The campaign form already has CSR fields. Evolution: project milestone management,
progress update feed, RAG status indicator, beneficiary count.

**Public PWA:** Community Projects page. Per-project detail with milestone timeline,
progress updates, beneficiary count, sponsor attribution, evidence attachments.

---

### 6. Community Timeline (new — Phase 17H)

The Community Timeline is the lineage chain for a community matter.

It connects:
```
Consultation Moment
  → Community Responses (participation)
    → Community Record (outcome)
      → Community Evidence (verification)
        → Community Project (if infrastructure)
          → Project Milestones (progress)
```

This is not a new database concept. It is a new **presentation** of existing data.

The timeline is assembled from:
- The originating moment
- Any records linked via `origin_notice_id`
- Evidence attached to the moment
- Participation counts and response types
- Campaign/project linked to the moment (if any)

**Database impact:** No new tables. A new Edge Function route or server-side query assembles
the timeline from existing tables.

**Public PWA:** A "Community Timeline" section on moment detail pages for community and
infrastructure moments. A standalone `/timeline/[id]` route for significant community matters.

**Admin UI:** A timeline view on moment detail — shows the full chain of activity.

---

### 7. Community Intelligence (new — Phase 17H)

Community Intelligence is the public-facing aggregation layer.

It is not the admin analytics dashboard (that already exists).
It is not the Control Centre (that is for governance nodes).
It is the community-facing view of what is happening in their area.

**What it surfaces:**
- Active consultation moments and their response counts
- Infrastructure projects and their health status
- Recent community records (outcomes, decisions)
- Sponsor impact (projects funded, beneficiaries reached)
- Community activity by region and category

**What it is not:**
- A governance dashboard
- A Control Centre
- An admin analytics tool

**Public PWA surfaces:**
- `/intelligence` — community overview (regional activity, project health, participation trends)
- `/region/[region]` — already exists, evolves to include project health and participation data
- `/category/[category]` — already exists, evolves to include intelligence signals

**Database impact:** No new tables. New Edge Function routes aggregate from existing tables.

---

## Phase Assignment

| Concept | Phase | Status | Prerequisite |
|---|---|---|---|
| Moment types (existing) | 17A | ✅ Complete | — |
| Participation engine (backend) | 17E | ✅ Complete | — |
| Evidence layer (backend) | 17F | ✅ Complete | — |
| Commercial layer (backend) | 17G | ✅ Complete | — |
| Sanity editorial layer | 17C | ⏳ Next | Content ownership frozen ✅ |
| Community Record (admin UI + public) | 17D | ⏳ | 17C complete |
| Consultation Moment UX (public PWA) | 17E | ⏳ | 17D complete |
| Community Evidence (public surface) | 17F | ⏳ | 17E complete |
| Community Project (admin UI + public) | 17G | ⏳ | 17F complete |
| Community Timeline (public PWA) | 17H | ⏳ | 17G complete |
| Community Intelligence (public PWA) | 17H | ⏳ | 17G complete |
| WhatsApp integration | 17I | ⏳ | 17H complete |
| Production validation | 17J | ⏳ | 17I complete |

---

## What Moments Must Not Become

These boundaries are permanent.

- **Not a governance platform.** Moments serves communities, not institutions.
  Traditional authority vocabulary (Inkosi, Induna, Isigodi, PTO) never enters Moments.

- **Not a statutory compliance tool.** Moments is not a legal instrument.
  SPLUMA, NEMA, PAJA participation requirements are Umkhandlu's domain.

- **Not a project management tool.** Community Projects in Moments are community-facing.
  Full project management (ITPMS) is a separate application.

- **Not a duplicate of the Control Centre.** Community Intelligence in Moments is
  community-facing. The Control Centre aggregates across governance nodes.
  These are different audiences, different data, different purpose.

- **Not a CMS.** Moments is an operational platform. Editorial content lives in Sanity.
  The boundary is frozen in `docs/context/CONTENT_OWNERSHIP.md`.

---

## The Test for Every Evolution Decision

Before adding any capability to Moments, answer:

1. Does it serve the community member (subscriber, resident, participant)?
   → If yes, it may belong in Moments.

2. Does it serve the governance institution (traditional authority, municipality, statutory body)?
   → If yes, it belongs in Umkhandlu, not Moments.

3. Does it duplicate something already in the platform (`packages/`, existing tables)?
   → If yes, consume it — do not rebuild it.

4. Does it require new platform tables?
   → Update `docs/DATABASE_SCHEMA.md` first. Then write the migration.

5. Does it introduce governance vocabulary into Moments?
   → Stop. Translate to community vocabulary first. See the vocabulary table above.

---

## Relationship to Existing Documents

| Document | Relationship |
|---|---|
| `docs/abstractions/umkhandlu/11_MOMENTS_ADAPTATION.md` | High-level structural mapping — this document operationalises it |
| `docs/abstractions/umkhandlu/09_PLATFORM_MAPPING.md` | Platform vs domain classification — this document applies it to Moments |
| `docs/context/CONTENT_OWNERSHIP.md` | Sanity vs Supabase boundary — frozen, not affected by this evolution |
| `docs/DATABASE_SCHEMA.md` | Schema source of truth — update here before any new migration |
| `docs/context/MOMENTS_WHATSAPP.md` | WhatsApp integration — Phase 17I, after all other phases complete |
| `docs/context/MOMENTS_SESSION_PROMPT.md` | Session context — update task list as phases complete |
| `PROJECT_STATUS.md` | Execution tracking — update phase status as work completes |
