#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const CONTEXT_FILE = resolve(import.meta.dirname, "context.json");
const PROJECT_ID = "unami-platform-core/moments";

function loadContext() {
  return JSON.parse(readFileSync(CONTEXT_FILE, "utf8"));
}

function saveContext(ctx) {
  writeFileSync(CONTEXT_FILE, JSON.stringify(ctx, null, 2));
}

const server = new McpServer({
  name: "mcp-moments",
  version: "1.0.0",
});

server.tool(
  "get_project_context",
  "Load full Moments project context. Call this at the start of every session.",
  {},
  async () => {
    const ctx = loadContext();
    return { content: [{ type: "text", text: JSON.stringify(ctx, null, 2) }] };
  }
);

server.tool(
  "get_current_status",
  "Get a concise summary: head commit, frozen state, remaining ops gates, known issues.",
  {},
  async () => {
    const ctx = loadContext();
    const summary = {
      project: ctx.project,
      head_commit: ctx.head_commit,
      head_commit_msg: ctx.head_commit_msg,
      head_date: ctx.head_date,
      frozen_for: ctx.frozen_for,
      phase_17_status: ctx.phase_17_status,
      remaining_ops_gates: ctx.remaining_ops_gates,
      known_issues: ctx.known_issues,
      notes: ctx.notes,
    };
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

server.tool(
  "get_project_id",
  "Returns the project identifier. Use to confirm correct context before making changes.",
  {},
  async () => {
    return { content: [{ type: "text", text: PROJECT_ID }] };
  }
);

server.tool(
  "record_progress",
  "Record a completed milestone or commit. Updates head_commit and adds to completed_milestones.",
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
  "add_note",
  "Add a session note — decisions made, blockers, things to remember next session.",
  { note: z.string().describe("The note to persist") },
  async ({ note }) => {
    const ctx = loadContext();
    ctx.notes.push(`[${new Date().toISOString()}] ${note}`);
    saveContext(ctx);
    return { content: [{ type: "text", text: `Note saved: ${note}` }] };
  }
);

server.tool(
  "update_frozen_status",
  "Update what the project is frozen for, or clear the frozen state.",
  { status: z.string().describe("e.g. 'ops gates', 'active development'") },
  async ({ status }) => {
    const ctx = loadContext();
    ctx.frozen_for = status;
    saveContext(ctx);
    return { content: [{ type: "text", text: `Frozen status updated to: ${status}` }] };
  }
);

server.tool(
  "mark_ops_gate_done",
  "Mark an ops gate item as complete.",
  { item: z.string().describe("Exact text of the ops gate to mark done") },
  async ({ item }) => {
    const ctx = loadContext();
    const idx = ctx.remaining_ops_gates.indexOf(item);
    if (idx === -1) {
      return { content: [{ type: "text", text: `Item not found: "${item}". Current gates: ${JSON.stringify(ctx.remaining_ops_gates)}` }] };
    }
    ctx.remaining_ops_gates.splice(idx, 1);
    ctx.completed_milestones.push(`OPS: ${item}`);
    saveContext(ctx);
    return { content: [{ type: "text", text: `Ops gate done: ${item}` }] };
  }
);

server.tool(
  "add_remaining_item",
  "Add a new item to remaining_ops_gates.",
  { item: z.string().describe("Description of the ops gate or remaining item") },
  async ({ item }) => {
    const ctx = loadContext();
    ctx.remaining_ops_gates.push(item);
    saveContext(ctx);
    return { content: [{ type: "text", text: `Added to remaining: ${item}` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
