# ABSTRACTION_RECORDS.md

> Extracted from Umkhandlu source. No simulation. No inference beyond what the code contains.

---

## What a Record Is

A record is a unit of institutional memory. It is not a document. It is not a file. It is a node in a governance network with a role, a position in a chain, and relationships to what came before and what comes after.

Source: `src/studio/schema/documents/record.ts`, `RECORDS.md`

---

## The Six Record Roles

Extracted from `RECORDS.md`. These are not schema types — they are semantic roles that multiple schema types can fulfil.

| Role | Description | Schema types that fulfil it |
|---|---|---|
| Origin Record | Where something begins. Root of a lineage chain. | `minutes`, `report` |
| Decision Record | What the institution decided. By whom. On what basis. | `resolution`, `community-decision`, `land-allocation`, `dispute-resolution` |
| Evidence Record | Proves something happened. Supports other records. | `evidence[]` attachments, or standalone record |
| Matter Record | An ongoing concern with a life. Accumulates records over time. | `infrastructure-concern` |
| Reference Record | Provides institutional context. Does not create action. | `policy`, `agenda`, `public-notice`, `external-resource` |
| Status Record | Change over time is the value. History is the memory. | `project-outcome`, status fields on any record |

---

## Record Schema — Extracted Fields

Source: `src/studio/schema/documents/record.ts`

### Identity
| Field | Type | Notes |
|---|---|---|
| `title` | string | Required |
| `slug` | slug | Auto-generated from title |
| `recordType` | enum | See types below |
| `date` | date | Required |
| `summary` | text | 300 char max |
| `status` | enum | `adopted` / `approved` / `pending` / `open` / `rejected` / `resolved` |

### Governance Authority
| Field | Type | Notes |
|---|---|---|
| `approvedBy` | reference → person | The authority who approved. Shown on land-allocation, dispute-resolution, community-decision, resolution types only |
| `verificationNote` | text | How this record was verified |

### Content
| Field | Type | Notes |
|---|---|---|
| `content` | blockContent | Rich text body |
| `evidence[]` | file array | PDF, DOC, images — petitions, registers, photos |
| `externalUrl` | url | External resource link (external-resource type only) |
| `source` | string | Source organisation (external-resource type only) |

### Lineage (the network)
| Field | Type | Notes |
|---|---|---|
| `originNotice` | reference → notice | The notice that produced this record |
| `parentRecord` | reference → record | The record this was produced from |

### Context
| Field | Type | Notes |
|---|---|---|
| `location` | string | Venue / physical location of event |
| `attendance` | number | Number of people present |
| `weatherContext` | object | Auto-captured environmental snapshot. Read-only. See ABSTRACTION_EVIDENCE.md |
| `relatedArea` | reference → listing (area) | Geographic jurisdiction |
| `relatedCampaign` | reference → campaign | Infrastructure project link |

---

## Record Types (Enum)

Source: `src/studio/schema/documents/record.ts`

| Value | Label | Semantic Role |
|---|---|---|
| `minutes` | Meeting Minutes | Origin Record |
| `resolution` | Resolution | Decision Record |
| `community-decision` | Community Decision | Decision Record |
| `land-allocation` | Land Allocation | Decision Record |
| `dispute-resolution` | Dispute Resolution | Decision Record |
| `report` | Report | Origin / Reference / Status |
| `infrastructure-concern` | Infrastructure Concern | Matter Record |
| `project-outcome` | Project Outcome | Status / Evidence |
| `policy` | Policy | Reference Record |
| `agenda` | Agenda | Reference Record |
| `public-notice` | Public Notice | Reference Record |
| `external-resource` | External Resource | Reference Record |

---

## The Record Network

Records are not isolated documents. They form a directed graph.

```
record
  ├── originNotice      → notice (the event that produced this record)
  ├── parentRecord      → record (the record this was produced from)
  ├── [childRecords]    → records that reference this record as parentRecord (reverse lookup)
  ├── evidence[]        → file attachments
  ├── relatedArea       → listing (geographic jurisdiction)
  ├── relatedCampaign   → campaign (infrastructure project)
  └── approvedBy        → person (governance authority)
```

The reverse lookup (`childRecords`) is not a stored field — it is a GROQ query that finds all records where `parentRecord._ref == this._id`.

---

## Domain-Specific vs Platform-Generic

| Concept | Domain-specific | Platform-generic |
|---|---|---|
| Record as institutional memory node | ❌ | ✅ |
| Record lineage (parent/child chain) | ❌ | ✅ |
| Evidence attachments on records | ❌ | ✅ |
| Record status lifecycle | ❌ | ✅ |
| Approved by authority | ❌ | ✅ |
| Weather context on records | ❌ | ✅ |
| `land-allocation` type | ✅ Traditional authority domain | ❌ |
| `dispute-resolution` type | ✅ Traditional authority domain | ❌ |
| `approvedBy` = Inkosi | ✅ Traditional authority domain | ❌ |
| `relatedArea` = isigodi | ✅ Traditional authority domain | ❌ |

**Platform abstraction:** A `record` is a typed, dated, authored institutional event with a status lifecycle, evidence attachments, and a position in a lineage chain. The type vocabulary is domain-specific. The structure is platform-generic.

---

## What This Is Not

- Not a CMS post. Records are not content.
- Not a file. A record may have file attachments. The record is not the file.
- Not isolated. A record without lineage is incomplete institutional memory.
- Not a form submission. Records are governance outputs, not inputs.
