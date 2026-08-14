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

// --- TOOLS ---

server.tool(
  "get_project_context",
  "Load full UNCIP project context. Call this at the start of every session.",
  {},
  async () => {
    const ctx = loadContext();
    return {
      content: [{ type: "text", text: JSON.stringify(ctx, null, 2) }],
    };
  }
);

server.tool(
  "get_current_status",
  "Get a concise summary of current project status: head commit, frozen state, remaining items.",
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
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
    };
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
    if (!ctx.completed_milestones.includes(entry)) {
      ctx.completed_milestones.push(entry);
    }
    saveContext(ctx);
    return {
      content: [{ type: "text", text: `Recorded: ${entry}` }],
    };
  }
);

server.tool(
  "add_note",
  "Add a session note — decisions made, blockers, things to remember next session.",
  {
    note: z.string().describe("The note to persist"),
  },
  async ({ note }) => {
    const ctx = loadContext();
    const timestamp = new Date().toISOString();
    ctx.notes.push(`[${timestamp}] ${note}`);
    saveContext(ctx);
    return {
      content: [{ type: "text", text: `Note saved: ${note}` }],
    };
  }
);

server.tool(
  "update_frozen_status",
  "Update what the project is frozen for, or clear the frozen state.",
  {
    status: z.string().describe("e.g. 'manual testing', 'pilot rehearsal', or 'active development'"),
  },
  async ({ status }) => {
    const ctx = loadContext();
    ctx.frozen_for = status;
    saveContext(ctx);
    return {
      content: [{ type: "text", text: `Frozen status updated to: ${status}` }],
    };
  }
);

server.tool(
  "mark_remaining_item_done",
  "Mark an item from remaining_before_pilot as complete and move it to completed_milestones.",
  {
    item: z.string().describe("Exact text of the remaining item to mark done"),
  },
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
    return {
      content: [{ type: "text", text: `Marked done: ${item}` }],
    };
  }
);

server.tool(
  "add_remaining_item",
  "Add a new item to remaining_before_pilot.",
  {
    item: z.string().describe("Description of the remaining item"),
  },
  async ({ item }) => {
    const ctx = loadContext();
    ctx.remaining_before_pilot.push(item);
    saveContext(ctx);
    return {
      content: [{ type: "text", text: `Added to remaining: ${item}` }],
    };
  }
);

server.tool(
  "get_project_id",
  "Returns the project identifier. Use to confirm you are in the correct project context before making changes.",
  {},
  async () => {
    return {
      content: [{ type: "text", text: PROJECT_ID }],
    };
  }
);

// --- START ---
const transport = new StdioServerTransport();
await server.connect(transport);
