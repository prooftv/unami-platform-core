# Unami Platform Ecosystem

Constitutional reference. Read before any implementation decision that touches repository boundaries,
data ownership, or application scope.

This document exists because the two repositories are permanently separate and must never be
conflated — not in code, not in documentation, not in AI session context.

---

## Two Repositories. Two Lifecycles. One Ecosystem.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         REPOSITORY 1: umkhandlu                                 │
│                    umkhandlu.unamifoundation.org                                 │
│                                                                                  │
│  Governance Node — sovereign, self-contained, independently deployed             │
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Sanity CMS  │  │  Supabase    │  │  Operators   │  │  Public Website  │    │
│  │  (optional)  │  │  (optional)  │  │  & Auth      │  │  & PWA           │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘    │
│                                                                                  │
│  Owns:                                                                           │
│  • Governance workflows (records, notices, resolutions)                          │
│  • Evidence attachments and environmental context                                │
│  • Public participation (consent-gated, webhook-delivered)                       │
│  • Commercial projects (RAG status, deliverables, beneficiaries)                 │
│  • TCRS conflict logs and escalation state                                       │
│  • Institutional memory and lineage chains                                       │
│  • Operator accounts and role management                                         │
│  • Internal storage and media                                                    │
│                                                                                  │
│  Exposes (read-only, authenticated):                                             │
│  • GET /api/intelligence/node        — identity, health, version                 │
│  • GET /api/intelligence/records     — counts, types, statuses, recent           │
│  • GET /api/intelligence/notices     — community + statutory, lifecycle          │
│  • GET /api/intelligence/commercial  — RAG, deliverables, beneficiaries          │
│  • GET /api/intelligence/evidence    — attachment counts, types                  │
│  • GET /api/intelligence/participation — counts, types, deadline compliance      │
│  • GET /api/intelligence/lineage     — lineage chains, Layer 5 outputs           │
│  • GET /api/intelligence/tcrs        — conflict logs, resolution state           │
│  • GET /api/intelligence/operators   — operator counts, role distribution        │
│                                                                                  │
│  Contract: docs/context/GOVERNANCE_NODE_API.md (in unami-platform-core)         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                              Read-only API calls
                              Bearer key per node
                              No mutations. Ever.
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                   REPOSITORY 2: unami-platform-core                              │
│                    github.com/prooftv/unami-platform-core                        │
│                                                                                  │
│  Platform Core — shared foundation + consuming applications                      │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        packages/ (frozen at v1.0)                       │    │
│  │                                                                         │    │
│  │  @unami/ui        Design system, structural components, theme engine    │    │
│  │  @unami/shared    Platform primitives: enums, types, validators         │    │
│  │  @unami/api       Typed HTTP clients for Edge Functions + node APIs     │    │
│  │                                                                         │    │
│  │  Rules: no Supabase, no auth, no domain knowledge, no app references   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────────┐    │
│  │       apps/admin             │  │            apps/web                  │    │
│  │   Moments Admin Dashboard    │  │       Moments Public PWA             │    │
│  │                              │  │                                      │    │
│  │  • Moments CRUD              │  │  • Public feed + moment detail       │    │
│  │  • Broadcast pipeline        │  │  • Region + category pages           │    │
│  │  • Subscriber management     │  │  • Subscribe (WhatsApp opt-in)       │    │
│  │  • Moderation queue          │  │  • Sanity editorial pages            │    │
│  │  • Authority profiles        │  │  • No auth, no Supabase client       │    │
│  │  • Sponsor + campaign mgmt   │  │                                      │    │
│  │  • Analytics dashboard       │  │  Data sources:                       │    │
│  │  • System settings           │  │  • Supabase via packages/api         │    │
│  │                              │  │  • Sanity via @sanity/client         │    │
│  │  Domain: apps/admin/src/     │  │                                      │    │
│  │          domain/moments/     │  │  Domain: apps/web/src/               │    │
│  └──────────────────────────────┘  │          domain/moments.ts           │    │
│                                    └──────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                       apps/umkhandlu                                    │    │
│  │                   Unami Control Centre                                  │    │
│  │                                                                         │    │
│  │  READ ONLY. Aggregates intelligence from sovereign governance nodes.    │    │
│  │  Does not edit, create, or administer node content. Ever.               │    │
│  │                                                                         │    │
│  │  • Node registry (which nodes exist, how to reach them)                │    │
│  │  • Node health view (per-node status, response times, version)         │    │
│  │  • Cross-node aggregation (totals, comparisons, regional view)         │    │
│  │  • Commercial intelligence (RAG distribution, beneficiaries, budget)   │    │
│  │  • TCRS escalation surface (conflict logs, resolution state)           │    │
│  │  • Institutional memory (lineage chains, Layer 5 outputs)              │    │
│  │                                                                         │    │
│  │  Connects to: umkhandlu node (Node 1), future nodes (Node 2, 3...)     │    │
│  │  Authentication: node-issued Bearer key per node (read-only)           │    │
│  │  Writes: none. The test — deleting apps/umkhandlu leaves packages/     │    │
│  │          compiling without modification.                                │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    supabase/ (Platform Supabase)                        │    │
│  │                                                                         │    │
│  │  functions/   17 Edge Functions — only layer that touches the DB       │    │
│  │  migrations/  000–007 applied. 000 is immutable baseline.              │    │
│  │                                                                         │    │
│  │  This is Moments' Supabase. Not the governance node's Supabase.        │    │
│  │  The governance node has its own optional Supabase instance.           │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Ownership Boundaries — Absolute Rules

