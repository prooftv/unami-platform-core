# Commercial Domain — Constitutional Reference

Unami Platform Core · Commercial Capability

This document is the constitutional reference for the commercial domain across all applications
in the Unami ecosystem. It defines the domain model, object hierarchy, platform boundaries,
database ownership, and evolution path.

No commercial implementation proceeds without alignment to this document.
When implementation and this document conflict, this document wins.

---

## 1. Purpose

The commercial domain exists to manage funded work, sponsorships, CSR initiatives,
infrastructure projects, service delivery, and measurable outcomes.

It is not an advertising system.
It is not a billing system.
It is not a project management tool.

It is the platform's model for tracking **what was funded, what was delivered, and what impact
it produced** — in a way that becomes institutional memory.

Every application in the Unami ecosystem has a commercial dimension:

| Application | Commercial expression |
|---|---|
| Moments | Sponsor placements, community campaigns, CSR activations |
| Umkhandlu | Infrastructure projects, CSR initiatives, SMME development |
| ITPMS | Funded ICT projects, contractor management, deliverable tracking |
| Schools Portal | Funded programmes, donor partnerships, outcome reporting |
| BeatsChain | Sponsored content, label partnerships, revenue tracking |
| Spree | Merchant operations, order fulfilment, commercial reporting |

The structure is platform-generic. The vocabulary is domain-specific.
The platform provides the model. Applications provide the meaning.

---

## 2. Commercial Philosophy

These principles are non-negotiable. They apply to every application that consumes the
commercial domain.

**Commercial work is evidence-backed.**
Every claim about a project — progress, completion, impact — must be traceable to a source.
Assertions without evidence are not commercial records. They are opinions.

**Progress is append-only.**
Progress entries are never edited or deleted. The log is the project's technical memory.
If a progress entry was wrong, a new entry corrects it. The original remains.

**Deliverables are certifiable.**
A deliverable is not complete until it is certified. Certification requires an authority,
a percentage, and a date. Partial certification is tracked. Disputed certification is preserved.

**Impact is measurable.**
Beneficiary counts, impact summaries, and lessons learned are not optional fields.
They are the commercial record's contribution to institutional memory.

**Reporting is derived, never manually assembled.**
Commercial reports are generated from the underlying records — progress log, certified
deliverables, evidence, participation log. They are never typed into a form.
If the underlying records change, the report changes.

**Commercial records become institutional memory.**
A completed project is not archived. It is a permanent record in the lineage chain.
Future projects reference it. Future reports aggregate it. Future intelligence surfaces it.

**Domain extensions must remain additive.**
New fields, new types, new relationships are always added — never replacing existing ones.
Backwards compatibility is a first-class concern. Other applications depend on this model.

---

## 3. Commercial Domain Map

This is the canonical hierarchy. Every commercial concept maps to a position in this chain.

```
Sponsor
  │
  └── Campaign
        │
        ├── [ad / activation type]
        │     Simple lifecycle. Sponsor placement or community event.
        │     No project tracking. No deliverables.
        │
        └── [csr type]
              │
              └── Project
                    │
                    ├── Milestone (future)
                    │     Named phase of work with its own deliverables
                    │
                    ├── Deliverable
                    │     Unit of certified completion
                    │     status: pending → certified / disputed
                    │
                    ├── Progress
                    │     Append-only timestamped technical entries
                    │     Engineer/PMU verified
                    │
                    ├── Evidence
                    │     Attachments, photos, certificates, IPC documents
                    │     Immutable — never removed
                    │
                    ├── Project Update (future)
                    │     Event log — sod turning, commissioning, handover
                    │     Separate table. Rich content. Gallery. Video.
                    │
                    ├── Participation Log
                    │     Anonymised community feedback
                    │     Operator-maintained from webhook data
                    │
                    ├── TCRS Conflict Log (future)
                    │     Variance tracking when sources disagree
                    │     Authority-classified. Never deleted.
                    │
                    ├── Certification
                    │     The act of verifying a deliverable is complete
                    │     Requires: authority, percentage, date
                    │
                    ├── Impact
                    │     Beneficiary count, impact summary, lessons learned
                    │     Written at closure. Permanent. Never overwritten.
                    │
                    └── Reporting (Layer 5)
                          Generated from all of the above
                          Never manually assembled
                          Revision-identified against source records
```

