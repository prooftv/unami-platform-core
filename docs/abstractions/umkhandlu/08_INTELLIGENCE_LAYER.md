# 08 — Intelligence Layer

> Umkhandlu Abstraction Pack · Unami Platform Core
> Source: `ABSTRACTION_INTELLIGENCE.md`

---

## What Intelligence Is

Intelligence is the platform's ability to reason about its own records and present structured insight to operators. It is not a BI tool. It is not a reporting dashboard. It is the system surfacing what it knows about itself.

Intelligence exists at three levels:

```
Level 1 — Node Intelligence
  A single governance node's live health view
  Records · Notices · Projects · Participation · Verification

Level 2 — Cross-Node Intelligence
  Aggregated view across multiple nodes
  Regional patterns · Comparative performance · Shared concerns

Level 3 — Derived Evidence Intelligence
  Layer 5 outputs — the system reasoning about its own records
  Certificates · Lineage maps · Audit packages
```

---

## Level 1 — Node Intelligence (Operator Dashboard)

### What It Shows

The operator dashboard is a single dynamic page that aggregates live data from the node. It is not a CMS page — it is a system view.

Current sections (from Umkhandlu implementation):
- Platform health indicators
- Recent governance activity (notices, records)
- Development notices status (open / closed / pending proof)
- Campaign / project health (RAG status)
- Verification records (TCRS) — pending, under review, escalated

### Access Model

The operator dashboard is for operators — the people responsible for platform discipline at a node. It is not a public page. It is not a CMS page. It is a system view.

Current Umkhandlu implementation: access by obscurity (URL not linked from public navigation). Future: authenticated operator role.

### Data Flow

```
Node records (notices, records, campaigns, conflict logs)
    │
    ▼
Server-side aggregation queries
    │
    ▼
Operator dashboard (live, no cache)
```

No separate API layer. Queries run server-side on each page load. The dashboard is always current.

---

## Level 2 — Cross-Node Intelligence (Planned)

### What It Is

The planned Unami Control Centre — a dashboard that aggregates data from multiple governance node deployments.

```
UNAMI CONTROL CENTRE

┌────────────────────────────────────┐
│  Node A                            │
│  Records · Notices · Consultations │
│  Projects · Audit                  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Node B                            │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Node C                            │
└────────────────────────────────────┘
```

### What It Aggregates

From each node:
- Record counts by type and status
- Notice counts by type and status
- Active development notices (open comment periods)
- Campaign health (RAG distribution)
- Verification records (pending / escalated)
- Participation counts
- Project completion rates
- Beneficiary counts

### What It Does Not Do

- It does not store node data centrally — it queries each node on demand
- It does not govern — it observes
- It does not override node authority — each node retains full sovereignty
- It does not expose personal data — only aggregated counts and statuses

### Architecture

```
Unami Control Centre (apps/umkhandlu-intelligence or apps/admin extension)
    │
    ├── Node A API (read-only, authenticated)
    ├── Node B API (read-only, authenticated)
    └── Node C API (read-only, authenticated)
```

Each node exposes a read-only intelligence API. The control centre aggregates. Neither stores the other's data.

---

## TCRS — Truth Conflict Resolution System

### What It Does

When multiple sources report different values for the same data point on the same project, TCRS:
1. Preserves all source reports — nothing is deleted
2. Classifies them by institutional authority
3. Presents a verified reporting value
4. Tracks escalation until resolved

### The Intelligence Model

The intelligence is not algorithmic. It is governance-based.

The system does not calculate a "correct" value. It classifies sources by institutional authority and presents the highest-authority verified value as the reporting value. The governance body decides. The platform records the decision.

```
Source A reports: 70% complete
Source B reports: 55% complete
Source C reports: 45% complete

TCRS classifies:
  Source A = contractor (rank 4)
  Source B = engineer (rank 1)
  Source C = field observation (rank 6)

Verified reporting value: 55% (engineer certification)
```

### Information Layers

| Layer | Audience | What they see |
|---|---|---|
| Public | Community | Single verified reporting value |
| PMU | Project managers | Source comparison, variance tracking |
| Admin | Operators | Full source records, escalation status, verification history |

### Escalation Flow

```
Variance detected
    │
    ▼
Conflict log created (resolutionState: pending)
    │
    ▼
Sources classified by authority
    │
    ▼
Verified reporting value set (displayTruth)
    │
    ├── Accepted → resolutionState: resolved
    │
    └── Disputed → resolutionState: escalated
                        │
                        ▼
                  Escalation level raised
                        │
                        ▼
                  Higher authority reviews
                        │
                        ▼
                  resolutionState: resolved
```

---

## Level 3 — Derived Evidence Intelligence (Layer 5)

Layer 5 outputs are a form of intelligence — the system reasoning about its own records to produce structured, verifiable evidence.

| Output | Intelligence it provides |
|---|---|
| Governance Record Lineage Certificate | Complete chain of custody for a governance event |
| Governance Journey Map | Visual representation of the governance chain |
| Proof of Publication Certificate | Verifiable evidence of statutory compliance |

Key property: Layer 5 outputs are never edited directly. They are regenerated from the underlying records. If the records change, the output changes. The revision identifier on the output tells you whether the source has changed since the output was generated.

---

## Intelligence Dashboard — Future Architecture

The full intelligence dashboard (planned, not yet built) aggregates across all layers:

```
Node
    │
    ├── Events (notices, records)
    ├── Records (all types, all statuses)
    ├── Projects (campaigns, deliverables, RAG)
    ├── Evidence (attachments, TCRS, weather)
    ├── Participation (counts, types, outcomes)
    ├── Financials (budgets, spend, beneficiaries)
    ├── Performance (completion rates, timelines)
    │
    ▼
Regional Intelligence
    │
    ├── Cross-node patterns
    ├── Comparative performance
    ├── Shared concerns
    ├── Regional project health
    │
    ▼
Provincial Intelligence
    │
    ├── Regional aggregation
    ├── Provincial patterns
    │
    ▼
National Intelligence
    │
    ├── Provincial aggregation
    ├── National patterns
    └── Policy recommendations
```

This is the long-range vision. It is not a current implementation requirement. It is the architectural target that every earlier decision should point toward.

---

## Federated Node Architecture

Each governance node is a sovereign data instance.

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
- **Data sovereignty:** each node's data in its own database instance
- **Governance authority:** each node's leadership retains full authority
- **Operator neutrality:** Unami documents, does not govern
- **Portability:** each node can export its full dataset independently
- **Isolation:** a dispute at one node does not affect other nodes
- **Shared discipline:** SOP, TCRS, operator certification apply across all nodes

**Correct description:** Institutionally distributed. Technically federated.

---

## Platform Implementation Notes

When implementing the intelligence layer in Unami Platform Core:

1. The operator dashboard is an application-layer concern — not a platform package.
2. The TCRS `conflict_logs` table is a platform table — the authority hierarchy is application-defined.
3. The cross-node intelligence API is a read-only authenticated endpoint — each node exposes it.
4. The Unami Control Centre is a separate application (`apps/umkhandlu-intelligence`) — not an extension of `apps/admin`.
5. Intelligence queries are always server-side — never client-side data fetching.
6. Aggregation is always on-demand — no pre-computed intelligence tables (until performance requires it).
7. The five-layer model is the architectural reference for all intelligence work — Layer 5 outputs are derived, never primary.
8. The revision identifier for Layer 5 integrity is a content hash of the source records — not a database-specific concept.
