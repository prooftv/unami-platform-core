# ABSTRACTION_COMMERCIAL.md

> Extracted from Umkhandlu source. No simulation. No inference beyond what the code contains.

---

## What the Commercial Layer Is

The commercial layer covers two things:

1. **Campaigns** — the primary commercial and project tracking document type
2. **Sponsors** — the organisations that fund or partner on campaigns

Source: `src/studio/schema/documents/campaign.ts`, `src/studio/schema/documents/sponsor.ts`, `src/app/api/campaigns/export/route.ts`

---

## Campaign — Three Types

The `campaign` document serves three distinct purposes under one schema, controlled by `campaignType`:

| Type | Value | Purpose |
|---|---|---|
| Sponsorship | `ad` | Banner advertising, sponsor placement |
| Activation | `activation` | Community activations, events |
| Initiative / CSR | `csr` | Infrastructure projects, community development |

The `csr` type is the most complex. It carries the full project tracking capability: deliverables, progress, verification, SMME directory, participation log, community notices, stakeholder logos.

---

## Campaign Schema — Core Fields

Source: `src/studio/schema/documents/campaign.ts`

### Identity
| Field | Type | Notes |
|---|---|---|
| `title` | string | Required |
| `slug` | slug | Required |
| `campaignType` | enum | `ad` / `activation` / `csr` |
| `status` | enum | `draft` / `approved` / `active` / `completed` / `reported` |
| `startDate` | date | Required |
| `endDate` | date | Optional |
| `sponsor` | reference → sponsor | Required |
| `contactPerson` | reference → person | Campaign manager |

### Project Identity (CSR only)
| Field | Type | Notes |
|---|---|---|
| `projectReference` | string | Format: PRJ-YYYY-XXXX |
| `projectHealth` | enum | `green` / `amber` / `red` (RAG status) |
| `projectPhase` | enum | `planning` / `procurement` / `construction` / `commissioning` / `operational` |
| `fundingSource` | string | e.g. WSIG, MIG, RBIG, EPWP |
| `contractor` | string | Main contractor |
| `contractNumber` | string | Tender number |
| `consultingEngineer` | string | Engineering firm |

### Content
| Field | Type | Notes |
|---|---|---|
| `description` | text | 300 char max |
| `content` | blockContent | Permanent project overview. Written once. |
| `targetAudience` | string | e.g. Youth 18-35, Women, Farmers |
| `tags` | string[] | Freeform categorisation |

### Tracking & Impact
| Field | Type | Notes |
|---|---|---|
| `budget` | number | ZAR |
| `beneficiaries` | number | Community members impacted |
| `impactSummary` | text | For CSR reports and sponsor feedback |
| `lessonsLearned` | text | At project closure. Permanent institutional memory |
| `deliverables` | string[] | Completed deliverables list |
| `deliverablesCertified[]` | object array | See below |
| `totalDeliverables` | number | Total planned deliverables |

### Certified Deliverable Object
| Field | Type | Notes |
|---|---|---|
| `task` | string | Required |
| `status` | enum | `pending` / `certified` / `disputed` |
| `certifiedBy` | string | Person or entity that verified |
| `percentageComplete` | number | 0–100. Engineer-verified |
| `weightage` | number | 0–100. Relative weight in project scope |
| `certificationDate` | date | Required if status is `certified` |
| `notes` | text | Evidence reference |

Validation rule: cannot mark `certified` unless `percentageComplete === 100` and `certifiedBy` is set.

### Progress Log (CSR only)
```
progressLog[]
  date: date (required)
  update: text (required)
```
Timestamped technical progress entries. Engineer/PMU verified.

### Project Updates — Media & Events (CSR only)
```
projectUpdates[]
  date: date (required)
  title: string (required)  — e.g. "Sod Turning Ceremony"
  content: blockContent     — media statement
  gallery[]: image array
  videoUrl: url
```
Each major project event gets its own entry. Never overwrites the permanent project overview.

### Community Notices (CSR only)
```
communityNote[]
  date: date (required)
  issuedBy: string (required)  — e.g. "Khathide Traditional Council"
  message: text (required)
```
Timestamped notices to the community about jobs, SMME opportunities, project updates. Rendered as amber banners on the public page.

