# 02 — Record Architecture

> Umkhandlu Abstraction Pack · Unami Platform Core
> Source: `ABSTRACTION_RECORDS.md`

---

## What a Record Is

A record is a unit of institutional memory. It is not a document. It is not a file. It is a node in a governance network with a role, a position in a chain, and relationships to what came before and what comes after.

A record answers four questions:
1. What happened?
2. Who decided?
3. What was the basis?
4. What came next?

Without all four answers, institutional memory is incomplete.

---

## The Six Record Roles

Records are not typed by their content alone. They are typed by their semantic role in the governance chain.

| Role | Description | When it appears |
|---|---|---|
| Origin Record | Where something begins. Root of a lineage chain. | Meeting minutes, initial reports |
| Decision Record | What the institution decided. By whom. On what basis. | Resolutions, community decisions, allocations, dispute outcomes |
| Evidence Record | Proves something happened. Supports other records. | Evidence attachments, standalone evidence records |
| Matter Record | An ongoing concern with a life. Accumulates records over time. | Infrastructure concerns, open issues |
| Reference Record | Provides institutional context. Does not create action. | Policies, agendas, public notices, external resources |
| Status Record | Change over time is the value. History is the memory. | Project outcomes, status updates |

A single record type can fulfil multiple roles depending on context. A `report` can be an Origin Record (the first report on a new matter) or a Status Record (a progress report on an existing matter).

---

## Record Structure — Platform-Generic Fields

These fields are platform-generic. Any application that implements records should support them.

### Identity
| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | Human-readable name |
| `slug` | slug | ✅ | URL-safe identifier, auto-generated |
| `recordType` | enum | ✅ | Semantic type — vocabulary is domain-specific |
| `date` | date | ✅ | When the event occurred |
| `summary` | text | — | Brief description, max 300 chars |
| `status` | enum | ✅ | Lifecycle state — see below |

### Governance Authority
| Field | Type | Notes |
|---|---|---|
| `approvedBy` | reference → person | The authority who approved. Required for decision records. |
| `verificationNote` | text | How this record was verified |

### Content
| Field | Type | Notes |
|---|---|---|
| `content` | rich text | Full record body |
| `evidence[]` | file array | Attachments — see Evidence Architecture |

### Lineage
| Field | Type | Notes |
|---|---|---|
| `originNotice` | reference → notice | The notice that produced this record |
| `parentRecord` | reference → record | The record this was produced from |

### Context
| Field | Type | Notes |
|---|---|---|
| `location` | string | Venue / physical location |
| `attendance` | number | People present |
| `weatherContext` | object | Environmental snapshot — see Evidence Architecture |
| `relatedArea` | reference → area | Geographic jurisdiction |
| `relatedCampaign` | reference → campaign | Infrastructure project link |

---

## Record Status Lifecycle

```
pending
    │
    ├──► adopted      (minutes, policies — formally accepted)
    ├──► approved     (decisions — authority sign-off)
    ├──► resolved     (disputes, concerns — matter closed)
    └──► rejected     (decisions — authority declined)
```

`open` is a valid status for Matter Records — concerns that are ongoing and have not yet reached a terminal state.

Status transitions are not enforced by the schema — they are enforced by governance process. The platform records the state. The institution decides the transition.

---

## The Record Network

Records are not isolated documents. They form a directed graph.

```
record
  ├── originNotice      → notice (the event that produced this record)
  ├── parentRecord      → record (the record this was produced from)
  ├── [childRecords]    → records that reference this as parentRecord (reverse query)
  ├── evidence[]        → file attachments
  ├── relatedArea       → geographic jurisdiction
  ├── relatedCampaign   → infrastructure project
  └── approvedBy        → governance authority
```

The reverse lookup (`childRecords`) is never a stored field. It is always a query:

```groq
*[_type == "record" && parentRecord._ref == $recordId]
```

This is intentional. Storing reverse references creates synchronisation problems. Querying them on demand is always consistent.

---

## Lineage Chain

The lineage chain is the most important structural property of the record architecture.

```
Notice (origin event)
    │
    └── Record A (originNotice → Notice)
            │
            └── Record B (parentRecord → Record A)
                    │
                    └── Record C (parentRecord → Record B)
                                │
                                └── Record D (parentRecord → Record C)
```

Properties of the chain:
- **Directed** — always flows forward in time
- **Immutable** — once a record references a parent, that reference never changes
- **Traceable** — any record can be traced back to its origin notice
- **Extensible** — new records can always be added to the chain
- **Queryable** — the full chain can be reconstructed from stored references

A record without `originNotice` and without `parentRecord` is a root record. This is valid — it represents the beginning of a new lineage. Root records should be rare and intentional.

---

## Immutability

Records are not edited to reflect new reality. New records are created that reference the old ones.

This is the core immutability principle:

- A resolution is adopted. It is never edited.
- A new resolution supersedes it. The new resolution references the old one as `parentRecord`.
- The chain preserves both — the original decision and the superseding decision.

The only fields that may be updated after creation are:
- `status` — lifecycle transitions
- `weatherContext` — auto-patched once, then locked
- `evidence[]` — attachments may be added (never removed)

All other fields are write-once.

---

## Record Types — Vocabulary

The type vocabulary is domain-specific. The structure is platform-generic.

### Umkhandlu vocabulary
`minutes` · `resolution` · `community-decision` · `land-allocation` · `dispute-resolution` · `report` · `infrastructure-concern` · `project-outcome` · `policy` · `agenda` · `public-notice` · `external-resource`

### Platform-generic vocabulary (future applications)
Each application defines its own type vocabulary. The structure — identity, authority, content, lineage, context — is shared.

| Application | Example type vocabulary |
|---|---|
| Umkhandlu | minutes · resolution · land-allocation · dispute-resolution |
| ITPMS | project-record · milestone · change-request · risk-log |
| Schools Portal | board-minute · policy · incident-report · inspection-record |
| Moments | — (records not yet implemented) |

---

## What Records Are Not

- **Not a CMS post.** Records are governance outputs, not content.
- **Not a file.** A record may have file attachments. The record is not the file.
- **Not isolated.** A record without lineage is incomplete institutional memory.
- **Not a form submission.** Records are governance outputs, not inputs.
- **Not editable.** Records are write-once with status transitions. New records supersede old ones.

---

## Platform Implementation Notes

When implementing records in Unami Platform Core:

1. The `records` table is a platform table — not a Moments table, not an Umkhandlu table.
2. The `record_type` column is a string — the vocabulary is application-defined.
3. The `parent_record_id` and `origin_notice_id` columns are self-referential and notice-referential foreign keys.
4. The `status` column uses a platform-generic enum — applications may extend it.
5. Evidence attachments live in a separate `evidence` table with a `record_id` foreign key.
6. Weather context is a JSONB column — the `WeatherSnapshot` type is platform-generic.
7. The reverse lineage query is always a JOIN or subquery — never a stored array.