| Concern | Owner | Never touches |
|---|---|---|
| Governance records, notices, resolutions | umkhandlu node | Platform Core |
| Evidence attachments | umkhandlu node | Platform Core |
| Public participation submissions | umkhandlu node | Platform Core |
| Operator accounts on governance node | umkhandlu node | Platform Core |
| Governance node Sanity CMS | umkhandlu node | Platform Core |
| Governance node internal storage | umkhandlu node | Platform Core |
| Community moments, broadcasts | Moments (apps/admin) | umkhandlu node |
| WhatsApp subscriber management | Moments (supabase/) | umkhandlu node |
| Design system primitives | packages/ui | Any single app |
| Platform API contracts | packages/api | Domain logic |
| Intelligence aggregation | apps/umkhandlu | Write operations |
| Node registration metadata | apps/umkhandlu Supabase | Node content |

---

## Data Flow — Platform Core

```
apps/admin  ──→  packages/api  ──→  supabase/functions/*  ──→  Supabase DB
apps/web    ──→  packages/api  ──→  supabase/functions/*  ──→  Supabase DB
apps/web    ──→  @sanity/client  ──→  Sanity CDN  (read-only)

apps/umkhandlu  ──→  packages/api (governance-node client)
                       ──→  umkhandlu node /api/intelligence/*  (read-only)
                       ──→  future nodes /api/intelligence/*    (read-only)
```

No application calls Supabase directly. No application queries node databases directly.
The governance node API is the only interface between the Control Centre and any node.

---

## Future Products — Platform Consumers

Each future product is an independent application that consumes `packages/` and owns its domain.
None modify `packages/`. None share domain logic with other applications.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Future Applications                                      │
│                                                                                  │
│  BeatsChain      Music creator ecosystem. Creator profiles, ISRC, marketplace.  │
│  TenderChain     Procurement transparency. Tender tracking, award verification.  │
│  GuidesChain     Community knowledge base. Guides, resources, local expertise.   │
│  NCIP            National Community Intelligence Platform. Multi-node federation.│
│  ITPMS           Municipal ICT project management. Project tracking, reporting.  │
│  Schools Portal  Educational administration. Communication, operations.          │
│  Ecommerce       Commercial storefronts. Product management, order workflows.    │
│                                                                                  │
│  Each:                                                                           │
│  • Consumes @unami/ui, @unami/shared, @unami/api                                │
│  • Owns its own domain (apps/[name]/src/domain/)                                │
│  • Has its own Vercel deployment                                                 │
│  • Has its own Supabase project (if needed)                                     │
│  • Never modifies packages/                                                      │
│  • Never shares domain logic with other applications                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Separation Test

Before writing any code, apply these tests:

**Test 1 — Repository boundary**
Does this feature belong in `umkhandlu` (governance node) or `unami-platform-core` (platform)?
If it involves creating, editing, or administering governance content → it belongs in `umkhandlu`.
If it involves consuming, aggregating, or displaying governance intelligence → it belongs in `apps/umkhandlu`.

**Test 2 — Deletion test**
If `apps/umkhandlu` were deleted, would `packages/` still compile? → Yes, always.
If `apps/admin` were deleted, would `packages/` still compile? → Yes, always.
If `packages/` were deleted, would the governance node still operate? → Yes, always.

**Test 3 — Write test**
Does this operation create, update, or delete data on a governance node? → Stop. It does not belong here.
The Control Centre observes. It does not govern.

**Test 4 — Domain test**
Does this concept (record type, notice type, workflow state) belong to a specific application?
→ It lives in that application's domain folder, not in `packages/shared`.

---

## Constitutional Decisions Referenced Here

| Decision | Summary |
|---|---|
| D-003 | Edge Functions are the only DB layer |
| D-027 | Domain extraction — Moments domain lives in apps/admin, not packages/ |
| D-032 | Platform validation order — Moments first, then Control Centre |
| D-033 | Phase 17 engineering complete — ops gates remaining |
| D-035 | Phase 18 is the Control Centre — not a governance editor |
| D-036 | Node sovereignty — the Control Centre observes, it does not govern |
| D-037 | Node registry — registration is not ownership |
| D-038 | Governance Node API contract v1.0 — field names are canonical |
| D-039 | Platform application onboarding pattern — shell parity is required |

Full decision log: `docs/context/decisions.md`
