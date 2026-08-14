#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const CONTEXT_FILE = resolve(import.meta.dirname, "context.json");
const PROJECT_ID = "unami-platform-core/uncip";

function loadContext() {
  return JSON.parse(readFileSync(CONTEXT_FILE, "utf8"));
}

function saveContext(ctx) {
  writeFileSync(CONTEXT_FILE, JSON.stringify(ctx, null, 2));
}

const server = new McpServer({
  name: "mcp-uncip",
  version: "1.0.0",
});

server.tool(
  "uncip_get_project_context",
  "Load full UNCIP project context. Call this at the start of every UNCIP session.",
  {},
  async () => {
    const ctx = loadContext();
    return { content: [{ type: "text", text: JSON.stringify(ctx, null, 2) }] };
  }
);

server.tool(
  "uncip_get_current_status",
  "Get a concise summary of UNCIP current project status: head commit, frozen state, remaining items.",
  {},
  async () => {
    const ctx = loadContext();
    const summary = {
      project: ctx.project,
      head_commit: ctx.head_commit,
      head_commit_msg: ctx.head_commit_msg,
      head_date: ctx.head_date,
      frozen_for: ctx.frozen_for,
      pilot_workflow_status: ctx.pilot_workflow_status,
      remaining_before_pilot: ctx.remaining_before_pilot,
      notes: ctx.notes,
    };
    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

server.tool(
  "uncip_record_progress",
  "Record a completed UNCIP milestone or commit.",
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
    if (!ctx.completed_milestones.includes(entry)) {
      ctx.completed_milestones.push(entry);
    }
    saveContext(ctx);
    return { content: [{ type: "text", text: `Recorded: ${entry}` }] };
  }
);

server.tool(
  "uncip_add_note",
  "Add a UNCIP session note.",
  { note: z.string().describe("The note to persist") },
  async ({ note }) => {
    const ctx = loadContext();
    const timestamp = new Date().toISOString();
    ctx.notes.push(`[${timestamp}] ${note}`);
    saveContext(ctx);
    return { content: [{ type: "text", text: `Note saved: ${note}` }] };
  }
);

server.tool(
  "uncip_update_frozen_status",
  "Update what UNCIP is frozen for, or clear the frozen state.",
  { status: z.string().describe("e.g. 'manual testing', 'pilot rehearsal', or 'active development'") },
  async ({ status }) => {
    const ctx = loadContext();
    ctx.frozen_for = status;
    saveContext(ctx);
    return { content: [{ type: "text", text: `Frozen status updated to: ${status}` }] };
  }
);

server.tool(
  "uncip_mark_remaining_item_done",
  "Mark a UNCIP item from remaining_before_pilot as complete.",
  { item: z.string().describe("Exact text of the remaining item to mark done") },
  async ({ item }) => {
    const ctx = loadContext();
    const idx = ctx.remaining_before_pilot.indexOf(item);
    if (idx === -1) {
      return {
        content: [{ type: "text", text: `Item not found: "${item}". Current items: ${JSON.stringify(ctx.remaining_before_pilot)}` }],
      };
    }
    ctx.remaining_before_pilot.splice(idx, 1);
    ctx.completed_milestones.push(item);
    saveContext(ctx);
    return { content: [{ type: "text", text: `Marked done: ${item}` }] };
  }
);

server.tool(
  "uncip_add_remaining_item",
  "Add a new item to UNCIP remaining_before_pilot.",
  { item: z.string().describe("Description of the remaining item") },
  async ({ item }) => {
    const ctx = loadContext();
    ctx.remaining_before_pilot.push(item);
    saveContext(ctx);
    return { content: [{ type: "text", text: `Added to remaining: ${item}` }] };
  }
);

server.tool(
  "uncip_get_project_id",
  "Returns the UNCIP project identifier.",
  {},
  async () => {
    return { content: [{ type: "text", text: PROJECT_ID }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
