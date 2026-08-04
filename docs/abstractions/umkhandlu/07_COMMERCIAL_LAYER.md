# 07 — Commercial Layer

> Umkhandlu Abstraction Pack · Unami Platform Core
> Source: `ABSTRACTION_COMMERCIAL.md`

---

## What the Commercial Layer Is

The commercial layer covers funded projects, partner organisations, and economic activity. In Umkhandlu, this is the `campaign` and `sponsor` document types. The campaign is the primary commercial and project tracking unit.

The commercial layer is not Umkhandlu-specific. Every application in the ecosystem has a commercial dimension:
- Moments: sponsor placements, community campaigns
- Umkhandlu: infrastructure projects, CSR initiatives, SMME development
- ITPMS: funded ICT projects, contractor management
- Schools Portal: funded programmes, donor partnerships
- BeatsChain: sponsored content, label partnerships

The structure is platform-generic. The vocabulary is domain-specific.

---

## Campaign — Three Types

The campaign document serves three distinct purposes under one schema, controlled by `campaignType`.

| Type | Value | Purpose | Complexity |
|---|---|---|---|
| Sponsorship | `ad` | Banner advertising, sponsor placement | Low |
| Activation | `activation` | Community activations, events | Medium |
| Initiative / CSR | `csr` | Infrastructure projects, community development | High |

The `csr` type carries the full project tracking capability. The `ad` and `activation` types are lighter — they share the same schema but use fewer fields.

---

## Campaign Structure — Platform-Generic Fields

### Identity
| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | |
| `slug` | slug | ✅ | |
| `campaignType` | enum | ✅ | `ad` / `activation` / `csr` |
| `status` | enum | ✅ | `draft` / `approved` / `active` / `completed` / `reported` |
| `startDate` | date | ✅ | |
| `endDate` | date | — | |
| `sponsor` | reference → sponsor | ✅ | |
| `contactPerson` | reference → person | — | Campaign manager |

### Project Identity (CSR / Initiative type)
| Field | Type | Notes |
|---|---|---|
| `projectReference` | string | Format: PRJ-YYYY-XXXX |
| `projectHealth` | enum | `green` / `amber` / `red` (RAG status) |
| `projectPhase` | enum | `planning` / `procurement` / `construction` / `commissioning` / `operational` |
| `fundingSource` | string | The programme or entity funding the project |
| `contractor` | string | Main contractor |
| `contractNumber` | string | Tender / contract reference |
| `consultingEngineer` | string | Engineering or consulting firm |

### Content
| Field | Type | Notes |
|---|---|---|
| `description` | text | Max 300 chars |
| `content` | rich text | Permanent project overview. Written once. Never overwritten. |
| `targetAudience` | string | Who this campaign serves |
| `tags` | string[] | Freeform categorisation |

### Tracking and Impact
| Field | Type | Notes |
|---|---|---|
| `budget` | number | Currency amount |
| `beneficiaries` | number | Community members impacted |
| `impactSummary` | text | For reports and sponsor feedback |
| `lessonsLearned` | text | At project closure. Permanent institutional memory. |
| `deliverables` | string[] | Completed deliverables list |
| `deliverablesCertified[]` | object array | See certified deliverable structure |
| `totalDeliverables` | number | Total planned deliverables |

---

## Certified Deliverable

The certified deliverable is the most important concept in the commercial layer. It is the unit of verified completion.

```
Deliverable
    │
    ├── task: string (what was to be done)
    ├── status: pending / certified / disputed
    ├── certifiedBy: string (who verified)
    ├── percentageComplete: 0–100 (engineer-verified)
    ├── weightage: 0–100 (relative weight in project scope)
    ├── certificationDate: date
    └── notes: text (evidence reference)
```

**Validation rule:** Cannot mark `certified` unless `percentageComplete === 100` and `certifiedBy` is set.

This is the platform-generic certification model. The specific certifying authority (engineer, PMU, inspector) is domain-specific.

---

## Progress Log

Timestamped technical progress entries. Engineer/PMU verified.

```
progressLog[]
    date: date (required)
    update: text (required)
```

