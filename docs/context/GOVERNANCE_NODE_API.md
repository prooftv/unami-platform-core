# Governance Node API Contract

> Constitutional document — Unami Platform Core
> Version: 1.0
> Status: Frozen before Phase 18B implementation begins

---

## Purpose

This document defines the read-only API contract that every governance node must implement
to connect to the Unami Control Centre.

It is the equivalent of an OpenAPI contract at the architectural level. It defines:
- The identity every node exposes
- The read-only endpoints the Control Centre consumes
- Authentication between nodes and the Control Centre
- Versioning and capability negotiation
- Health checks and synchronisation metadata
- What data is mandatory vs optional
- The invariants that preserve node sovereignty

Once this contract is frozen, the Control Centre implements one adapter for
`umkhandlu.unamifoundation.org`. Every future governance node — and eventually other
Unami applications — implements the same contract without requiring changes to the
Control Centre. That is the point where the platform architecture is validated.

---

## The Invariant

**The Control Centre never writes to a node.**

Every endpoint in this contract is read-only. No node is required to expose any write
capability to the Control Centre. Any node that does expose write endpoints does so
for its own internal purposes — the Control Centre will never call them.

This invariant is enforced by D-036 (Node Sovereignty) and cannot be overridden.

---

## Node Identity

Every node exposes a single identity endpoint. This is the handshake.

```
GET /api/intelligence/node
```

### Response — required fields

```json
{
  "id": "string — stable unique identifier for this node (UUID or slug)",
  "name": "string — human-readable node name",
  "authority": "string — the governing institution (e.g. KwaGudlucingo Traditional Council)",
  "location": "string — geographic description (e.g. Nquthu, KwaZulu-Natal)",
  "version": "string — node software version (semver)",
  "contractVersion": "string — which version of this contract the node implements",
  "capabilities": ["string array — which capability groups this node supports"],
  "timezone": "string — IANA timezone (e.g. Africa/Johannesburg)"
}
```

### Response — optional fields

```json
{
  "description": "string — longer description of the node's purpose",
  "website": "string — public URL of the node's website",
  "logo": "string — URL of the node's logo",
  "contactEmail": "string — operator contact email",
  "establishedDate": "string — ISO date when the node was established"
}
```

### Capability groups

A node declares which capability groups it supports. The Control Centre only queries
capabilities the node has declared. Unknown capabilities are ignored.

| Capability | Description |
|---|---|
| `governance` | Records and notices |
| `participation` | Public participation logs and counts |
| `evidence` | Evidence attachments and environmental context |
| `commercial` | Campaigns, projects, sponsors |
| `tcrs` | Truth Conflict Resolution System — conflict logs |
| `institutional-memory` | Lineage chains, provenance, Layer 5 outputs |
| `health` | Node health and synchronisation metadata |

---

## Authentication

The Control Centre authenticates to a node using a node-issued API key.

```
Authorization: Bearer <node-issued-api-key>
```

### Key properties

- Keys are issued by the node operator — not by the Control Centre
- Keys are read-only by contract — the node enforces this at the API layer
- Keys are rotatable — the node registry stores the current key per node
- Keys are never stored in `packages/` — they live in the Control Centre's secure config
- A revoked key returns `401 Unauthorized` — the Control Centre marks the node as unreachable

### Key exchange

Key exchange is out-of-band — a node operator provides the key to the Control Centre
operator directly. There is no automated key provisioning in Phase 18B.
Automated key exchange is a future capability (Phase 19+).

---

## Health Endpoint

```
GET /api/intelligence/health
```

### Response

```json
{
  "status": "healthy | degraded | unreachable",
  "lastUpdated": "ISO datetime — when this response was generated",
  "recordCount": "number — total records in the node",
  "noticeCount": "number — total notices in the node",
  "uptime": "number — seconds since last restart (optional)",
  "version": "string — node software version"
}
```

The Control Centre polls this endpoint to determine node reachability. If the endpoint
does not respond within 10 seconds, the node is marked `unreachable` in the registry.

---

## Governance Endpoints

Required if the node declares the `governance` capability.

### Records summary

```
GET /api/intelligence/records/summary
```

