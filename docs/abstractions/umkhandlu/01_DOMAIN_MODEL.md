# 01 — Domain Model

> Umkhandlu Abstraction Pack · Unami Platform Core

---

## The Complete Domain Map

```
Community / Institution
        │
        ▼
    Notice ──────────────────────────────────────────────────────┐
    (governance event origin)                                    │
        │                                                        │
        ├── Community Notice                                     │
        │     meeting · announcement · resolution                │
        │     alert · opportunity · employment                   │
        │     smme · project-update                              │
        │                                                        │
        └── Development Notice (statutory)                       │
              eia · rezoning · land-use · township               │
              building · mining · liquor · telecom               │
              estate · liquidation · pto                         │
                    │                                            │
                    ▼                                            │
            Public Participation ◄────────────────────────────┘
            (consent-gated, webhook-delivered, never stored)
                    │
                    ▼
                Record
                (institutional memory node)
                    │
                    ├── minutes · resolution · community-decision
                    ├── land-allocation · dispute-resolution
                    ├── report · infrastructure-concern
                    ├── project-outcome · policy
                    └── agenda · public-notice · external-resource
                    │
                    ▼
                Evidence
                    │
                    ├── Attachments (files on records)
                    ├── Environmental context (weather snapshot)
                    └── Verification records (TCRS conflict logs)
                    │
                    ▼
                Decision
                (record with status: adopted / approved / resolved)
                    │
                    ▼
                Campaign (project / initiative)
                    │
                    ├── Certified deliverables
                    ├── Progress log
                    ├── Project updates (event log)
                    ├── Participation log (anonymised)
                    ├── SMME directory
                    └── Community notices
                    │
                    ▼
                Outcome
                (project-outcome record, impact summary, lessons learned)
                    │
                    ▼
                Audit / Intelligence
                    │
                    ├── Operator dashboard (live governance health)
                    ├── TCRS (variance tracking, authority classification)
                    └── Layer 5 derived outputs
                          lineage certificate · journey map
                          proof of publication · audit package
```

---

## Concept Classification

Every concept in the domain belongs to one of four categories.

### Platform Concepts
Reusable across all applications. No governance vocabulary required.

| Concept | Description |
|---|---|
| Record | Typed, dated, authored institutional event with status lifecycle and lineage |
| Notice | Typed public communication that initiates a process |
| Evidence | Attachments, environmental context, verification records |
| Participation | Consent-gated structured input, webhook-delivered, never stored |
| Campaign | Typed project with certified deliverables, progress log, impact tracking |
| Sponsor | Organisation that funds or partners on a campaign |
| Lineage | Parent/child record chain — origin traceability |
| Verification | Authority-classified conflict resolution with preserved source claims |
| Derived output | System-generated evidence from underlying records — never edited directly |
| Federated node | Sovereign data instance with shared operating discipline |

### Governance Concepts
Specific to governance institutions. Reusable across governance applications (Umkhandlu, ITPMS, Schools Portal).

| Concept | Description |
|---|---|
| Governance authority | The person or body that approves a record |
| Statutory notice | Notice with legal mandate, comment deadline, proof of publication |
| Public comment period | Time-bounded participation window with legal standing |
| Proof of publication | Verifiable certificate of statutory compliance |
| Institutional memory | The accumulated record lineage of a governance body |
| Operator | The person responsible for platform discipline at a node |

### Commercial Concepts
Specific to funded projects and economic activity. Reusable across commercial applications.

| Concept | Description |
|---|---|
| Certified deliverable | Verified completion unit with authority sign-off |
| RAG status | Red/Amber/Green project health indicator |
| Funding source | The programme or entity funding a project |
| Beneficiary count | Community members impacted by a project |
| Impact summary | Narrative account of project outcomes |
| Lessons learned | Permanent institutional memory at project closure |

### Domain Concepts
Specific to Umkhandlu / South African traditional authority context. Not platform-generic.

| Concept | Description |
|---|---|
| Inkosi / Induna | Traditional authority leadership roles |
| Isigodi | Traditional authority geographic unit |
| Ingonyama Trust | KZN land tenure authority |
| SPLUMA / NEMA | South African statutory frameworks |
| B-BBEE / CIPC | South African business compliance |
| EPWP / MIG / WSIG | South African government funding programmes |
| IPC certificate | Infrastructure progress certificate (SA construction) |
| PMU | Project Management Unit (SA infrastructure) |

---

## The Lineage Chain

The most important structural concept in the domain. Every record knows where it came from.

```
Notice (origin)
    │
    └── Record (produced from notice)
            │
            └── Record (produced from parent record)
                    │
                    └── Record (produced from parent record)
                                │
                                └── ... (chain continues)
```

The chain is never broken. If a record has no `originNotice` and no `parentRecord`, it is a root record — the beginning of a new lineage. This is valid but notable.

The reverse lookup (all records that reference a given record as their parent) is a query, not a stored field. The chain is reconstructed on demand from the stored references.

---

## The Five-Layer Model

Every concept maps to a layer. The layer determines how the concept is stored, queried, and presented.

| Layer | Name | Concepts |
|---|---|---|
| 1 | Community Communication | Notice, announcement, alert, opportunity |
| 2 | Governance Records | Record (all types), decision, resolution |
| 3 | Evidence Preservation | Attachments, public comments, conflict logs |
| 4 | Institutional Memory | Lineage, parent/child chains, provenance |
| 5 | Governance Evidence | Certificates, journey maps, audit packages |

Layer 5 is derived from Layers 1–4. It is never a primary input.

---

## How Moments Maps to This Domain

Moments is not a governance platform. But it shares structural DNA with the governance domain.

| Governance concept | Moments equivalent | Notes |
|---|---|---|
| Notice | Moment | A moment is a community communication event |
| Community Notice | Moment | Same layer — Layer 1 |
| Record | — | Moments does not yet have governance records |
| Evidence | Media attachment | Moments has media — not yet evidence in the governance sense |
| Public Participation | — | Not yet implemented in Moments |
| Campaign | Campaign | Moments has campaigns — commercial layer only |
| Sponsor | Sponsor | Direct equivalent |
| Broadcast | — | Moments-specific delivery mechanism, no governance equivalent |

The gap between Moments and the governance domain is intentional. Moments is a community communication platform. The governance layer is a future evolution — not a current requirement.