The progress log is append-only. Entries are never edited or deleted. The log is the project's technical memory.

---

## Project Updates (Event Log)

Each major project event gets its own entry. Never overwrites the permanent project overview.

```
projectUpdates[]
    date: date (required)
    title: string (required)  — e.g. "Sod Turning Ceremony"
    content: rich text        — media statement
    gallery[]: image array
    videoUrl: url
```

The distinction between `content` (permanent overview) and `projectUpdates` (event log) is critical. The overview is written once and never changed. The event log grows over time.

---

## Community Notices (on Campaign)

Timestamped notices to the community about jobs, opportunities, and project updates. Rendered as prominent banners on the public page.

```
communityNote[]
    date: date (required)
    issuedBy: string (required)  — e.g. "Khathide Traditional Council"
    message: text (required)
```

This is the commercial layer's connection to the community communication layer. A project can issue notices directly from its campaign record.

---

## Participation Log (on Campaign)

See `04_PUBLIC_PARTICIPATION.md`. The `participationLog[]` field on campaigns is the anonymised record of community feedback received on the project.

---

## Sponsor Structure

| Field | Type | Notes |
|---|---|---|
| `name` | string | Required |
| `slug` | slug | Required |
| `sponsorType` | enum | `ngo` / `business` / `government` / `community` / `individual` |
| `logo` | image | PNG with transparent background |
| `website` | url | |
| `description` | text | Max 300 chars |
| `contactEmail` | string | |
| `contactPhone` | string | |

The sponsor is a platform-generic concept. Every application that has commercial partnerships has sponsors.

---

## Campaign Lifecycle

```
Draft
    │
    ▼
Approved (authority sign-off)
    │
    ▼
Active
    │
    ├── Progress log entries added
    ├── Deliverables certified
    ├── Project updates published
    ├── Community notices issued
    ├── Participation log updated
    ├── TCRS conflict logs (if variance)
    │
    ▼
Completed
    │
    ├── Impact summary written
    ├── Lessons learned recorded
    ├── All deliverables certified
    │
    ▼
Reported
    │
    └── Campaign export generated (Layer 5)
```

---

## Domain-Specific Fields (Umkhandlu Only)

These fields exist in the Umkhandlu schema but are not platform-generic. They stay in the Umkhandlu domain.

| Field | Why domain-specific |
|---|---|
| SMME directory | SA procurement / B-BBEE context |
| B-BBEE level | South African law |
| CIPC registration | South African company registration |
| Tax clearance status | South African tax compliance |
| EPWP / MIG / WSIG funding sources | South African government programmes |
| Stakeholder logos (info board) | SA infrastructure project reporting convention |

---

## Moments Mapping

| Commercial concept | Moments equivalent |
|---|---|
| Campaign (`ad` type) | Campaign (sponsor placement) |
| Campaign (`activation` type) | Campaign (community event) |
| Campaign (`csr` type) | — (not yet in Moments) |
| Sponsor | Sponsor |
| Certified deliverable | — (not yet in Moments) |
| Progress log | — (not yet in Moments) |
| Impact summary | — (not yet in Moments) |
| Beneficiary count | — (not yet in Moments) |

Moments has the commercial foundation (campaigns, sponsors). The project tracking layer (`csr` type) is a future evolution.

---

## Platform Implementation Notes

When implementing the commercial layer in Unami Platform Core:

1. `campaigns` and `sponsors` are already platform tables in the current Supabase schema.
2. The `campaign_type` column distinguishes `ad` / `activation` / `csr` — already present.
3. `deliverables_certified` is a JSONB array — the certified deliverable structure is platform-generic.
4. `progress_log` is a JSONB array — append-only, never edited.
5. `project_updates` is a separate table with `campaign_id` foreign key — not a JSONB array (too large).
6. `community_notes` on campaigns is a JSONB array — small, append-only.
7. The campaign export API is a platform capability — any application can expose it.
8. RAG status (`project_health`) is a platform-generic enum: `green` / `amber` / `red`.
9. Project phases (`planning` / `procurement` / `construction` / `commissioning` / `operational`) are platform-generic — applications may extend the vocabulary.