---

## 4. Domain Objects

### Sponsor

**Purpose:** The organisation or entity that funds or partners on a campaign.

**Ownership:** Platform table — `sponsors`. Reusable across all applications.

**Lifecycle:** `active` → `inactive`. No deletion — historical campaigns reference sponsors.

**Relationships:**
- One sponsor → many campaigns
- Sponsor is optional on a campaign (community-funded projects have no sponsor)

**Immutable fields:** `name`, `created_at`

**Required fields:** `name`, `display_name`

**Optional fields:** `contact_email`, `logo_url`, `website_url`, `tier`, `monthly_budget`

**Application vocabulary:**
- Moments: Sponsor
- Umkhandlu: Funder / Partner
- ITPMS: Client / Funding Entity
- Schools Portal: Donor / Partner

---

### Campaign

**Purpose:** The primary commercial and project tracking unit. Typed by purpose.

**Ownership:** Platform table — `campaigns`. Reusable across all applications.

**Types:**

| Type | Purpose | Complexity | Project tracking |
|---|---|---|---|
| `ad` | Sponsor placement, banner advertising | Low | None |
| `activation` | Community events, activations | Medium | None |
| `csr` | Infrastructure projects, community development | High | Full |

**Lifecycle:**
```
draft → approved → active → completed → reported
```

`reported` is the terminal state. It means a Layer 5 export has been generated.
`completed` means all deliverables are certified and impact is recorded.
`active` means work is in progress.

**Relationships:**
- Campaign → Sponsor (optional)
- Campaign → Progress entries (append-only)
- Campaign → Certified deliverables (JSONB — current; separate table — future)
- Campaign → Project updates (separate table — Phase 18)
- Campaign → Participation log (JSONB — current)
- Campaign → Evidence (via `evidence` platform table — Phase 18)
- Campaign → TCRS conflict logs (via `conflict_logs` platform table — Phase 18)

**Immutable fields:** `created_at`, `created_by`, `campaign_type`

**Append-only fields:** `progress_log`, `deliverables_certified` entries

**Required fields (all types):** `title`, `content`, `category`, `campaign_type`, `status`

**Required fields (csr type only):** `project_health`, `project_phase`, `funding_source`

**Optional fields (csr type):** `project_reference`, `contractor`, `contract_number`,
`consulting_engineer`, `beneficiaries`, `impact_summary`, `lessons_learned`,
`total_deliverables`

**Missing from current implementation (Phase 18 additions):**
- `contract_number` — tender/contract reference
- `consulting_engineer` — engineering or consulting firm
- `total_deliverables` — planned deliverable count
- `reported` status — terminal state after Layer 5 export

---

### Project

**Purpose:** The CSR campaign in its project tracking mode. Not a separate entity — it is
the `csr` campaign type with its full tracking capability activated.

**Ownership:** Expressed through `campaign_type = 'csr'` on the `campaigns` table.

**The distinction that matters:**
- `content` — the permanent project overview. Written once. Never overwritten.
- `progress_log` — the append-only technical log. Grows over time.
- `project_updates` — the event log. Major milestones. Separate table (Phase 18).

These three fields serve different purposes and must never be conflated.

---

### Deliverable

**Purpose:** The unit of certified completion. A deliverable is a discrete, verifiable
piece of work that can be independently certified.

**Ownership:** JSONB array on `campaigns.deliverables_certified` (current).
Separate `deliverables` table (future — when querying, filtering, or joining is required).

**Lifecycle:**
```
pending → certified
       → disputed
```

A deliverable cannot be marked `certified` unless:
- `percentage_complete === 100`
- `certified_by` is set
- `certification_date` is set

