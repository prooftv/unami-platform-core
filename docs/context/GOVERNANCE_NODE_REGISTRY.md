# Governance Node Registry

> Constitutional document — Unami Platform Core
> Version: 1.0
> Status: Active — Phase 18B

---

## Purpose

This document defines what a "registered node" is, what the Control Centre's Supabase
database stores, what always remains inside the node, and the full lifecycle of node
registration, polling, and snapshot retention.

It is the constitutional contract between every governance node and the Unami Control Centre.
It prevents architectural confusion about where data lives and who owns it.

Read this document before touching `governance_nodes`, `node_snapshots`, or any polling logic.

---

## The Core Distinction

There are two completely separate things:

**Registration** — the Control Centre knows a node exists.
**Data** — the node owns its own records, notices, evidence, and governance content.

Registration lives in the Control Centre's Supabase database.
Data never leaves the node.

These must never be confused.

---

## Data Flow

```
Sanity CMS (node-owned)
        │
        ▼
Node Intelligence API
(umkhandlu.unamifoundation.org/api/intelligence/*)
        │
        ▼
Control Centre Poller
(server-side, scheduled or on-demand)
        │
        ▼
Supabase Snapshot
(Control Centre's own database — aggregated counts only)
        │
        ▼
Dashboard
(apps/umkhandlu — read-only display)
```

The direction is always: node → Control Centre.
The Control Centre never pushes to a node.
The Control Centre never bypasses the node to access Sanity or the node's database.

---

## What Lives in the Control Centre's Supabase

### `governance_nodes` — the registry

One row per registered node. This is configuration, not data.

```sql
id               uuid
name             text        -- human-readable node name
authority        text        -- governing institution
location         text        -- geographic description
url              text        -- base URL of the node
api_key          text        -- node-issued bearer token (encrypted at rest)
active           boolean     -- whether the Control Centre polls this node
contract_version text        -- which API contract version the node implements
capabilities     text[]      -- declared capability groups
notes            text        -- operator notes
created_at       timestamptz
updated_at       timestamptz
```

This table answers: "which nodes does the Control Centre know about?"
It does not store any governance content.

### `node_snapshots` — cached intelligence (Phase 18C+)

One row per polling cycle per node. These are point-in-time snapshots of aggregated
intelligence returned by the node's API. They are not source-of-truth data.

```sql
id           uuid
node_id      uuid references governance_nodes(id)
captured_at  timestamptz
health       jsonb    -- NodeHealth response
records      jsonb    -- RecordsSummary response
notices      jsonb    -- NoticesSummary response
commercial   jsonb    -- CommercialSummary response
participation jsonb   -- ParticipationSummary response
evidence     jsonb    -- EvidenceSummary response
tcrs         jsonb    -- TcrsSummary response
lineage      jsonb    -- LineageSummary response
```

Snapshots enable:
- Historical trend views without re-querying the node
- Offline display when a node is temporarily unreachable
- Cross-node aggregation without simultaneous live queries
- Audit trail of what the Control Centre observed and when

Snapshots are never edited. They are append-only. Retention policy: 90 days (Phase 18C).

### What Supabase does NOT store

- Individual records
- Individual notices
- Evidence files or metadata
- Participation submissions
- People or identity data
- Sanity content
- Any content that belongs to the node

If it is a governance object, it lives in the node. Not here.

---

## What Always Remains Inside the Node

The node owns and is the sole source of truth for:

- Records (governance decisions, resolutions, adoptions)
- Notices (statutory and non-statutory public notices)
- Evidence (attachments, environmental context, weather data)
- Public participation submissions
- People and community members
- Projects, sponsors, commercial campaigns
- TCRS conflict logs
- Lineage chains and Layer 5 outputs
- Sanity editorial content
- Authentication and access control
- All write operations

The Control Centre has no copy of any of this. It has counts and statuses — never content.

---

## What "Registering a Node" Means

Registering a node means:

1. The node operator provides the Control Centre operator with:
   - The node's base URL
   - A read-only API key issued by the node
   - The contract version the node implements

2. The Control Centre operator adds a row to `governance_nodes`.

3. The Control Centre begins polling the node's `/api/intelligence/*` endpoints.

4. Aggregated intelligence appears in the dashboard.

That is all. No data migration. No content transfer. No schema changes on the node.

The node continues operating exactly as before. It simply now has one additional
read-only consumer of its intelligence API.

---

## Authentication

