# 09 — Platform Mapping

> Umkhandlu Abstraction Pack · Unami Platform Core

---

## Purpose

This document is the architectural bridge. For every concept in the Umkhandlu domain, it identifies:
- Whether the concept is platform-generic or domain-specific
- What the platform equivalent is
- What the Moments equivalent is (where one exists)
- What the future application equivalent is

This document prevents architectural drift. When a future engineer asks "where does this belong?", this document answers.

---

## Core Concept Mapping

| Umkhandlu | Platform | Moments | Future Apps | Notes |
|---|---|---|---|---|
| Record | Record | Moment | Record (ITPMS), Entry (Schools) | Structure is platform-generic. Type vocabulary is domain-specific. |
| Notice | Notice | Moment | Notice (ITPMS), Announcement (Schools) | Community notice = Moment. Statutory notice has no Moments equivalent yet. |
| Development Notice | Statutory Notice | — | Statutory Notice (ITPMS) | Statutory participation not yet in Moments. |
| Evidence | Evidence | Media attachment | Evidence | Attachments are platform-generic. Environmental context is platform-generic. |
| Weather context | Environmental context | — | Environmental context | Auto-captured, locked, platform-generic. |
| Public comment | Participation submission | — | Participation submission | Consent-gated, webhook-delivered, never stored. |
| Participation log | Participation log | — | Participation log | Anonymised, operator-maintained. |
| Campaign (`ad`) | Campaign (sponsorship) | Campaign | Campaign | Direct equivalent across all apps. |
| Campaign (`csr`) | Project | — | Project (ITPMS) | Full project tracking. Not yet in Moments. |
| Sponsor | Sponsor | Sponsor | Partner / Funder | Direct equivalent. |
| Certified deliverable | Certified deliverable | — | Milestone (ITPMS) | Verification model is platform-generic. |
| Progress log | Progress log | — | Progress log | Append-only timestamped entries. |
| RAG status | Project health | — | Project health | `green` / `amber` / `red` — platform-generic. |
| Conflict log (TCRS) | Verification record | — | Conflict log | Authority-classified variance tracking. |
| Source authority | Authority classification | — | Authority classification | Hierarchy is domain-specific. Structure is platform-generic. |
| Operator dashboard | Intelligence dashboard | Admin dashboard | Operator dashboard | Node-level health view. |
| Lineage certificate | Lineage certificate | — | Lineage certificate | Layer 5 derived output. |
| Proof of publication | Proof of publication | — | Proof of publication | Statutory compliance certificate. |
| Governance journey map | Journey map | — | Journey map | Visual lineage representation. |
| Federated node | Application instance | Moments deployment | Any app deployment | Each instance is sovereign. |
| Unami Control Centre | Cross-node intelligence | — | — | Aggregates multiple nodes. |

---

## Structural Equivalences

### Record ↔ Moment

Both are typed, dated, authored institutional events with a status lifecycle.

| Property | Record | Moment |
|---|---|---|
| Type vocabulary | minutes · resolution · policy · etc. | standard · urgent · development · etc. |
| Status lifecycle | pending → adopted / approved / resolved | draft → approved → broadcasted |
| Lineage | parentRecord → originNotice | — (not yet implemented) |
| Evidence | evidence[] attachments | media[] attachments |
| Authority | approvedBy → person | approved by admin role |
| Geographic scope | relatedArea → isigodi | region enum |
| Environmental context | weatherContext (auto-captured) | — (not yet implemented) |

The structural equivalence is strong. The vocabulary is different. The governance depth is different.

### Notice ↔ Moment

Both are typed, dated public communications that initiate a process.

| Property | Notice | Moment |
|---|---|---|
| Type vocabulary | meeting · alert · opportunity · etc. | standard · urgent · development · etc. |
| Produces records | yes — via originNotice reference | no — not yet implemented |
| Participation | statutory notices only | — (not yet implemented) |
| Pinnable | yes | yes (urgency_level) |
| Geographic scope | relatedArea | region |
| Delivery | public website | WhatsApp + PWA |