A disputed deliverable is preserved. A new deliverable entry resolves the dispute.
The disputed entry is never deleted.

**Fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | ✅ | Generated on creation |
| `task` | string | ✅ | What was to be done |
| `status` | enum | ✅ | `pending` / `certified` / `disputed` |
| `certified_by` | string | On certification | Who verified |
| `percentage_complete` | 0–100 | On certification | Engineer-verified |
| `weightage` | 0–100 | — | Relative weight in project scope |
| `certification_date` | date | On certification | |
| `notes` | text | — | Evidence reference |

---

### Progress Entry

**Purpose:** A timestamped technical record of project progress. Engineer or PMU verified.
The append-only technical memory of the project.

**Ownership:** JSONB array on `campaigns.progress_log` (current).
Richer model with separate table (Phase 18 — when evidence attachments are required).

**Immutability rule:** Entries are never edited or deleted. If an entry was incorrect,
a new entry records the correction. The original remains.

**Current fields (Phase 17):**
| Field | Type | Required |
|---|---|---|
| `date` | ISO date | ✅ |
| `update` | text | ✅ |
| `added_by` | user ID | ✅ |

**Future fields (Phase 18 — richer model):**
| Field | Type | Notes |
|---|---|---|
| `narrative` | rich text | Detailed technical description |
| `percentage_complete` | 0–100 | Engineer-verified at this point in time |
| `status` | enum | `on-track` / `delayed` / `at-risk` / `completed` |
| `evidence_refs` | string[] | References to attached evidence |
| `weather_context` | WeatherSnapshot | Auto-captured at time of entry |
| `certified` | boolean | Whether this entry has been formally verified |
| `certified_by` | string | Verifying authority |

---

### Project Update

**Purpose:** The event log for major project milestones. Sod turning ceremonies.
Commissioning events. Handover ceremonies. Community announcements.

**Ownership:** Separate table — `project_updates` with `campaign_id` FK.
**Not JSONB** — entries are too large (rich content, gallery, video).

**Status:** Not yet implemented. Phase 18 addition.

**Fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | UUID | ✅ | |
| `campaign_id` | UUID FK | ✅ | |
| `date` | date | ✅ | |
| `title` | string | ✅ | e.g. "Sod Turning Ceremony" |
| `content` | text | ✅ | Media statement / narrative |
| `gallery` | text[] | — | Storage URLs |
| `video_url` | text | — | |
| `created_by` | text | ✅ | Admin user ID |
| `created_at` | TIMESTAMPTZ | ✅ | |

**Immutability:** Project updates are immutable once created. They are governance events.

---

### Evidence (on Campaign)

**Purpose:** Formal attachments that prove project events occurred. IPC certificates,
site photographs, signed petitions, meeting minutes, engineer reports.

**Ownership:** Platform table — `evidence` with `campaign_id` FK (Phase 18).
Currently: media attachments via `campaigns.media_urls` (Phase 17 — limited).

**Immutability rule:** Evidence rows are never deleted. The evidence set only grows.

**Relationship to platform evidence:** The `evidence` platform table (Phase 18) serves
both records and campaigns. The `campaign_id` FK is added alongside `record_id` and
`notice_id` — the table is not duplicated.

---

### Certification

**Purpose:** The formal act of verifying that a deliverable is complete to the required
standard. Certification requires an authority, a percentage, and a date.

**Ownership:** Expressed as a state transition on a `CertifiedDeliverable` object.
Not a separate table in the current model.

**The certification authority is domain-specific:**
- Moments: Admin user
- Umkhandlu: Engineer, PMU, Municipal officer
- ITPMS: Project manager, client representative
- Schools Portal: Programme coordinator, donor representative

The platform provides the certification model. The application defines who can certify.

---

### Impact

**Purpose:** The measurable outcome of a completed project. Beneficiary count, impact
summary, and lessons learned. Written at project closure. Permanent institutional memory.

