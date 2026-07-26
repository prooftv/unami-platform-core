# Rebuild Checklist — Amazon Q Agent Instructions

This file is the master prompt for Amazon Q to build the entire system from scratch.
Read ALL docs in /docs before writing any code.

---

## Reading Order (do this first)

1. README.md — overview and stack
2. docs/ARCHITECTURE.md — system design and data flows
3. docs/FEATURES.md — every feature to implement
4. docs/DATA_MODELS.md — every table and field
5. docs/API_CONTRACTS.md — every endpoint with request/response
6. docs/DECISIONS.md — why things are built the way they are
7. docs/ADMIN_DASHBOARD_SPEC.md — every admin UI module
8. docs/WHATSAPP_GUIDE.md — WhatsApp integration details
9. docs/N8N_GUIDE.md — n8n workflow details
10. docs/SUPABASE_SETUP.md — database and Edge Function setup
11. docs/SECURITY.md — security requirements
12. docs/ENVIRONMENT.md — all environment variables
13. docs/MONOREPO_SETUP.md — how to scaffold the project

---

## Build Order

### Phase 1 — Foundation
1. Scaffold Turborepo monorepo (follow docs/MONOREPO_SETUP.md exactly)
2. Create packages/types with all TypeScript types from docs/DATA_MODELS.md
3. Create packages/validators with all Zod schemas from docs/API_CONTRACTS.md
4. Create packages/db with Supabase client setup
5. Write supabase/migrations/0001_initial.sql from docs/DATA_MODELS.md

### Phase 2 — Backend (Supabase Edge Functions)
6. supabase/functions/webhook/index.ts — full WhatsApp webhook (docs/WHATSAPP_GUIDE.md)
7. supabase/functions/admin-api/index.ts — all admin endpoints (docs/API_CONTRACTS.md)
8. supabase/functions/broadcast-processor/index.ts — intent processing
9. supabase/functions/mcp-advisory/index.ts — content analysis

### Phase 3 — Admin Dashboard (apps/admin)
10. Auth pages: /login, /auth/callback
11. Layout: sidebar, header, role-based nav
12. Module 2: Dashboard overview with stats + charts
13. Module 3: Moments management (list, create, edit, broadcast)
14. Module 4: Campaigns (list, create, approve, publish, A/B tests)
15. Module 5: Sponsors (cards, create, edit, budget)
16. Module 6: Moderation (queue, MCP scores, approve/flag/reject)
17. Module 7: Subscribers (list, stats, export)
18. Module 8: Broadcasts (history, intent queue, retry)
19. Module 9: Authority management
20. Module 10: Settings (system config, admin users, RBAC, budget)

### Phase 4 — Public PWA (apps/web)
21. Landing page with stats
22. Moments feed with filters
23. Moment detail page
24. Unsubscribe page
25. Privacy and Terms pages

### Phase 5 — Automation
26. n8n/intent-executor-workflow.json
27. n8n/scheduled-broadcasts-workflow.json
28. n8n/digest-workflow.json
29. n8n/retry-workflow.json

### Phase 6 — DevOps
30. .github/workflows/ci.yml
31. .github/workflows/deploy.yml
32. .github/workflows/migrate.yml
33. vercel.json for both apps

---

## Non-Negotiable Rules

### Security
- NEVER put SUPABASE_SERVICE_ROLE_KEY in any frontend file
- NEVER put WHATSAPP_TOKEN in any frontend file
- NEVER use `'Access-Control-Allow-Origin': '*'` — restrict to known domains
- ALWAYS validate inputs with Zod before any database operation
- ALWAYS verify HMAC signature on webhook requests
- ALWAYS check user role before any admin operation

### Architecture
- Frontend (apps/admin, apps/web) NEVER calls Supabase directly
- Frontend ONLY calls the admin-api Edge Function via fetch()
- All business logic lives in Edge Functions
- Shared types and validators imported from packages/

### Code Quality
- TypeScript strict mode everywhere
- No `any` types — use proper types from packages/types
- No inline SQL — use Supabase client methods
- Error responses always: `{ "error": "message" }` format
- Success responses always include the resource: `{ "moment": {...} }`

### Admin Dashboard
- Use shadcn/ui components exclusively — no custom UI primitives
- All data fetched via SWR with proper loading/error states
- Skeleton loaders for tables (not spinners)
- Toast notifications for all user actions
- All forms use React Hook Form + Zod resolver
- Role-based rendering: hide UI elements user cannot access

### WhatsApp
- Immediate opt-out on STOP (no confirmation step)
- Fail-open on all external calls (authority, MCP, n8n)
- Dedup all messages by whatsapp_id before processing
- Interactive buttons/lists preferred over plain text menus
- Always include "Reply STOP to unsubscribe" in broadcasts

---

## Key Patterns to Follow

### API Handler Pattern (Hono)
```typescript
app.post('/moments', authMiddleware, rbacMiddleware(['content_admin', 'superadmin']), async (c) => {
  const body = await c.req.json()
  const result = CreateMomentSchema.safeParse(body)
  if (!result.success) return c.json({ error: 'Validation failed', details: result.error.flatten() }, 400)
  
  const { data, error } = await supabase.from('moments').insert(result.data).select().single()
  if (error) return c.json({ error: error.message }, 500)
  
  return c.json({ moment: data }, 201)
})
```

### Frontend Data Fetching Pattern (SWR)
```typescript
// In admin app — never call Supabase directly
const { data, error, isLoading } = useSWR('/moments', (url) =>
  fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  }).then(r => r.json())
)
```

### Intent Creation Pattern
```typescript
// After creating/broadcasting a moment, always create intents
await supabase.from('moment_intents').upsert([
  { moment_id: id, channel: 'pwa', action: 'publish', status: 'pending', payload: {...} },
  { moment_id: id, channel: 'whatsapp', action: 'publish', status: 'pending', payload: {...} }
], { onConflict: 'moment_id,channel', ignoreDuplicates: true })
```

### Authority Fail-Open Pattern
```typescript
let authorityContext = null
try {
  const { data } = await supabase.rpc('lookup_authority', { p_user_identifier: phoneNumber })
  authorityContext = data?.[0] || null
} catch {
  // Fail-open: continue without authority context
}
```

---

## What NOT to Build

- No custom session token system (use Supabase Auth)
- No Express.js server (use Hono on Edge Functions)
- No raw HTML/CSS/JS admin dashboard (use Next.js + shadcn)
- No direct Supabase calls from frontend components
- No hardcoded credentials anywhere
- No wildcard CORS
- No 30+ SQL migration files (one clean schema file)
- No 150+ markdown files at root level (docs/ folder only)
- No test scripts scattered at root level (tests/ folder only)
- No deploy scripts at root level (.github/workflows/ only)

---

## Reference: Original System Location
The original system is at /workspaces/moments for reference.
Key files to study if needed:
- src/webhook.js — WhatsApp command handling logic
- src/broadcast.js — authority-based broadcast filtering
- src/authority.js — authority cache and lookup
- supabase/functions/webhook/index.ts — interactive buttons implementation
- supabase/functions/admin-api/index.ts — all existing endpoints
- supabase/CLEAN_SCHEMA.sql — database schema reference
- n8n/intent-executor-workflow.json — n8n workflow structure
