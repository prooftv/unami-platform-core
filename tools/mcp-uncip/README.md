# mcp-uncip — UNCIP Context Agent

MCP server that persists UNCIP project state across Q CLI sessions.

Registered in Q CLI as `uncip-agent` (`~/.aws/amazonq/mcp.json`).

## What it does

Maintains a live `context.json` with:
- Current head commit and date
- Frozen/active status
- Remaining items before pilot
- Completed milestones
- Session notes
- Full monorepo and platform context

## Tools

| Tool | Purpose |
|---|---|
| `get_project_context` | Load full context — call at session start |
| `get_current_status` | Quick summary: head commit, frozen state, remaining items |
| `get_project_id` | Returns `unami-platform-core/uncip` — use to confirm correct context |
| `record_progress` | Record a commit hash + message, updates head |
| `add_note` | Persist a session decision or blocker |
| `update_frozen_status` | Set frozen state (e.g. `manual testing`, `active development`) |
| `mark_remaining_item_done` | Move an item from remaining → completed |
| `add_remaining_item` | Add a new item to remaining_before_pilot |

## Session workflow

```
1. q chat
2. Call get_project_context → loads full state
3. Do work
4. git commit
5. Call record_progress with commit hash
6. Call add_note for any decisions made
```

## Location

```
tools/mcp-uncip/
├── server.mjs      — MCP server (stdio transport)
├── context.json    — persisted project state
├── package.json
└── .gitignore      — excludes node_modules
```

This tool is UNCIP-specific. It does not serve Moments, Umkhandlu, or any other app.
