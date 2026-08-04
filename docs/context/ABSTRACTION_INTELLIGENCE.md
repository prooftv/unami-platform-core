# ABSTRACTION_INTELLIGENCE.md

> Extracted from Umkhandlu source. No simulation. No inference beyond what the code contains.

---

## What Intelligence Is

Intelligence is the platform's ability to reason about its own records and present structured insight to operators. In Umkhandlu, this exists in two places:

1. **The Operator Dashboard** — `/operator` — a live view of platform health and governance activity
2. **The TCRS** — Truth Conflict Resolution System — structured variance tracking across infrastructure projects

Source: `src/app/(frontend)/operator/page.tsx`, `src/studio/schema/documents/conflictLog.ts`, `TCRS.md`

---

## The Operator Dashboard

Source: `src/app/(frontend)/operator/page.tsx`

### What It Shows

The operator dashboard is a single dynamic page that aggregates live data from Sanity. It is not a CMS page — it is a system view.

Current sections (extracted from the page):
- Platform health indicators
- Recent governance activity (notices, records)
- Development notices status (open / closed / pending proof)
- Campaign / project health (RAG status)
- Verification records (TCRS) — pending, under review, escalated

### Access

Dynamic route. No authentication in the current implementation — access is by obscurity (URL not linked from public navigation).

### Data Source

Direct Sanity queries. No separate API layer. Queries run server-side on each page load.

---

## TCRS — Intelligence Layer

Source: `src/studio/schema/documents/conflictLog.ts`, `TCRS.md`

### What It Does

When multiple sources report different values for the same data point on the same project, TCRS:
1. Preserves all source reports
2. Classifies them by authority
3. Presents a verified reporting value
4. Tracks escalation

This is the intelligence layer — the platform reasoning about conflicting information and surfacing it for governance decision.

### The Authority Model

The intelligence is not algorithmic. It is governance-based. The system does not calculate a "correct" value. It classifies sources by institutional authority and presents the highest-authority verified value as the reporting value.

```
Engineer certification     (rank 1 — highest)
Municipal record           (rank 2)
PMU verification           (rank 3)
Contractor report          (rank 4)
CLO / Ward Councillor      (rank 5)
Field observation          (rank 6 — lowest)
```

### Information Layers

| Layer | Audience | What they see |
|---|---|---|
| Public | Community | Single verified reporting value |
| PMU | Project managers | Source comparison, variance tracking |
| Admin | Operators | Full source records, escalation status, verification history |

Currently implemented: Public layer (campaign detail page) + Admin layer (Sanity Studio).

---

## Layer 5 as Intelligence Output

Layer 5 outputs (lineage certificates, journey maps, proof of publication) are a form of intelligence — the system reasoning about its own records to produce structured, verifiable evidence.

Key property: Layer 5 outputs are never edited directly. They are regenerated from the underlying records. If the records change, the output changes. This is the integrity mechanism.

See `ABSTRACTION_EVIDENCE.md` for full Layer 5 specification.

---

## The Five Architecture Layers

Source: `TCRS.md` §13

```
Layer 1 — Community Communication
  Public notices, announcements, meetings, alerts

Layer 2 — Governance Records
  Minutes, resolutions, policies, reports, infrastructure records

Layer 3 — Evidence Preservation
  Attachments, public comments, conflict logs, development notices

Layer 4 — Institutional Memory
  Record lineage, parent/child relationships, decision provenance,
  governance history, origin traceability

Layer 5 — Governance Evidence (derived output)
  Proof of publication certificates, lineage certificates,
  governance audit packages, public verification outputs
```

Layers 1–4 are primary records — inputs and institutional memory.
Layer 5 is derived output — the system reasoning about its own records.

---

## Federated Governance Architecture

Source: `TCRS.md` §16

Each traditional council is a sovereign governance node:

```
Council A          Council B          Council C
─────────────      ─────────────      ─────────────
Own records        Own records        Own records
Own authority      Own authority      Own authority
Own dataset        Own dataset        Own dataset

─────────────────────────────────────────────────
        Common operating platform
        Shared SOP and operator discipline
        Shared evidence layer architecture
```

Properties:
- Data sovereignty: each council's data in its own Sanity project
- Governance authority: each council's leadership retains full authority
- Operator neutrality: Unami documents, does not govern
- Portability: each node can export its full dataset independently
- Isolation: a dispute at one node does not affect other nodes
- Shared discipline: SOP, TCRS, operator certification apply across all nodes

**Correct description:** Institutionally distributed. Technically federated.

---

## Planned Intelligence Dashboard

Source: `TCRS.md` §17, evolution presentation

The planned cross-node intelligence dashboard aggregates data from multiple council deployments:

```
UNAMI CONTROL CENTRE — Dashboard

┌────────────────────────────────────┐
│  KwaGudlucingo Node                │
│  Records · Notices · Consultations │
│  Projects · Audit                  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Node 2                            │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Node 3                            │
└────────────────────────────────────┘
```

This dashboard belongs in Unami Platform Core because it aggregates multiple deployments. It does not exist yet. It is a planned output of the abstraction process.

---

## Domain-Specific vs Platform-Generic

| Concept | Domain-specific | Platform-generic |
|---|---|---|
| Operator dashboard (live system view) | ❌ | ✅ |
| Variance tracking (conflicting sources) | ❌ | ✅ |
| Source authority classification | ❌ | ✅ |
| Verified reporting value | ❌ | ✅ |
| Escalation workflow | ❌ | ✅ |
| Five-layer architecture | ❌ | ✅ |
| Layer 5 derived outputs | ❌ | ✅ |
| Federated node architecture | ❌ | ✅ |
| Cross-node intelligence dashboard | ❌ | ✅ |
| Traditional council as governance node | ✅ Traditional authority domain | ❌ |
| Inkosi / Induna authority hierarchy | ✅ Traditional authority domain | ❌ |
| IPC / PMU / engineer hierarchy | ✅ SA infrastructure context | ❌ (structure is generic) |
| COGTA / municipal authority chain | ✅ SA governance context | ❌ |

**Platform abstraction:** Intelligence is the platform's ability to aggregate, classify by authority, surface variance, and produce derived evidence outputs. The authority hierarchy and governance vocabulary are domain-specific. The architecture — variance tracking, authority classification, derived outputs, federated nodes — is platform-generic.