Returns aggregated counts — not individual records.

```json
{
  "total": "number",
  "byStatus": {
    "pending": "number",
    "adopted": "number",
    "approved": "number",
    "resolved": "number",
    "rejected": "number"
  },
  "byType": {
    "<type>": "number"
  },
  "recentActivity": [
    {
      "id": "string",
      "title": "string",
      "type": "string",
      "status": "string",
      "createdAt": "ISO datetime"
    }
  ],
  "generatedAt": "ISO datetime"
}
```

`recentActivity` returns the 10 most recently created or updated records.
It contains no personal data — only institutional record metadata.

### Notices summary

```
GET /api/intelligence/notices/summary
```

```json
{
  "total": "number",
  "byStatus": {
    "draft": "number",
    "published": "number",
    "open": "number",
    "closed": "number",
    "approved": "number",
    "rejected": "number",
    "withdrawn": "number"
  },
  "byType": {
    "<type>": "number"
  },
  "statutory": {
    "total": "number",
    "open": "number — currently accepting public comments",
    "pendingProof": "number — closed but proof not yet issued",
    "averageCommentPeriodDays": "number — optional"
  },
  "recentActivity": [
    {
      "id": "string",
      "title": "string",
      "type": "string",
      "status": "string",
      "isStatutory": "boolean",
      "commentDeadline": "ISO date | null",
      "createdAt": "ISO datetime"
    }
  ],
  "generatedAt": "ISO datetime"
}
```

---

## Participation Endpoints

Required if the node declares the `participation` capability.

### Participation summary

```
GET /api/intelligence/participation/summary
```

```json
{
  "total": "number — total participation submissions logged",
  "byType": {
    "comment": "number",
    "objection": "number",
    "support": "number",
    "question": "number"
  },
  "byRelationship": {
    "resident": "number",
    "landowner": "number",
    "business": "number",
    "community": "number",
    "organisation": "number",
    "other": "number"
  },
  "activeNotices": "number — notices currently open for comment",
  "generatedAt": "ISO datetime"
}
```

No personal data is returned. All fields are aggregated counts.

---

## Evidence Endpoints

Required if the node declares the `evidence` capability.

### Evidence summary

```
GET /api/intelligence/evidence/summary
```

```json
{
  "total": "number — total evidence attachments",
  "byType": {
    "image": "number",
    "document": "number",
    "video": "number",
    "audio": "number",
    "other": "number"
  },
  "withWeatherContext": "number — records/notices with environmental context captured",
  "totalSizeBytes": "number — optional, total storage used",
  "generatedAt": "ISO datetime"
}
```

---

## Commercial Endpoints

Required if the node declares the `commercial` capability.

### Commercial summary

```
GET /api/intelligence/commercial/summary
```

```json
{
  "projects": {
    "total": "number",
    "byStatus": {
      "draft": "number",
      "approved": "number",
      "active": "number",
      "completed": "number",
      "reported": "number"
    },
    "byHealth": {
      "green": "number",
      "amber": "number",
      "red": "number"
    },
    "byPhase": {
      "planning": "number",
      "procurement": "number",
      "construction": "number",
      "commissioning": "number",
      "operational": "number"
    },
    "totalBudget": "number — sum of all active project budgets",
    "totalBeneficiaries": "number — sum across all active projects"
  },
  "sponsors": {
    "total": "number",
    "active": "number — sponsors with at least one active project"
  },
  "recentActivity": [
    {
      "id": "string",
      "title": "string",
      "type": "string — ad | activation | csr",
      "status": "string",
      "health": "string | null",
      "updatedAt": "ISO datetime"
    }
  ],
  "generatedAt": "ISO datetime"
}
```

---

## TCRS Endpoints

Required if the node declares the `tcrs` capability.

### TCRS summary

```
GET /api/intelligence/tcrs/summary
```

```json
{
  "total": "number — total conflict logs",
  "byResolutionState": {
    "pending": "number",
    "resolved": "number",
    "escalated": "number"
  },
  "escalated": "number — currently escalated conflicts",
  "averageResolutionDays": "number — optional",
  "generatedAt": "ISO datetime"
}
```

---

