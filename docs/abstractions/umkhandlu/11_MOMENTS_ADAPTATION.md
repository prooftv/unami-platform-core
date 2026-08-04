# 11 — Moments Adaptation

> Umkhandlu Abstraction Pack · Unami Platform Core

---

## Purpose

This document explicitly maps governance concepts to their Moments equivalents. It shows how the governance domain informs the evolution of Moments — without turning Moments into a governance platform.

Moments is a community communication platform. It serves urban and peri-urban communities. It does not serve traditional authorities. The governance layer is an inspiration, not a requirement.

The adaptation is about structural learning — taking what works in governance and applying it where it adds value in community communication.

---

## The Core Adaptation Principle

Governance concepts are adapted, not imported.

A `statutory notice` becomes a `community moment with participation`. Not a statutory notice.
A `resolution` becomes a `community outcome`. Not a resolution.
A `conflict log` becomes a `disputed claim`. Not a TCRS entry.

The vocabulary changes. The structure is preserved.

---

## Notice → Moment

The strongest equivalence. A notice is a typed, dated public communication that initiates a process. A moment is the same thing.

| Governance Notice Type | Moments Equivalent | Notes |
|---|---|---|
| `meeting` | Community Moment | Meeting announcement |
| `announcement` | Standard Moment | General community communication |
| `alert` | Urgent Moment | `urgency_level = critical` |
| `opportunity` | Opportunity Moment | Jobs, bursaries, training |
| `employment` | Employment Moment | Employment-specific |
| `project-update` | Infrastructure Update Moment | Project status |
| `resolution` | Outcome Moment | Community decision |
| Statutory Notice | Consultation Moment (future) | Public participation — not yet in Moments |

**What Moments already has:** urgency levels, categories, regions, sponsor attribution, broadcast delivery.

**What Moments does not yet have:** participation forms, comment deadlines, proof of publication, lineage chains.

---

## Record → Community Record (Future)

Moments does not yet have records. When it does, the adaptation is:

| Governance Record Type | Moments Equivalent | Notes |
|---|---|---|
| `minutes` | Community Meeting Record | Minutes of a community meeting |
| `resolution` | Community Decision | Formal community outcome |
| `report` | Community Report | Status update on a community matter |
| `infrastructure-concern` | Community Concern | Ongoing issue with a life |
| `project-outcome` | Community Outcome | Completed project or initiative |
| `policy` | Community Policy | Community rules or guidelines |
| `land-allocation` | — | Not applicable to Moments |
| `dispute-resolution` | — | Not applicable to Moments |

The record lineage chain — origin notice → record → child record — becomes the community memory chain in Moments.

---

## Evidence → Media Evidence (Future)

Moments has media attachments. The governance evidence architecture adds:

| Governance Evidence | Moments Equivalent | Status |
|---|---|---|
| File attachments on records | Media on moments | ✅ Exists |
| Environmental context (weather) | — | Future |
| Attendance count | — | Future |
| Verification records (TCRS) | — | Future |
| Layer 5 certificates | — | Future |

The immediate adaptation: media attachments on moments are already evidence in the informal sense. The formal evidence architecture (weather context, verification, certificates) is a future evolution.

---

## Public Participation → Community Response (Future)

Moments does not yet have a participation engine. The adaptation:

| Governance Participation | Moments Equivalent | Notes |
|---|---|---|
| Statutory public comment | Community response | Structured response to a moment |
| Comment deadline | Response window | Time-bounded participation |
| `commentType` | Response type | `comment` / `support` / `concern` / `question` |
| `relationship` | Community relationship | `resident` / `subscriber` / `community` |
| Consent gate | Consent gate | Same architecture — different legal framework |
| Webhook delivery | Webhook delivery | Same architecture |
| Participation log | Response log | Anonymised, operator-maintained |
| `commentsReceived` counter | Response count | Denormalised count |

The participation engine for Moments follows the same architecture as the governance participation engine. The vocabulary is different. The consent, webhook delivery, and never-store principles are identical.

---

## Campaign → Community Campaign (Partial)

Moments already has campaigns. The adaptation extends them:

| Governance Campaign Feature | Moments Status | Notes |
|---|---|---|
| Campaign identity (title, type, status, dates) | ✅ Exists | |
| Sponsor reference | ✅ Exists | |
| Budget tracking | ✅ Exists | |
| Geographic scope | ✅ Exists | |
| Certified deliverables | ⏳ Future | Community project tracking |
| Progress log | ⏳ Future | Community project updates |
| RAG status | ⏳ Future | Community project health |
| Beneficiary count | ⏳ Future | Community impact tracking |
| Impact summary | ⏳ Future | Community outcomes |
| Lessons learned | ⏳ Future | Community institutional memory |
| Participation log | ⏳ Future | Community feedback on campaigns |

The `csr` campaign type — full project tracking — is the future evolution of Moments campaigns.

---

## Governance Audit → Moderation History

Moments has moderation audit. The governance audit is a superset.

| Governance Audit | Moments Equivalent | Notes |
|---|---|---|
| Record status transitions | Moment status transitions | ✅ Exists in `moderation_audit` |
| Approved by authority | Approved by admin | ✅ Exists |
| Verification note | Moderation note | ✅ Exists |
| Lineage chain | — | Future |
| Layer 5 audit package | — | Future |

---

## The Moments Evolution Path

This is the sequence in which governance concepts enter Moments — if and when the product requires them.

```
Phase 17 (current)
  Moments as community communication platform
  Notices · Broadcasts · Subscriptions · Sponsors · Campaigns

Phase 18 (launch)
  Moments in production
  Real community. Real broadcasts. Real feedback.

Phase 19+ (post-Umkhandlu)
  Community response engine
  Structured responses to moments
  Consent-gated · Webhook-delivered · Never stored

Phase 20+ (post-ITPMS)
  Community record chain
  Moments produce records
  Records have lineage
  Community institutional memory begins

Phase 21+ (post-Schools)
  Community evidence layer
  Media as formal evidence
  Environmental context on community events
  Community participation certificates

Phase 22+ (post-BeatsChain)
  Community intelligence
  Community health dashboard
  Cross-community patterns
  Regional community intelligence
```

This is not a commitment. It is a direction. Each phase is triggered by a concrete product requirement — not by the roadmap.

---

## What Moments Must Never Become

- A governance platform. Moments serves communities, not institutions.
- A statutory compliance tool. Moments is not a legal instrument.
- A traditional authority platform. That is Umkhandlu's domain.
- A project management tool. That is ITPMS's domain.

The governance domain informs Moments. It does not define it.

The adaptation is always: take the structural pattern, apply it with community vocabulary, preserve the simplicity that makes Moments accessible.
