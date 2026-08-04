# Phase 18 — Unami Control Centre
# Chat prompt. Load at the start of every Phase 18 session.

## Session context

You are working on Phase 18 of Unami Platform Core.

Phase 17 (Moments) is engineering-complete and frozen. Do not touch `apps/admin`, `apps/web`,
or any Moments Edge Functions unless a production bug requires it.

Phase 18 is the Unami Control Centre — the first application built on the mature platform.
It validates multi-application federation by connecting to deployed governance nodes
and producing institutional intelligence across them.

See D-035 in `decisions.md` for the full architectural correction and constitutional hierarchy.

---

## What the Control Centre is NOT

The production Umkhandlu governance application already exists at `umkhandlu.unamifoundation.org`.
It owns: governance editing, records, notices, evidence, participation, public website, Sanity Studio.

`apps/umkhandlu` inside Platform Core does NOT duplicate that application.
Do not build CRUD screens for records, notices, evidence, or participation.
Do not build governance editing UI of any kind.

---

## What the Control Centre IS

`apps/umkhandlu` is a read-oriented intelligence application that:
- Connects to deployed governance nodes via read-only APIs
- Aggregates institutional intelligence across nodes
- Surfaces node health, cross-node patterns, commercial projections, TCRS escalations

The abstraction pack defines shared platform concepts (Record, Notice, Evidence, Participation,
Campaign) so that all nodes speak the same language when the Control Centre queries them.
It does not require Platform Core to build CRUD screens for those concepts.

---

## What you must read before writing any code

1. `PROJECT_STATUS.md` — current sub-phase, what is done and what is next
2. `docs/context/decisions.md` — D-035 specifically — the architectural correction
3. `docs/abstractions/umkhandlu/08_INTELLIGENCE_LAYER.md` — the intelligence architecture
4. `docs/abstractions/umkhandlu/09_PLATFORM_MAPPING.md` — platform vs domain classification
5. `docs/abstractions/umkhandlu/00_EXECUTIVE_SUMMARY.md` — the five-layer model
6. `docs/context/product-vision.md` — Phase 18 description

---

## Sub-phases (in order — do not skip)

- **18A** ⚠️ Foundation — scaffold correct, CRUD screens must be removed, node registry model needed
- **18B** Node Connection — connect to first governance node, read-only API, data model alignment
- **18C** Node Health View — per-node health dashboard, record/notice/project counts, status distributions
- **18D** Cross-Node Aggregation — multi-node view, regional intelligence, comparative performance
- **18E** Commercial Intelligence — RAG distribution, deliverables, beneficiary tracking, projections
- **18F** TCRS Escalation Surface — conflict logs, authority classification, escalation tracking
- **18G** Institutional Memory — lineage views, provenance, Layer 5 derived outputs

---

## 18A cleanup — what must be removed before 18B begins

The following files were built incorrectly (governance CRUD, duplicates existing Umkhandlu repo):

```
apps/umkhandlu/src/app/(umkhandlu)/records/
apps/umkhandlu/src/app/(umkhandlu)/notices/
```

These must be deleted. The platform tables (`records`, `notices`), Edge Functions, and
`packages/api` clients remain — they define the shared data model nodes speak.
Only the UI screens are wrong.

---

## Architecture rules

**What the Control Centre builds:**
- Node registry — which governance nodes are connected
- Node health views — live state of a connected node (read-only queries)
- Cross-node aggregation — patterns across multiple nodes
- Intelligence dashboards — RAG, participation trends, commercial projections
- TCRS escalation surface — conflict tracking across nodes

**What the Control Centre never builds:**
- Create/edit/delete screens for records, notices, evidence, participation
- Governance workflow UI of any kind
- Anything that duplicates `umkhandlu.unamifoundation.org`

**Data flow:**
```
Governance Node (umkhandlu.unamifoundation.org)
    │
    │  read-only API (authenticated)
    ▼
apps/umkhandlu (Control Centre)
    │
    │  packages/api typed clients
    ▼
Intelligence views, health dashboards, aggregations
```

**packages/ rules:**
- `packages/api` — add read-only intelligence clients only, no create/update operations
- `packages/ui` — frozen, no new components
- `packages/shared` — frozen, no domain logic

**The test:** deleting `apps/umkhandlu` must leave `packages/` compiling without modification.

---

## Component rules (apps/umkhandlu)

- `@unami/ui` shared primitives: `PageHeader`, `KPIGrid`, `MetricCard`, `AnalyticsCard`,
  `LineChart`, `BarChart`, `PieChart`, `AreaChart`, `ActivityFeed`, `QuickActions`,
  `EmptyState`, `ErrorState`, `PageSkeleton`, `TableSkeleton`
- shadcn primitives from `src/components/ui/` for low-level elements
- Do NOT use from `@unami/ui`: `AppShell`, `Sidebar`, `Header`, `MobileNav` — Phase 3 stubs
- Badge variants: `default | secondary | destructive | outline` only

---

## Before writing any code — answer these questions

1. Is this a read operation (intelligence, aggregation, health view) or a write operation (CRUD)?
   If write — stop. The Control Centre does not write governance data.
2. Does this duplicate something that already exists in `umkhandlu.unamifoundation.org`?
   If yes — stop.
3. Does this belong in `packages/` or `apps/umkhandlu`?
4. Does this introduce domain vocabulary into a shared package?

If any answer is uncertain — stop and ask before writing.
