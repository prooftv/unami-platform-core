# ABSTRACTION_NOTICES.md

> Extracted from Umkhandlu source. No simulation. No inference beyond what the code contains.

---

## What a Notice Is

A notice is a public communication that initiates a governance process. It is the origin point of a record lineage chain. A notice does not stand alone — it produces records, follow-up notices, and evidence.

Source: `src/studio/schema/documents/notice.ts`, `src/studio/schema/documents/developmentNotice.ts`

---

## Two Notice Types in the Schema

The Umkhandlu schema contains two distinct notice document types. They serve different purposes and have different field sets.

### 1. `notice` — Community Notice

Internal governance communication. Announces meetings, resolutions, alerts, opportunities. Produces governance records (minutes, resolutions). The origin point of the record lineage chain.

### 2. `developmentNotice` — Statutory / Public Participation Notice

External statutory communication. Invites public comment on proposed developments. Governed by legislation (SPLUMA, NEMA, Liquor Act, etc.). Produces a proof of publication certificate. Captures public comments via structured form (webhook-delivered, never stored in CMS).

---

## Notice Schema — `notice` document

Source: `src/studio/schema/documents/notice.ts`

### Identity
| Field | Type | Notes |
|---|---|---|
| `title` | string | Required. 120 char max |
| `slug` | slug | Required |
| `noticeType` | enum | See types below |
| `date` | datetime | When the event occurs |
| `excerpt` | text | 300 char max. Shown in lists |
| `pinned` | boolean | Pinned notices appear first |

### Content
| Field | Type | Notes |
|---|---|---|
| `content` | blockContent | Full rich text |
| `image` | image | Optional cover image |

### Lineage
| Field | Type | Notes |
|---|---|---|
| `originNotice` | reference → notice | If this is a follow-up, links to the original |
| `relatedCampaign` | reference → campaign | Links to infrastructure project |
| `relatedArea` | reference → listing (area) | Geographic jurisdiction |

### Event Context
| Field | Type | Notes |
|---|---|---|
| `location` | string | Venue / meeting place |
| `attendance` | number | Expected attendance (updated to actual after event) |
| `weatherContext` | object | Auto-captured forecast/historical snapshot. Read-only |

### Notice Types (Enum)
| Value | Label | Notes |
|---|---|---|
| `meeting` | Meeting | Produces minutes, resolutions |
| `announcement` | Announcement | Informational |
| `resolution` | Resolution | Formal governance output |
| `alert` | Alert | Urgent community communication |
| `opportunity` | Opportunity | Jobs, bursaries, training |
| `employment` | Employment | Employment-specific |
| `smme` | SMME / Procurement | Small business opportunities |
| `project-update` | Project Update | Infrastructure project status |

---

## Notice Schema — `developmentNotice` document

Source: `src/studio/schema/documents/developmentNotice.ts`

### Identity
| Field | Type | Notes |
|---|---|---|
| `title` | string | Required |
| `slug` | slug | Required |
| `noticeType` | enum | See statutory types below |
| `status` | enum | `open` / `closed` / `approved` / `rejected` / `withdrawn` |
| `legalMandate` | string | Governing legislation (e.g. SPLUMA, NEMA) |
| `retentionPeriod` | string | Minimum publication duration |

### Applicant / Commercial
| Field | Type | Notes |
|---|---|---|
| `applicant` | string | Required. Company or person proposing development |
| `referenceNumber` | string | Municipal / departmental reference |
| `fee` | number | Publication fee in ZAR |
| `feeStatus` | enum | `free` / `invoiced` / `paid` |
| `proofIssued` | boolean | Whether proof of publication certificate has been issued |

### Content
| Field | Type | Notes |
|---|---|---|
| `description` | text | Required. 500 char max |
| `content` | blockContent | Full notice content |
| `documents[]` | file array | EIA reports, site plans, application forms |
| `image` | image | Site plan / notice image |

### Participation
| Field | Type | Notes |
|---|---|---|
| `commentDeadline` | date | Required. Last date for public comments |
| `commentContact` | text | Required. Where to submit comments |
| `publishDate` | date | When published |
| `commentsReceived` | number | Counter. Updated manually from webhook data |

### Location
| Field | Type | Notes |
|---|---|---|
| `location` | string | Required. Site location / address |
| `geopoint` | geopoint | Map pin for the development site |
| `relatedArea` | reference → listing (area) | Affected area |
| `relatedCampaign` | reference → campaign | Related project |

### Statutory Notice Types (Enum)
| Value | Label | Governing Act |
|---|---|---|
| `eia` | Environmental Impact Assessment | NEMA |
| `rezoning` | Rezoning Application | SPLUMA |
| `land-use` | Land Use Change | SPLUMA |
| `township` | Township Establishment | SPLUMA |
| `building` | Building Plan Approval | National Building Regulations |
| `mining` | Mining / Excavation Permit | MPRDA |
| `liquor` | Liquor License | KZN Liquor Licensing Act |
| `telecom` | Cell Tower / Mast | ICASA / ECA |
| `estate` | Deceased Estate | Administration of Estates Act |
| `liquidation` | Liquidation / Insolvency | Insolvency Act No. 24 of 1936 |
| `pto` | PTO / Land Transfer | KZN Ingonyama Trust Act |
| `other` | Other | — |

---

## Notice Lifecycle

### Community Notice
```
Draft → Published → [produces records] → Archived
                 ↓
         Follow-up notice (originNotice reference)
```

### Development Notice
```
Draft → Open for Comment → Comment Period Closed → Approved / Rejected / Withdrawn
                        ↓
              Public comments captured via form
              → webhook delivery only
              → never stored in CMS (POPIA)
                        ↓
              Proof of Publication Certificate generated
```

---

## Public Participation (Development Notices)

Source: `src/components/modules/submitComment.ts`, `src/components/modules/PublicCommentForm.tsx`

Public comments on development notices are:
- Captured via a structured form (name, contact, relationship to site, comment type, comment text)
- Validated server-side with Valibot
- Delivered via webhook (`type: "public_comment"`) with `popiaConsent: true`
- **Never stored in the CMS**
- POPIA consent checkbox required before submission

The `commentsReceived` counter on the `developmentNotice` document is updated manually by the operator from webhook data. It is a count, not a store.

---

## Domain-Specific vs Platform-Generic

| Concept | Domain-specific | Platform-generic |
|---|---|---|
| Notice as governance event origin | ❌ | ✅ |
| Notice produces records (lineage) | ❌ | ✅ |
| Notice follow-up chain | ❌ | ✅ |
| Event context (location, attendance, weather) | ❌ | ✅ |
| Statutory notice with comment deadline | ❌ | ✅ |
| Proof of publication certificate | ❌ | ✅ |
| Public comment form (webhook-only) | ❌ | ✅ |
| POPIA consent on participation forms | ❌ | ✅ |
| `meeting` type → produces minutes | ✅ Traditional governance | ❌ |
| `pto` type (Permission to Occupy) | ✅ KZN land tenure | ❌ |
| `smme` type | ✅ SA procurement context | ❌ |
| Legal mandates (SPLUMA, NEMA, etc.) | ✅ SA statutory context | ❌ |
| `relatedArea` = isigodi | ✅ Traditional authority domain | ❌ |

**Platform abstraction:** A `notice` is a typed, dated public communication that initiates a process, optionally produces records, and may require public participation. A `statutory notice` is a notice with a legal mandate, a comment deadline, a participation form, and a proof of publication output. The type vocabulary and legal mandates are jurisdiction-specific. The structure is platform-generic.
