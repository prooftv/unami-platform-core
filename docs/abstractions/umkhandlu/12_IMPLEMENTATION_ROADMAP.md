# 12 — Implementation Roadmap

> Umkhandlu Abstraction Pack · Unami Platform Core

---

## Purpose

This document ties the abstraction pack to the implementation sequence. It answers: in what order do these concepts enter the platform, and what triggers each step?

No step begins until the previous step is complete and documented.

---

## The Sequence

```
Step 1 — Knowledge Abstraction ✅
  Six source abstractions extracted from Umkhandlu repository
  Thirteen abstraction documents produced
  Platform mapping established
  Database impact classified

Step 2 — Platform Mapping ✅
  09_PLATFORM_MAPPING.md complete
  Every concept classified: platform / governance / commercial / domain
  Drift prevention rules established

Step 3 — Moments Product Completion (current)
  Phase 17B — Sanity CMS Integration
  Phase 17C — UX Polish
  Phase 17D — WhatsApp Production
  Phase 17E — Analytics
  Phase 17F — Production Hardening
  Phase 18 — Launch

Step 4 — Database Evolution (Phase 19)
  Platform tables added: records, notices, evidence, participation_log,
  conflict_logs, conflict_claims, project_updates, stakeholders
  Umkhandlu tables added: governance_nodes, governance_areas, governance_persons
  Commercial tables added: deliverables_certified, progress_log, funding_sources
  All additions follow 10_DATABASE_IMPACT.md classification

Step 5 — API Evolution (Phase 19)
  New Edge Functions for records, notices, evidence, participation
  New typed clients in packages/api for new endpoints
  Umkhandlu domain types inlined as string literals (same pattern as Moments)
  No domain types in packages/shared

Step 6 — Umkhandlu Application (Phase 19)
  apps/umkhandlu scaffolded
  Owns its shell, navigation, and domain
  Consumes @unami/ui, @unami/shared, @unami/api
  Does not modify packages/
  Governance vocabulary: records, notices, evidence, participation
  Domain vocabulary: isigodi, Inkosi, SPLUMA, NEMA, B-BBEE

Step 7 — Participation Engine (Phase 19)
  Consent-gated participation forms
  Webhook delivery architecture
  Participation log (anonymised)
  Comment deadline enforcement
  commentsReceived counter

Step 8 — Evidence Engine (Phase 19)
  Evidence attachments on records and notices
  Environmental context (weather) auto-capture
  TCRS conflict logs and claims
  Layer 5 derived outputs (certificates, lineage maps)

Step 9 — Institutional Memory Layer (Phase 19)
  Record lineage chain (parent/child)
  Origin notice traceability
  Governance journey maps
  Lineage certificates

Step 10 — Commercial Layer Extension (Phase 19)
  Campaign csr type with full project tracking
  Certified deliverables
  Progress log
  RAG status
  Beneficiary tracking
  Impact summary
  Lessons learned

Step 11 — Intelligence Dashboard (Phase 19+)
  Umkhandlu operator dashboard
  Node health view
  TCRS escalation surface
  Project health (RAG distribution)

Step 12 — Cross-Node Intelligence (Phase 20+)
  Intelligence node registry
  Read-only node API
  Unami Control Centre (apps/umkhandlu-intelligence)
  Cross-node aggregation
  Regional intelligence view
```

---

## Phase 19 — Umkhandlu in Detail

Phase 19 begins only after Phase 18 (Moments Launch) is complete.

### 19A — Foundation
- Scaffold `apps/umkhandlu`
- Shell, navigation, domain structure
- Platform tables: `records`, `notices`, `evidence`
- Edge Functions: `records`, `notices`
- Typed clients in `packages/api`

### 19B — Governance Records
- Full record CRUD in admin
- Record lineage chain
- Evidence attachments
- Status lifecycle
- Governance authority sign-off

### 19C — Notice Architecture
- Community notices
- Statutory notices
- Notice lifecycle
- Notice → record lineage

### 19D — Public Participation
- Participation form (consent-gated)
- Webhook delivery
- Participation log
- Comment deadline enforcement
- Proof of publication certificate

### 19E — Evidence Engine
- Environmental context (weather auto-capture)
- TCRS conflict logs
- Layer 5 derived outputs

### 19F — Commercial Layer
- Campaign `csr` type
- Certified deliverables
- Progress log
- RAG status
- Beneficiary tracking

### 19G — Intelligence Dashboard
- Operator dashboard
- Node health view
- TCRS escalation surface

---

## Trigger Conditions

Each step has a trigger condition. The step does not begin until the condition is met.

| Step | Trigger |
|---|---|
| Step 3 (Moments completion) | Phase 17A complete ✅ |
| Step 4 (Database evolution) | Phase 18 (Moments Launch) complete |
| Step 5 (API evolution) | Step 4 complete |
| Step 6 (Umkhandlu app) | Step 5 complete |
| Step 7 (Participation engine) | Step 6 complete |
| Step 8 (Evidence engine) | Step 7 complete |
| Step 9 (Institutional memory) | Step 8 complete |
| Step 10 (Commercial extension) | Step 9 complete |
| Step 11 (Intelligence dashboard) | Step 10 complete |
| Step 12 (Cross-node intelligence) | Step 11 complete + second node deployed |

---

## How This Pack Feeds the Governing Documents

When each step begins, the governing documents are updated:

| Document | Updated when |
|---|---|
| `PROJECT_STATUS.md` | Phase transition — current phase, last commit, what is done |
| `docs/context/architecture.md` | New layer boundaries, new data flow, new active phase |
| `docs/context/decisions.md` | New architectural decisions (D-031+) |
| `docs/context/product-vision.md` | New application added to ecosystem |
| `.amazonq/rules/workspace-rules.md` | Current priority updated |

The abstraction pack is the input. The governing documents are the output. The implementation is the result.

---

## What This Pack Does Not Do

- It does not write SQL. That is Step 4.
- It does not scaffold applications. That is Step 6.
- It does not modify `packages/`. That is never.
- It does not interrupt Phase 17. Moments completion is the current priority.
- It does not commit to timelines. Triggers are completion conditions, not dates.

The abstraction pack is knowledge. Implementation follows from knowledge — deliberately, with full architectural awareness.
