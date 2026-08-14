#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const CONTEXT_FILE = resolve(import.meta.dirname, "context.json");
const PROJECT_ID = "unami-platform-core/umkhandlu";

function loadContext() {
  return JSON.parse(readFileSync(CONTEXT_FILE, "utf8"));
}

function saveContext(ctx) {
  writeFileSync(CONTEXT_FILE, JSON.stringify(ctx, null, 2));
}

const server = new McpServer({
  name: "mcp-umkhandlu",
  version: "1.0.0",
});

server.tool(
  "umkhandlu_get_project_context",
  "Load full Umkhandlu Control Centre context. Call this at the start of every Umkhandlu session.",
  {},
  async () => {
    const ctx = loadContext();
    return { content: [{ type: "text", text: JSON.stringify(ctx, null, 2) }] };
  }
);

server.tool(
  "umkhandlu_get_current_status",
  "Get a concise Umkhandlu summary: head commit, frozen state, live routes, next phase.",
  {},
  async () => {
    const ctx = loadContext();
    const summary = {
      project: ctx.project,
      head_commit: ctx.head_commit,
      head_commit_msg: ctx.head_commit_msg,
      head_date: ctx.head_date,
      frozen_for: ctx.frozen_for,
      live_routes: ctx.live_routes,
      next_phase: ctx.next_phase,
      notes: ctx.notes,
    };
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

server.tool(
  "umkhandlu_get_project_id",
  "Returns the Umkhandlu project identifier.",
  {},
  async () => {
    return { content: [{ type: "text", text: PROJECT_ID }] };
  }
);

server.tool(
  "umkhandlu_record_progress",
  "Record a completed Umkhandlu milestone or commit.",
  {
    commit: z.string().describe("Short commit hash"),
    message: z.string().describe("Commit message or milestone description"),
    date: z.string().optional().describe("Date in YYYY-MM-DD format"),
  },
  async ({ commit, message, date }) => {
    const ctx = loadContext();
    ctx.head_commit = commit;
    ctx.head_commit_msg = message;
    if (date) ctx.head_date = date;
    const entry = `${message} (${commit})`;
    if (!ctx.completed_milestones.includes(entry)) ctx.completed_milestones.push(entry);
    saveContext(ctx);
    return { content: [{ type: "text", text: `Recorded: ${entry}` }] };
  }
);

server.tool(
  "umkhandlu_add_note",
  "Add an Umkhandlu session note.",
  { note: z.string().describe("The note to persist") },
  async ({ note }) => {
    const ctx = loadContext();
    ctx.notes.push(`[${new Date().toISOString()}] ${note}`);
    saveContext(ctx);
    return { content: [{ type: "text", text: `Note saved: ${note}` }] };
  }
);

server.tool(
  "umkhandlu_update_frozen_status",
  "Update what Umkhandlu is frozen for, or clear the frozen state.",
  { status: z.string().describe("e.g. 'stable', 'active development'") },
  async ({ status }) => {
    const ctx = loadContext();
    ctx.frozen_for = status;
    saveContext(ctx);
    return { content: [{ type: "text", text: `Frozen status updated to: ${status}` }] };
  }
);

server.tool(
  "umkhandlu_add_governance_node",
  "Register a new governance node in the Umkhandlu context.",
  {
    name: z.string().describe("Node hostname or identifier"),
    role: z.string().describe("Description of this node's role"),
    note: z.string().optional().describe("Additional notes"),
  },
  async ({ name, role, note }) => {
    const ctx = loadContext();
    const node = { name, role, auth: "node-issued Bearer key (read-only)", note: note || "" };
    ctx.governance_nodes.push(node);
    saveContext(ctx);
    return { content: [{ type: "text", text: `Node registered: ${name}` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
