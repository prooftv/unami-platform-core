#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const CONTEXT_FILE = resolve(import.meta.dirname, "context.json");
const PROJECT_ID = "unami-platform-core";

function load() { return JSON.parse(readFileSync(CONTEXT_FILE, "utf8")); }
function save(ctx) { writeFileSync(CONTEXT_FILE, JSON.stringify(ctx, null, 2)); }

const server = new McpServer({ name: "mcp-unamiplatformcore", version: "1.0.0" });

server.tool("platform_get_project_context", "Load full platform context. Call at the start of every platform-level session.", {},
  async () => ({ content: [{ type: "text", text: JSON.stringify(load(), null, 2) }] })
);

server.tool("platform_get_project_id", "Returns the platform identifier.", {},
  async () => ({ content: [{ type: "text", text: PROJECT_ID }] })
);

server.tool("platform_get_onboarding_checklist", "Get the full checklist for onboarding a new app to the platform.", {},
  async () => {
    const ctx = load();
    return { content: [{ type: "text", text: JSON.stringify(ctx.onboarding_checklist, null, 2) }] };
  }
);

server.tool("platform_get_platform_rules", "Get the non-negotiable platform rules.", {},
  async () => {
    const ctx = load();
    return { content: [{ type: "text", text: JSON.stringify(ctx.platform_rules, null, 2) }] };
  }
);

server.tool("platform_get_registered_apps", "Get all registered apps, their agents, Supabase refs, and status.", {},
  async () => {
    const ctx = load();
    return { content: [{ type: "text", text: JSON.stringify(ctx.registered_apps, null, 2) }] };
  }
);

server.tool("platform_register_new_app",
  "Register a new application in the platform. Call when starting a new app onboarding.",
  {
    name: z.string().describe("App name e.g. beatschain"),
    path: z.string().describe("App path e.g. apps/beatschain"),
    domain: z.string().describe("What this app owns"),
    supabase_ref: z.string().optional().describe("Supabase project ref once created"),
    status: z.string().describe("e.g. 'Phase 20 — not started'"),
  },
  async ({ name, path, domain, supabase_ref, status }) => {
    const ctx = load();
    ctx.registered_apps[name] = { apps: [path], agent: `${name}-agent`, domain, supabase_ref: supabase_ref || "not yet created", status };
    save(ctx);
    return { content: [{ type: "text", text: `Registered: ${name}` }] };
  }
);

server.tool("platform_record_progress",
  "Record a completed platform milestone or commit.",
  {
    commit: z.string().describe("Short commit hash"),
    message: z.string().describe("Commit message or milestone description"),
    date: z.string().optional().describe("Date in YYYY-MM-DD format"),
  },
  async ({ commit, message, date }) => {
    const ctx = load();
    ctx.head_commit = commit;
    ctx.head_commit_msg = message;
    if (date) ctx.head_date = date;
    save(ctx);
    return { content: [{ type: "text", text: `Recorded: ${message} (${commit})` }] };
  }
);

server.tool("platform_add_note", "Add a platform session note.",
  { note: z.string() },
  async ({ note }) => {
    const ctx = load();
    ctx.notes.push(`[${new Date().toISOString()}] ${note}`);
    save(ctx);
    return { content: [{ type: "text", text: `Note saved: ${note}` }] };
  }
);

server.tool("platform_add_core_candidate",
  "Record a new Core Candidate pattern discovered in an application.",
  {
    pattern: z.string().describe("Description of the pattern"),
    discovered_in: z.string().describe("Which app it was discovered in"),
  },
  async ({ pattern, discovered_in }) => {
    const ctx = load();
    const entry = `${pattern} (discovered in ${discovered_in})`;
    ctx.core_candidates.candidates.push(entry);
    save(ctx);
    return { content: [{ type: "text", text: `Core Candidate recorded: ${entry}` }] };
  }
);

server.tool("platform_update_app_status",
  "Update the status of a registered app.",
  {
    name: z.string().describe("App name e.g. moments, uncip, umkhandlu"),
    status: z.string().describe("New status string"),
  },
  async ({ name, status }) => {
    const ctx = load();
    if (!ctx.registered_apps[name]) return { content: [{ type: "text", text: `App not found: ${name}` }] };
    ctx.registered_apps[name].status = status;
    save(ctx);
    return { content: [{ type: "text", text: `Updated ${name} status: ${status}` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