### SMME Directory (CSR only)
```
smmeDirectory[]
  name: string (required)
  service: string           — e.g. Earthworks, Plumbing
  owner: string
  cipcNumber: string        — CIPC registration
  taxClearance: enum        — valid / expired / none
  bbbeeLevel: enum          — 1-4 / eme / qse / none
  ward: string
  contactPhone: string
  verified: boolean         — Council confirms business operates in area
  complianceStatus: enum    — compliant / partial / non-compliant / pending
  logo: image
```

### Participation Log (CSR only)
See `ABSTRACTION_PUBLIC_PARTICIPATION.md` — `participationLog[]` field.

### Relationships
| Field | Type | Notes |
|---|---|---|
| `relatedListings[]` | reference[] → listing | Infrastructure this project serves |
| `relatedAreas[]` | reference[] → listing (area) | Target areas/villages |
| `relatedProgram` | reference → program | Related program |

### Media
| Field | Type | Notes |
|---|---|---|
| `image` | image | Cover image |
| `hideCoverImage` | boolean | Hide on detail page (for tall poster images) |
| `bannerImage` | image | For `ad` type — banner creative |
| `gallery[]` | image array | Activation / CSR photos |
| `videoUrl` | url | YouTube embed URL |
| `audioFile` | file | MP3, WAV |
| `documents[]` | file array | PDFs, proposals, reports |
| `stakeholderLogos[]` | image array | Municipality, funder, contractor logos for info board |

### SEO
| Field | Type | Notes |
|---|---|---|
| `seo` | seoMetaFields | Full SEO metadata |

---

## Campaign Export API

Source: `src/app/api/campaigns/export/route.ts`

```
GET /api/campaigns/export?token=<READ_TOKEN>
GET /api/campaigns/export?token=<READ_TOKEN>&status=active
GET /api/campaigns/export?token=<READ_TOKEN>&type=csr
```

Returns JSON. Includes: deliverables, certified progress, sponsor/contact info, area/program references, related notice/opportunity counts.

Auth: query param token matched against `SANITY_API_READ_TOKEN`.

---

## Sponsor Schema

Source: `src/studio/schema/documents/sponsor.ts`

| Field | Type | Notes |
|---|---|---|
| `name` | string | Required |
| `slug` | slug | Required |
| `sponsorType` | enum | `ngo` / `business` / `government` / `community` / `individual` |
| `logo` | image | PNG with transparent background |
| `website` | url | |
| `description` | text | 300 char max |
| `contactEmail` | string | |
| `contactPhone` | string | |

---

## Domain-Specific vs Platform-Generic

| Concept | Domain-specific | Platform-generic |
|---|---|---|
| Campaign as project tracking unit | ❌ | ✅ |
| Certified deliverables with authority | ❌ | ✅ |
| RAG project health status | ❌ | ✅ |
| Progress log (timestamped) | ❌ | ✅ |
| Project updates as event log | ❌ | ✅ |
| Sponsor / partner organisation | ❌ | ✅ |
| Campaign export API | ❌ | ✅ |
| Impact tracking (beneficiaries, summary) | ❌ | ✅ |
| Lessons learned at closure | ❌ | ✅ |
| SMME directory | ✅ SA procurement / B-BBEE context | ❌ |
| B-BBEE level tracking | ✅ SA law | ❌ |
| CIPC registration | ✅ SA company registration | ❌ |
| EPWP / MIG / WSIG funding sources | ✅ SA government programmes | ❌ |
| `csr` type = infrastructure project | ✅ SA CSR / community development | ❌ (structure is generic) |
| Community notices (amber banners) | ✅ Traditional council communication | ❌ (pattern is generic) |
| Stakeholder logos (info board) | ✅ SA infrastructure project reporting | ❌ (pattern is generic) |

**Platform abstraction:** A campaign is a typed project with a lifecycle, certified deliverables, a progress log, an event log, a participation log, and a sponsor. The certification model (authority-verified progress) is platform-generic. The specific compliance fields (B-BBEE, CIPC, EPWP) are SA-specific and stay in the Umkhandlu domain.