## Institutional Memory Endpoints

Required if the node declares the `institutional-memory` capability.

### Lineage summary

```
GET /api/intelligence/lineage/summary
```

```json
{
  "rootRecords": "number — records with no parent and no origin notice",
  "linkedRecords": "number — records with a parent or origin notice",
  "averageChainDepth": "number — optional",
  "layer5Outputs": {
    "lineageCertificates": "number",
    "proofOfPublication": "number",
    "journeyMaps": "number"
  },
  "generatedAt": "ISO datetime"
}
```

---

## Versioning and Capability Negotiation

### Contract versioning

The `contractVersion` field in the node identity response declares which version of
this contract the node implements. The Control Centre uses this to determine which
endpoints to call and how to interpret responses.

| Contract version | Minimum capabilities required |
|---|---|
| `1.0` | `health`, `governance` |
| `1.1` | `health`, `governance`, `participation` |
| `2.0` | All capabilities |

The Control Centre never calls an endpoint the node has not declared in `capabilities`.
If a node declares `governance` but not `commercial`, the Control Centre does not call
`/api/intelligence/commercial/summary`.

### Graceful degradation

If a declared endpoint returns an error, the Control Centre:
1. Logs the error against the node
2. Displays the node as `degraded` for that capability
3. Continues displaying data from other capabilities that are healthy
4. Does not mark the entire node as unreachable

---

## Response Conventions

All endpoints follow these conventions:

- All responses are `application/json`
- All datetime fields are ISO 8601 strings in UTC
- All counts are non-negative integers — never null (use `0`)
- Optional fields may be omitted entirely — the Control Centre handles missing fields gracefully
- `generatedAt` is required on all summary endpoints — it tells the Control Centre how fresh the data is
- HTTP 200 for success
- HTTP 401 for invalid or missing API key
- HTTP 403 for valid key but insufficient permissions
- HTTP 404 for unknown endpoint
- HTTP 429 for rate limiting
- HTTP 500 for node-side errors

### No personal data

No endpoint in this contract returns personal data. Names, contact details, identity
information, and participation submissions are never included in intelligence responses.
The Control Centre receives counts, statuses, and institutional metadata only.

---

## Rate Limiting

Nodes may rate-limit the Control Centre. Recommended limits:

| Endpoint | Recommended limit |
|---|---|
| `GET /api/intelligence/node` | 60 requests/hour |
| `GET /api/intelligence/health` | 60 requests/hour |
| All summary endpoints | 30 requests/hour each |

The Control Centre respects `Retry-After` headers. If rate-limited, it backs off and
retries after the specified interval. It does not hammer a rate-limited node.

---

## What This Contract Does Not Define

This contract deliberately does not define:

- **Individual record retrieval** — the Control Centre aggregates, it does not browse
- **Search or filtering** — summary endpoints return pre-aggregated data
- **Write operations** — none exist, none will be added (D-036)
- **Webhook delivery** — nodes push to their own webhooks, not to the Control Centre
- **Authentication provisioning** — key exchange is out-of-band in Phase 18B
- **Real-time subscriptions** — polling is sufficient for Phase 18B; WebSocket support is Phase 19+
- **Node-to-node communication** — nodes do not communicate with each other

---

## First Implementation — umkhandlu.unamifoundation.org

The first node to implement this contract is `umkhandlu.unamifoundation.org`.

It declares capabilities: `governance`, `participation`, `evidence`, `commercial`, `tcrs`, `institutional-memory`, `health`.

The Control Centre adapter for this node is built in Phase 18B. It is a single typed
client in `packages/api` that calls these endpoints and returns typed responses.

When a second node is onboarded, it implements the same contract. The Control Centre
requires no changes — it adds the new node to the registry and the existing adapter works.

That is the validation of the platform architecture.

---

## Evolution

This contract evolves through explicit versioning. Breaking changes increment the major
version. Additive changes increment the minor version.

No breaking change is made to a contract version that a deployed node implements.
Nodes are never forced to upgrade — the Control Centre supports multiple contract versions
simultaneously.

New capabilities are always optional. A node that does not implement a new capability
simply does not declare it. The Control Centre degrades gracefully.