The Control Centre authenticates to a node using a node-issued API key:

```
Authorization: Bearer <node-issued-api-key>
```

Key properties:
- Issued by the node operator — not by the Control Centre
- Read-only by contract — the node enforces this at the API layer
- Stored in `governance_nodes.api_key` — encrypted at rest in Supabase
- Rotatable — update the row in `governance_nodes`, no code changes required
- A revoked key returns `401` — the Control Centre marks the node `unreachable`

Key exchange is out-of-band. A node operator provides the key to the Control Centre
operator directly. There is no automated key provisioning.

---

## Polling Lifecycle

### Phase 18B — on-demand (current)

The Control Centre queries nodes live on each page load. No caching. No background jobs.
This is sufficient for Phase 18B where there is one node and the dashboard is not
yet in production use.

### Phase 18C — snapshot polling

A scheduled job (Supabase Edge Function cron or Vercel cron) polls each active node
on a defined schedule and writes a `node_snapshots` row. The dashboard reads from
snapshots rather than querying nodes live.

Recommended polling interval: every 15 minutes for health, every hour for summaries.

### Phase 19+ — event-driven

Nodes may push a webhook notification to the Control Centre when significant events occur
(new record adopted, statutory notice published, TCRS escalation). The Control Centre
triggers an immediate snapshot poll on receipt. This reduces latency for high-priority
intelligence without increasing polling frequency for routine data.

---

## Health Checks

The Control Centre polls `GET /api/intelligence/health` to determine node reachability.

Node status values:
- `healthy` — responded within 10 seconds, all declared capabilities responding
- `degraded` — responded but one or more capabilities returning errors
- `unreachable` — did not respond within 10 seconds, or returned 401/500

A `degraded` node still displays available intelligence. Only the failing capability
is marked degraded. The Control Centre does not mark the entire node unreachable
because one endpoint is slow.

An `unreachable` node displays the last known snapshot (if available) with a staleness
indicator. It does not display an error page.

---

## Capability Discovery

When a node is first registered, the Control Centre calls `GET /api/intelligence/node`
to discover which capabilities the node declares. It stores these in `governance_nodes.capabilities`.

The Control Centre only queries capabilities the node has declared. If a node declares
`governance` but not `commercial`, the Control Centre never calls
`/api/intelligence/commercial/summary`.

When a node adds a new capability, the operator updates `governance_nodes.capabilities`.
No code changes are required in the Control Centre — the polling logic reads capabilities
from the registry row.

---

## Adding a Future Node

When a second governance node is onboarded (Phase 19):

1. The new node implements the API contract defined in `GOVERNANCE_NODE_API.md`.
2. The Control Centre operator adds a row to `governance_nodes` with the new node's URL and key.
3. The Control Centre begins polling the new node.
4. Cross-node aggregation in the dashboard automatically includes the new node.

No code changes are required in the Control Centre.
No changes are required in `packages/`.
No schema changes are required.

This is the validation of the platform architecture. The registry model is the mechanism
that makes the Control Centre application-agnostic with respect to which nodes it connects to.

---

## Security Rules

- `governance_nodes.api_key` is never returned to the browser — server-side only
- The nodes page in the dashboard displays `•••••••••` for the api_key field
- RLS is disabled on `governance_nodes` — this table contains no personal data
- Only `super_admin` role can add, activate, deactivate, or remove nodes
- Operators (non-super-admin) can view the node registry but cannot modify it
- Snapshot data is read-only — no application code writes to `node_snapshots` except the poller

---

## What This Document Does Not Define

- The intelligence API endpoints themselves — see `GOVERNANCE_NODE_API.md`
- The dashboard UI for node health — see Phase 18C implementation
- The snapshot retention policy implementation — Phase 18C
- Automated key provisioning — Phase 19+
- Node-to-node communication — not in scope (nodes do not communicate with each other)
- Write operations from the Control Centre to a node — prohibited by D-036, no exceptions

---

## Relationship to D-036

D-036 (Node Sovereignty) states: the Control Centre observes, it does not govern.

This document is the operational expression of D-036. The registry model is how
observation is implemented without ownership. The Control Centre knows where nodes are
and how to reach them. It does not own what they contain.

The test: if the Control Centre's Supabase database were deleted entirely, every governance
node would continue operating without interruption. The nodes do not depend on the
Control Centre. The Control Centre depends on the nodes.

That asymmetry is intentional and permanent.
