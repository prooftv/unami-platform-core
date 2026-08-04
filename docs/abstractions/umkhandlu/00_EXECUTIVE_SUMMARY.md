# 00 — Executive Summary

> Umkhandlu Abstraction Pack · Unami Platform Core
> Source: extracted from Umkhandlu repository. No inference beyond what the code contains.

---

## Why Umkhandlu Exists

Umkhandlu is a governance operating platform for traditional authorities and community institutions. It solves a specific and persistent problem: governance events happen, decisions are made, projects are funded and executed — and then the institutional memory of those events disappears. Minutes are lost. Resolutions are forgotten. Infrastructure projects complete with no verifiable record of what was built, by whom, at what cost, with what community input.

Umkhandlu exists to prevent that. Every governance event produces a record. Every record has a position in a lineage chain. Every claim about a project can be traced to a source with a known authority level. Every public participation process is consent-gated and POPIA-compliant. Every derived output — a certificate, a lineage map, a proof of publication — is verifiable against the source record.

The product is not a CMS. It is not a document manager. It is an institutional memory engine.

---

## The Core Philosophy

**Evidence-first governance.** Nothing is asserted without a record. Nothing is recorded without a source. Nothing is published without a lineage.

**Immutable record lineage.** Records are not edited to reflect new reality. New records are created that reference the old ones. The chain is the memory.

**Authority-classified truth.** When sources conflict, the system does not decide who is correct. It preserves all claims, classifies them by institutional authority, and presents the highest-authority verified value. The governance body decides. The platform records the decision.

**Consent-gated participation.** Public input is captured with explicit consent, delivered via webhook, and never stored in the platform. The platform records a count and an anonymised log. Personal data never persists.

**Federated sovereignty.** Each governance node — each traditional council, each institution — owns its own data, its own authority, its own dataset. The platform provides shared operating discipline. It does not centralise governance.

---

## What Umkhandlu Is Not

- Not a content management system. Records are governance outputs, not content.
- Not a document store. Documents are evidence attachments on records, not the records themselves.
- Not a form builder. Participation forms are consent-gated, webhook-delivered, and ephemeral.
- Not a project management tool. Campaigns track certified deliverables and community impact — not tasks and sprints.
- Not a reporting dashboard. The operator view is a live governance health surface, not a BI tool.

---

## The Five Architecture Layers

Everything in Umkhandlu maps to one of five layers:

```
Layer 1 — Community Communication
  Public notices, announcements, meetings, alerts, opportunities

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

This five-layer model is platform-generic. The vocabulary is governance-specific.

---

## Separation Between Governance and Platform

The Umkhandlu domain contains concepts that are specific to traditional authority governance in South Africa: the Inkosi, the Induna, the isigodi, the Ingonyama Trust, SPLUMA, NEMA, B-BBEE, CIPC, EPWP. These are not platform concepts.

The platform concepts extracted from Umkhandlu are:

- Record as institutional memory node with lineage
- Notice as governance event origin
- Evidence as first-class attachment with environmental context
- Verification as authority-classified conflict resolution
- Public participation as consent-gated, webhook-delivered, never-stored
- Campaign as certified project with deliverables, progress log, and impact tracking
- Intelligence as variance tracking, derived outputs, and federated aggregation

These concepts are reusable. They apply to Moments, to ITPMS, to Schools Portal, to BeatsChain — wherever governance, accountability, and institutional memory matter.

---

## What This Abstraction Pack Produces

Thirteen documents that become the constitutional reference for every future implementation decision in Unami Platform Core that touches governance, records, participation, evidence, or intelligence.

No code is written from this pack. Implementation follows from it — deliberately, with full architectural awareness of what is platform-generic and what is domain-specific.

The pack is the answer to: "What does the platform need to grow into?"
