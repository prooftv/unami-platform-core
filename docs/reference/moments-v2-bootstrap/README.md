# Moments v2 — Monorepo Bootstrap

**Unami Foundation Moments App — Complete Rebuild**

WhatsApp-native community engagement platform for South Africa.
Sponsored content distribution, MCP content intelligence, full admin dashboard.

## Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Admin Dashboard | Next.js 14 App Router + shadcn/ui |
| Public PWA | Next.js 14 App Router |
| API | Hono.js on Supabase Edge Functions |
| Database | Supabase (PostgreSQL) + Drizzle ORM |
| Auth | Supabase Auth (replaces custom sessions) |
| Automation | n8n workflows |
| WhatsApp | Meta Cloud API v19.0 |
| MCP/AI | Supabase SQL function + Claude API fallback |
| Storage | Supabase Storage (media bucket) |
| Hosting | Vercel (admin + web) + Supabase Edge (api) |

## Monorepo Structure

```
moments-v2/
├── apps/
│   ├── admin/          ← Next.js 14 admin dashboard (shadcn/ui)
│   ├── web/            ← Next.js 14 public PWA (moments feed)
│   └── api/            ← Hono.js API (deployed as Supabase Edge Function)
├── packages/
│   ├── types/          ← Shared TypeScript types (Moment, Sponsor, etc.)
│   ├── validators/     ← Shared Zod schemas
│   └── db/             ← Drizzle ORM schema + Supabase client
├── supabase/
│   ├── functions/      ← Edge functions (webhook, broadcast, mcp)
│   └── migrations/     ← Single clean migration
├── n8n/                ← Workflow JSON files
├── .github/workflows/  ← CI, deploy, migrate
└── turbo.json
```

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo> moments-v2
cd moments-v2
pnpm install

# 2. Environment setup
cp .env.example .env.local
# Fill in all values (see ENVIRONMENT.md)

# 3. Database setup
# Paste supabase/migrations/0001_initial.sql into Supabase SQL editor

# 4. Deploy Edge Functions
supabase functions deploy webhook
supabase functions deploy admin-api
supabase functions deploy broadcast-processor
supabase functions deploy mcp-advisory

# 5. Set Edge Function secrets
supabase secrets set --env-file .env.local

# 6. Start development
pnpm dev
```

## Apps

- Admin: `http://localhost:3001` (Next.js)
- Web PWA: `http://localhost:3000` (Next.js)
- API: Supabase Edge Functions

## Key Principles

1. **Frontend never calls Supabase directly** — all data via API layer
2. **Service role key never leaves the server** — API/Edge only
3. **All inputs validated with Zod** — shared schemas between frontend and API
4. **Fail-open on MCP/authority** — errors never block message processing
5. **Intent-based broadcasting** — moments → moment_intents → n8n → WhatsApp
