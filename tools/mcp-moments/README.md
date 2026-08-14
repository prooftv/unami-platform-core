# mcp-moments — Moments Context Agent

MCP server that persists Moments project state across Q CLI sessions.

Registered in Q CLI as `moments-agent` (`~/.aws/amazonq/mcp.json`).

## What it covers

- `apps/admin` — Moments admin (all 8 modules, full CRUD)
- `apps/web` — Moments public PWA (Phase 17A–17J complete)
- `supabase/` (root) — migrations 000–008, 12 Edge Functions
- Sanity project `g4t7r2a1` — editorial content layer

## Tools

| Tool | Purpose |
|---|---|
| `get_project_context` | Load full context — call at session start |
| `get_current_status` | Head commit, frozen state, ops gates, known issues |
| `get_project_id` | Returns `unami-platform-core/moments` |
| `record_progress` | Record a commit hash + message |
| `add_note` | Persist a session decision or blocker |
| `update_frozen_status` | Set frozen state |
| `mark_ops_gate_done` | Move an ops gate from remaining → completed |
| `add_remaining_item` | Add a new ops gate item |

## Current state

Phase 17J engineering complete. Frozen for ops gates (production deployment).
No new engineering work until ops checklist is signed off.