**Ownership:** Fields on `campaigns` table — `beneficiaries`, `impact_summary`,
`lessons_learned`.

**Immutability rule:** `lessons_learned` is written once at closure and never overwritten.
It is the project's permanent contribution to institutional memory.
`impact_summary` may be updated while the project is active. It is locked at `completed`.

---

### Reporting (Layer 5)

**Purpose:** A generated export of the complete commercial record — progress, deliverables,
evidence, participation, impact. Never manually assembled.

**Ownership:** Generated on demand by an Edge Function. Not stored as a primary record.

**Integrity:** Each report exposes the source campaign's `updated_at` timestamp and a
content hash. Recipients can verify the report against the live record.

**Status:** Not yet implemented. Phase 18+ addition.

---

## 5. Platform vs Domain

This table is the drift prevention reference. Before placing any commercial concept in
`packages/`, ask: is it in the Platform column?

| Concept | Platform | Domain | Notes |
|---|---|---|---|
| Campaign structure | ✅ | — | `campaigns` table is platform-owned |
| Sponsor structure | ✅ | — | `sponsors` table is platform-owned |
| Campaign type enum | ✅ | — | `ad / activation / csr` — platform-generic |
| RAG status enum | ✅ | — | `green / amber / red` — platform-generic |
| Project phase enum | ✅ | — | `planning / procurement / construction / commissioning / operational` |
| Certified deliverable structure | ✅ | — | Shape is platform-generic |
| Progress log structure | ✅ | — | Append-only pattern is platform-generic |
| Project updates table | ✅ | — | Structure is platform-generic |
| Evidence attachments | ✅ | — | Uses platform `evidence` table |
| Participation log | ✅ | — | Uses platform `participation_log` table |
| TCRS conflict logs | ✅ | — | Uses platform `conflict_logs` table |
| Reporting / Layer 5 export | ✅ | — | Pattern is platform-generic |
| Funding source vocabulary | — | ✅ | EPWP/MIG/WSIG = Umkhandlu domain |
| Certification authority hierarchy | — | ✅ | Engineer/PMU/CLO = Umkhandlu domain |
| B-BBEE / CIPC compliance | — | ✅ | South African law — Umkhandlu domain |
| SMME directory | — | ✅ | SA procurement context — Umkhandlu domain |
| Contract number format | — | ✅ | Application-defined |
| Sponsor tier vocabulary | — | ✅ | bronze/silver/gold/platinum = Moments domain |
| Campaign category vocabulary | — | ✅ | Application-defined |

**The test:** Can this concept be described without referencing Moments, Umkhandlu,
or any specific application? If yes — it belongs in the platform.

---

## 6. Database Ownership

### Platform Tables (owned by platform, reusable across all applications)

| Table | Purpose | Status |
|---|---|---|
| `campaigns` | Primary commercial unit | ✅ Exists — Phase 17G extended |
| `sponsors` | Funding organisations | ✅ Exists |
| `budget_transactions` | Spend tracking per campaign | ✅ Exists |
| `project_updates` | Event log on campaigns | ⏳ Phase 18 — not yet created |
| `evidence` | Formal attachments (records + campaigns) | ⏳ Phase 18 — `campaign_id` FK to be added |
| `conflict_logs` | TCRS variance tracking | ⏳ Phase 18 — not yet created |
| `conflict_claims` | Individual source reports | ⏳ Phase 18 — not yet created |
| `participation_log` | Anonymised community feedback | ✅ Exists (Moments-scoped, Phase 18 extends) |

### Columns Missing from Current `campaigns` Table

These columns are in the abstraction pack but not yet in the schema or any migration.
They are Phase 18 additions — not Phase 17 gaps.

| Column | Type | Notes |
|---|---|---|
| `contract_number` | TEXT | Tender / contract reference |
| `consulting_engineer` | TEXT | Engineering or consulting firm |
| `total_deliverables` | INTEGER | Planned deliverable count |
| `reported` status | TEXT enum extension | Terminal state after Layer 5 export |

