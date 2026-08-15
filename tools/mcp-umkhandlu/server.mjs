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

// ─── Participation Intelligence ───────────────────────────────────────────────
// Reads anonymised participation intelligence from the Control Centre's own
// participation_signals table (ufsmpqxniswdnsywjzje).
// Credentials come exclusively from runtime environment — never from source.

server.tool(
  "umkhandlu_get_participation_intelligence",
  "Return anonymised participation intelligence from the Control Centre participation_signals table. Optionally scope to a specific Record/Notice by sanityId. Without sanityId, returns platform-wide aggregate.",
  {
    sanityId: z.string().optional().describe("Sanity document ID of a specific Record or Notice. Omit for platform-wide aggregate."),
  },
  async ({ sanityId }) => {
    const url = process.env.UMKHANDLU_SUPABASE_URL;
    const key = process.env.UMKHANDLU_SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return { content: [{ type: "text", text: JSON.stringify({ error: "Supabase credentials not configured in MCP environment." }) }] };
    }

    const params = new URLSearchParams({ select: "node_id,sanity_id,response_count,by_type,by_relationship,last_submission" });
    if (sanityId) params.set("sanity_id", `eq.${sanityId}`);

    const res = await fetch(`${url}/rest/v1/participation_signals?${params}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return { content: [{ type: "text", text: JSON.stringify({ error: `Supabase query failed: ${res.status}` }) }] };
    }

    const rows = await res.json();

    if (!rows.length) {
      return { content: [{ type: "text", text: JSON.stringify({ total: 0, byType: {}, byRelationship: {}, lastSubmission: null, rowCount: 0 }) }] };
    }

    const byType = { comment: 0, support: 0, objection: 0, question: 0 };
    const byRelationship = { resident: 0, landowner: 0, business: 0, community: 0, organisation: 0, other: 0 };
    let total = 0;
    let lastSubmission = null;

    for (const row of rows) {
      total += row.response_count ?? 0;
      for (const k of Object.keys(byType)) byType[k] += (row.by_type?.[k] ?? 0);
      for (const k of Object.keys(byRelationship)) byRelationship[k] += (row.by_relationship?.[k] ?? 0);
      if (row.last_submission && (!lastSubmission || row.last_submission > lastSubmission)) {
        lastSubmission = row.last_submission;
      }
    }

    const result = { total, byType, byRelationship, lastSubmission, rowCount: rows.length };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