### Campaign ↔ Campaign

Both are typed projects with a lifecycle, a sponsor, and tracking.

| Property | Umkhandlu Campaign | Moments Campaign |
|---|---|---|
| Types | ad · activation · csr | — (single type) |
| Certified deliverables | yes | no |
| Progress log | yes | no |
| RAG status | yes | no |
| Beneficiary count | yes | no |
| Sponsor | yes | yes |
| Budget | yes | yes |
| Geographic scope | relatedAreas[] | regions[] |

The Moments campaign is the `ad` type equivalent. The `csr` type (full project tracking) is a future evolution.

---

## What Is Platform-Generic

These concepts belong in `packages/` or in the platform database schema. They are reusable across all applications.

| Concept | Where it lives |
|---|---|
| Record structure (identity, authority, content, lineage, context) | Platform database — `records` table |
| Notice structure (community + statutory) | Platform database — `notices` table |
| Evidence attachments | Platform database — `evidence` table |
| Environmental context (WeatherSnapshot type) | Platform database — JSONB on records/notices |
| Participation submission architecture | Platform — Edge Function pattern |
| Participation log structure | Platform database — `participation_log` table |
| Campaign structure (identity, lifecycle, tracking) | Platform database — `campaigns` table |
| Certified deliverable structure | Platform database — JSONB on campaigns |
| Progress log structure | Platform database — JSONB on campaigns |
| Sponsor structure | Platform database — `sponsors` table |
| Verification record structure (TCRS) | Platform database — `conflict_logs` table |
| Source authority classification structure | Platform database — JSONB on conflict_logs |
| RAG status enum | Platform — `green` / `amber` / `red` |
| Project phase enum | Platform — `planning` / `procurement` / `construction` / `commissioning` / `operational` |
| Five-layer architecture model | Platform — architectural reference |
| Federated node architecture | Platform — deployment model |

---

## What Is Domain-Specific

These concepts belong in the application domain. They do not belong in `packages/`.

| Concept | Domain | Why |
|---|---|---|
| `land-allocation` record type | Umkhandlu | Traditional authority land tenure |
| `dispute-resolution` record type | Umkhandlu | Traditional authority dispute process |
| `pto` notice type | Umkhandlu | KZN Ingonyama Trust Act |
| SPLUMA / NEMA legal mandates | Umkhandlu | South African statutory framework |
| B-BBEE level tracking | Umkhandlu | South African law |
| CIPC registration | Umkhandlu | South African company registration |
| EPWP / MIG / WSIG funding sources | Umkhandlu | South African government programmes |
| IPC certificate | Umkhandlu | SA infrastructure progress certificate |
| PMU / CLO authority hierarchy | Umkhandlu | SA infrastructure governance |
| Inkosi / Induna roles | Umkhandlu | Traditional authority leadership |
| Isigodi geographic unit | Umkhandlu | Traditional authority territory |
| SMME directory | Umkhandlu | SA procurement / B-BBEE context |
| Broadcast delivery | Moments | WhatsApp-specific delivery mechanism |
| WhatsApp commands (HELP, STATUS, STOP) | Moments | WhatsApp-specific interaction model |
| MCP (Moments Content Policy) | Moments | Moments-specific content governance |

---

## Architectural Drift Prevention

This table is the test. Before placing any concept in `packages/`, ask:

1. Does it appear in more than one application?
2. Is it free of domain vocabulary?
3. Can it be described without referencing Moments, Umkhandlu, or any specific application?

If all three answers are yes, it belongs in the platform.

If any answer is no, it belongs in the application domain.

**The rule that holds this together:**

Deleting Moments must leave `packages/` compiling without modification.
Deleting Umkhandlu must leave `packages/` compiling without modification.
Deleting any application must leave `packages/` compiling without modification.

The platform serves applications. Applications do not reshape the platform.