### Derived / Analytics (not primary records)

| Table | Purpose | Status |
|---|---|---|
| `analytics_events` | Raw event tracking | ✅ Exists |
| `budget_transactions` | Financial tracking | ✅ Exists |
| Campaign export | Layer 5 generated report | ⏳ Phase 18+ |

### Domain Tables (owned by application, never in `packages/`)

| Table | Application | Purpose |
|---|---|---|
| `smme_directory` | Umkhandlu | Local business registry per project |
| `funding_sources` | Umkhandlu | SA government programme registry |
| `statutory_mandates` | Umkhandlu | Legal framework references |

---

## 7. Evolution Path

### Phase 17 — Commercial Foundation (complete)

What was built:
- `campaign_type` column — `ad / activation / csr`
- `project_health` (RAG), `project_phase` columns
- `project_reference`, `funding_source`, `contractor`, `beneficiaries` columns
- `impact_summary`, `lessons_learned` columns
- `progress_log` JSONB — append-only `{date, update, added_by}`
- `deliverables_certified` JSONB — full certified deliverable shape
- `CertifiedDeliverable` and `ProgressLogEntry` interfaces in `packages/api`
- Campaign form — type selector, conditional CSR fields
- Campaign detail — project details card, progress log panel, deliverables panel

What was not built (intentionally deferred):
- `project_updates` table
- `contract_number`, `consulting_engineer`, `total_deliverables` columns
- `reported` campaign status
- Evidence attachments on campaigns (via platform `evidence` table)
- TCRS conflict logs
- Layer 5 campaign export

### Phase 18 — Commercial Extension (Umkhandlu)

What Phase 18 adds:
- `project_updates` table — migration `006_platform_records.sql` or `007_commercial_extension.sql`
- `contract_number`, `consulting_engineer`, `total_deliverables` on `campaigns`
- `reported` status on campaigns
- `campaign_id` FK on platform `evidence` table
- TCRS `conflict_logs` and `conflict_claims` tables
- Richer progress log model (narrative, percentage, weather context)
- `apps/umkhandlu` consumes all of the above

### Phase 18+ — Reporting Engine

What comes after Umkhandlu is validated:
- Layer 5 campaign export — generated JSON/PDF report
- Cross-campaign portfolio analytics
- Funding source aggregation
- Beneficiary trend analysis
- Project completion rate intelligence

### Phase 19+ — Commercial Intelligence

What the intelligence layer eventually surfaces:
- Cross-node project health (RAG distribution across nodes)
- Regional infrastructure completion rates
- Funding programme performance
- Contractor performance history
- Predictive project health based on progress patterns

---

## 8. Relationship to Other Domains

### Commercial ↔ Records

A completed CSR project produces a `project-outcome` record in the governance record chain.
The campaign is the commercial tracking unit. The record is the institutional memory unit.
They are related but not the same.

```
Campaign (csr, status: completed)
    │
    └── produces → Record (type: project-outcome, parentRecord → originating notice)
```

This relationship is implemented in Phase 18B (Governance Records).

### Commercial ↔ Evidence

Evidence attachments on campaigns use the same platform `evidence` table as records and notices.
The `evidence` table has `campaign_id`, `record_id`, and `notice_id` FKs — all nullable.
An evidence row belongs to exactly one parent (campaign, record, or notice).

### Commercial ↔ Participation

The campaign participation log is the anonymised record of community feedback on a project.
It is operator-maintained from webhook data — not a live submission form.
The live participation form (consent-gated, webhook-delivered) is a notice-level concept,
not a campaign-level concept.

### Commercial ↔ Intelligence

The intelligence layer consumes commercial data:
- Project health (RAG distribution) → `projectHealthSummary` analytics
- Beneficiary counts → impact aggregation
- Progress log → activity stream
- Certified deliverables → completion rate metrics

Commercial data feeds intelligence. Intelligence does not modify commercial records.

### Commercial ↔ Moments

