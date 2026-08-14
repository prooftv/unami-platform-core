# mcp-umkhandlu — Umkhandlu Control Centre Context Agent

MCP server that persists Umkhandlu project state across Q CLI sessions.

Registered in Q CLI as `umkhandlu-agent` (`~/.aws/amazonq/mcp.json`).

## What it covers

- `apps/umkhandlu` — Unami Control Centre (Phase 18A–18G complete)
- Read-only intelligence aggregation across governance nodes
- Node registry, health views, cross-node aggregation, commercial intelligence

## Tools

| Tool | Purpose |
|---|---|
| `get_project_context` | Load full context — call at session start |
| `get_current_status` | Head commit, frozen state, live routes, next phase |
| `get_project_id` | Returns `unami-platform-core/umkhandlu` |
| `record_progress` | Record a commit hash + message |
| `add_note` | Persist a session decision or blocker |
| `update_frozen_status` | Set frozen state |
| `add_governance_node` | Register a new governance node in context |

## Current state

Phase 18 complete (18A–18G + settings + shell parity). Frozen as stable baseline.
Next: Phase 20 multi-node federation (additional governance nodes). Not started.

## Critical rule

D-036: The Control Centre NEVER edits, mutates, creates, or administers node content.
All write operations remain within the originating governance node.
