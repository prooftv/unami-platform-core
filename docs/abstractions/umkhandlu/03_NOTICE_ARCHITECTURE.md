# 03 — Notice Architecture

> Umkhandlu Abstraction Pack · Unami Platform Core
> Source: `ABSTRACTION_NOTICES.md`

---

## What a Notice Is

A notice is a public communication that initiates a governance process. It is the origin point of a record lineage chain. A notice does not stand alone — it produces records, follow-up notices, and evidence.

The notice is Layer 1. Everything else in the governance chain flows from it.

---

## Two Notice Categories

The Umkhandlu schema contains two structurally distinct notice types. This distinction is platform-generic.

### Category 1 — Community Notice
Internal governance communication. Announces meetings, resolutions, alerts, opportunities. Produces governance records (minutes, resolutions). The origin point of the record lineage chain.

**Key properties:**
- Pinnable (appears first in lists)
- Produces records via `originNotice` reference
- Can reference a follow-up notice via `originNotice` (chain of notices)
- Has event context: location, attendance, weather

### Category 2 — Statutory Notice
External statutory communication. Invites public comment on a proposed action. Governed by legislation. Produces a proof of publication certificate. Captures public comments via structured form (webhook-delivered, never stored).

**Key properties:**
- Has a legal mandate (governing legislation)
- Has a comment deadline (time-bounded participation window)
- Has a fee and fee status (commercial layer)
- Has a proof of publication flag
- Has a geographic pin (geopoint)
- Captures public comments — never stores them

---

## Notice Structure — Platform-Generic Fields

### Community Notice

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | Max 120 chars |
| `slug` | slug | ✅ | URL-safe identifier |
| `noticeType` | enum | ✅ | Type vocabulary — domain-specific |
| `date` | datetime | ✅ | When the event occurs |
| `excerpt` | text | — | Max 300 chars. Shown in lists |
| `pinned` | boolean | — | Pinned notices appear first |
| `content` | rich text | — | Full notice body |
| `image` | image | — | Cover image |
| `originNotice` | reference → notice | — | If this is a follow-up |
| `relatedCampaign` | reference → campaign | — | Infrastructure project link |
| `relatedArea` | reference → area | — | Geographic jurisdiction |
| `location` | string | — | Venue / meeting place |
| `attendance` | number | — | Expected / actual attendance |
| `weatherContext` | object | — | Auto-captured environmental snapshot |

### Statutory Notice

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | |
| `slug` | slug | ✅ | |
| `noticeType` | enum | ✅ | Statutory type vocabulary |
| `status` | enum | ✅ | `open` / `closed` / `approved` / `rejected` / `withdrawn` |
| `legalMandate` | string | — | Governing legislation |
| `retentionPeriod` | string | — | Minimum publication duration |
| `applicant` | string | ✅ | Company or person proposing action |
| `referenceNumber` | string | — | Authority reference |
| `fee` | number | — | Publication fee |
| `feeStatus` | enum | — | `free` / `invoiced` / `paid` |
| `proofIssued` | boolean | — | Proof of publication certificate issued |
| `description` | text | ✅ | Max 500 chars |
| `content` | rich text | — | Full notice content |
| `documents[]` | file array | — | Supporting documents |
| `commentDeadline` | date | ✅ | Last date for public comments |
| `commentContact` | text | ✅ | Where to submit comments |
| `publishDate` | date | — | When published |
| `commentsReceived` | number | — | Counter — updated manually |
| `location` | string | ✅ | Site location / address |
| `geopoint` | geopoint | — | Map pin |
| `relatedArea` | reference → area | — | Affected area |
| `relatedCampaign` | reference → campaign | — | Related project |

---

## Notice Lifecycle

### Community Notice
```
Draft
  │
  ▼
Published ──────────────────────────────────────────────────────────┐
  │                                                                  │
  ├── produces records (minutes, resolutions, etc.)                 │
  │     via record.originNotice reference                           │
  │                                                                  │
  └── produces follow-up notices                                    │
        via notice.originNotice reference                           │
  │                                                                  │
  ▼                                                                  │
Archived ◄──────────────────────────────────────────────────────────┘
```

### Statutory Notice
```
Draft
  │
  ▼
Open for Comment
  │
  ├── public comment form active
  ├── comments delivered via webhook
  ├── commentsReceived counter updated manually
  │
  ▼
Comment Period Closed
  │
  ├── proof of publication certificate generated
  │
  ▼
Approved / Rejected / Withdrawn
```

---

## Notice Type Vocabulary

### Community Notice Types (Umkhandlu)
| Value | Label | Produces |
|---|---|---|
| `meeting` | Meeting | Minutes, resolutions |
| `announcement` | Announcement | — (informational) |
| `resolution` | Resolution | Resolution record |
| `alert` | Alert | — (urgent communication) |
| `opportunity` | Opportunity | — (jobs, bursaries, training) |
| `employment` | Employment | — |
| `smme` | SMME / Procurement | — |
| `project-update` | Project Update | — |

### Statutory Notice Types (Umkhandlu)
| Value | Governing Act |
|---|---|
| `eia` | NEMA |
| `rezoning` | SPLUMA |
| `land-use` | SPLUMA |
| `township` | SPLUMA |
| `building` | National Building Regulations |
| `mining` | MPRDA |
| `liquor` | KZN Liquor Licensing Act |
| `telecom` | ICASA / ECA |
| `estate` | Administration of Estates Act |
| `liquidation` | Insolvency Act No. 24 of 1936 |
| `pto` | KZN Ingonyama Trust Act |
| `other` | — |

The type vocabulary is domain-specific. The structure is platform-generic.

---

## Moments Adaptation

Community notices map directly to Moments. The structural equivalence is strong.

| Notice concept | Moments equivalent |
|---|---|
| Community Notice | Moment |
| `meeting` type | Community Moment |
| `alert` type | Urgent Moment (urgency_level = critical) |
| `announcement` type | Standard Moment |
| `opportunity` type | Opportunity Moment |
| `project-update` type | Infrastructure Update Moment |
| Statutory Notice | — (not yet in Moments) |
| Comment deadline | — (not yet in Moments) |
| Proof of publication | — (not yet in Moments) |

The gap between Moments and statutory notices is intentional. Moments is a community communication platform. Statutory participation is a future evolution.

---

## Platform Implementation Notes

When implementing notices in Unami Platform Core:

1. The `notices` table is a platform table — not a Moments table, not an Umkhandlu table.
2. `notice_type` is a string — the vocabulary is application-defined.
3. `notice_category` distinguishes community notices from statutory notices at the schema level.
4. `origin_notice_id` is a self-referential foreign key — the follow-up chain.
5. `comment_deadline` and `proof_issued` are statutory-only fields — nullable for community notices.
6. `geopoint` is a platform-generic concept — stored as `lat/lng` columns or a PostGIS point.
7. `weather_context` is a JSONB column — same `WeatherSnapshot` type as records.
8. The `commentsReceived` counter is a denormalised count — updated by the participation engine, not by direct form submission.