Moments is the first implementation of the commercial domain.
Moments campaigns are `ad` and `activation` type — the lighter commercial model.
The `csr` type (full project tracking) is present in the schema but not yet used in Moments.

When Moments eventually uses `csr` campaigns, it will consume the same platform model
that Umkhandlu uses. No duplication. No separate implementation.

### Commercial ↔ Umkhandlu

Umkhandlu is the first application to use the full `csr` project tracking capability.
Umkhandlu adds domain-specific vocabulary (funding sources, contractor management,
B-BBEE compliance) on top of the platform commercial model.

The platform model does not change for Umkhandlu. Umkhandlu extends it in its own domain.

---

## 9. Design Principles

These rules apply to every implementation that touches the commercial domain.

1. **Never overwrite progress.** `progress_log` is append-only. No exceptions.

2. **Never edit certifications.** A certified deliverable's `certified_by`, `certification_date`,
   and `percentage_complete` are immutable once set. Disputes create new entries.

3. **Evidence is immutable.** Evidence rows are never deleted. The set only grows.

4. **Reporting is generated.** Campaign reports are derived from underlying records.
   No report field is manually typed. If the source changes, the report changes.

5. **Commercial data feeds intelligence.** Every commercial record is a potential
   intelligence input. Design with aggregation in mind.

6. **Domain extensions are additive.** New columns, new types, new relationships are
   always added alongside existing ones. Never replacing. Never restructuring.

7. **The `csr` type is the full model.** `ad` and `activation` types share the schema
   but use fewer fields. The schema is not split. The type controls which fields are active.

8. **Certification authority is domain-defined.** The platform provides the certification
   model. The application defines who can certify and what their authority level is.

9. **`lessons_learned` is permanent.** Written once at project closure. Never overwritten.
   It is the project's contribution to institutional memory.

10. **`content` is the permanent overview.** Written once. Never overwritten.
    `progress_log` and `project_updates` grow over time. `content` does not.

---

## 10. Deferred Concepts

These concepts are documented here so they are visible without forcing premature implementation.
None of these are built until a concrete product requirement in an active phase demands them.

| Concept | Deferred to | Notes |
|---|---|---|
| `project_updates` table | Phase 18 | Separate table — not JSONB. Rich content, gallery, video. |
| `contract_number`, `consulting_engineer` | Phase 18 | Campaign identity fields for Umkhandlu |
| `total_deliverables` | Phase 18 | Planned count for completion percentage calculation |
| `reported` campaign status | Phase 18 | Terminal state after Layer 5 export |
| Milestone engine | Phase 18+ | Named phases with their own deliverables |
| Richer progress model | Phase 18 | Narrative, percentage, weather context, evidence refs |
| TCRS conflict logs on campaigns | Phase 18 | Variance tracking when sources disagree |
| Layer 5 campaign export | Phase 18+ | Generated JSON/PDF report |
| Portfolio management | Phase 19+ | Cross-campaign analytics |
| Procurement workflows | Phase 19+ | Tender, award, contract management |
| Contractor performance history | Phase 19+ | Cross-project contractor tracking |
| Payment tracking | Phase 19+ | Milestone-linked payment schedules |
| Funding programme performance | Phase 19+ | Cross-project funding source analytics |
| Predictive project health | Phase 20+ | ML-based RAG prediction from progress patterns |

---

## Governing Decisions

| Decision | Reference |
|---|---|
| Commercial domain frozen | D-034 (to be recorded in `decisions.md`) |
| Platform tables are reusable across all applications | D-007, D-027 |
| Domain vocabulary stays in application domain | D-027 |
| `project_updates` is a separate table, not JSONB | This document — Section 4 |
| `lessons_learned` is permanent institutional memory | This document — Section 9 |
| Reporting is derived, never manually assembled | This document — Section 2 |
| Phase 17G implemented the commercial foundation | D-033 |
| Phase 18 extends the commercial model for Umkhandlu | Phase 18 roadmap |
