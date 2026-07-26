# Moments v2 — Engineering Playbook
**Unami Foundation · WhatsApp Community Platform · South Africa**

> This is the single source of truth for the Moments v2 rebuild. It captures the product vision, architecture decisions, data model, system behaviour, and engineering philosophy in one document. Use this to onboard AI assistants, brief engineers, or resume work after any gap.

---

## 1. What This Product Is

Moments is a **100% WhatsApp-native community broadcast platform** for South African communities. It has no mobile app, no login screen for end users — just WhatsApp.

Admins create "Moments" (short community content pieces), attach sponsors, target regions, and broadcast them to opted-in subscribers via the WhatsApp Business API. An MCP (content intelligence) layer analyses every inbound message for harm, spam, and urgency. An authority system lets trusted community figures (chiefs, ward councillors, NGO leads) have their messages amplified with appropriate blast radius caps.

**What it is NOT**: a chat platform, a two-way conversation tool, or a social network. Broadcasts go out. Replies are not processed for conversation — only for commands (START, STOP, HELP, etc).

---

## 2. The Problem with v1

| Issue | Impact |
|---|---|
| Hardcoded password `Proof321#` in Edge Function | Critical security vulnerability |
| Wildcard CORS `*` on admin API | Any origin can call admin endpoints |
| Service role key exposed to frontend | Full DB bypass possible |
| Custom session tokens (random strings) | No expiry, no revocation, no standard |
| 150+ MD files at repo root | Unmaintainable, no structure |
| Admin dashboard: raw HTML/CSS in one file | No component reuse, hard to extend |
| Frontend calling Supabase directly | Backend logic leaks to client |
| No input validation (Zod) | Injection and type errors in prod |
| No separation of concerns | Business logic mixed with HTTP handlers |

v2 fixes all of these. Every decision below is made with these failures in mind.

---

## 3. Stack Decisions (and Why)

### Monorepo: Turborepo
One repo, multiple apps, shared packages. Turborepo gives us incremental builds and task caching without the complexity of Nx. All apps share types, validation schemas, and utilities from `packages/`.

### Admin Dashboard: Next.js 14 + shadcn/ui
- App Router for layouts and server components
- shadcn/ui for accessible, unstyled-by-default components (no fighting a design system)
- Tailwind for utility styling
- React Query for server state (not SWR — better devtools, mutation support)
- Supabase Auth for session management (replaces custom tokens)

### Web PWA: Next.js 14
Public-facing subscriber info page. Minimal. No auth. Static where possible.

### API Layer: Hono on Supabase Edge Functions
- Hono is lightweight, Deno-compatible, has middleware support
- All admin and webhook logic lives here
- Frontend NEVER calls Supabase directly — always through this API
- Service role key never leaves Edge Functions

### Database ORM: Drizzle
- Type-safe SQL, not an ORM abstraction
- Schema-as-code, migrations tracked in repo
- Works well with Supabase Postgres

### Auth: Supabase Auth
- JWT-based, standard, revocable
- Admin users only (subscribers have no account — just a phone number)
- RBAC via custom claims in JWT

### Automation: n8n (self-hosted or cloud)
- Handles the intent execution loop (moments → WhatsApp delivery)
- Cron-based, retryable, observable
- Not replaced — improved

---

## 4. Monorepo Structure

```
moments-v2/
├── apps/
│   ├── admin/          # Next.js 14 admin dashboard
│   ├── web/            # Next.js 14 public PWA
│   └── api/            # Supabase Edge Functions (Hono)
├── packages/
│   ├── types/          # Shared TypeScript types and enums
│   ├── validators/     # Zod schemas (shared between API and frontend)
│   ├── utils/          # Shared pure utilities
│   └── db/             # Drizzle schema + migrations
├── supabase/
│   ├── migrations/     # SQL migration files
│   └── functions/      # Edge function source (symlinked from apps/api)
├── n8n/
│   └── workflows/      # Exported n8n workflow JSON files
├── docs/               # Detailed reference docs
├── turbo.json
├── package.json
└── .env.example
```

---

## 5. Core Data Model

### Key Design Principles
- Phone numbers are the user identity — no accounts for subscribers
- All content is a "Moment" — the atomic unit of the platform
- Broadcasts are logged separately from Moments (one Moment → many Broadcasts)
- Intents decouple creation from delivery (moments → intents → n8n → WhatsApp)
- Authority is a separate layer — it enriches but doesn't replace the core model

### Tables (abbreviated — see DATA_MODELS.md for full schema)

**`moments`** — the content unit
```
id, title, content, region, category, status, sponsor_id,
is_urgent, scheduled_at, created_by, authority_id,
blast_radius_cap, created_at, updated_at
```
Status flow: `draft → scheduled → broadcasting → sent | failed`

**`sponsors`**
```
id, name, contact_name, contact_email, contact_phone,
website, is_active, created_at
```

**`subscriptions`** — one row per phone number
```
id, phone_number, region, status (active|inactive|blocked),
opted_in_at, opted_out_at, language_preference
```

**`moment_intents`** — the delivery queue
```
id, moment_id, phone_number, status (pending|sent|failed|skipped),
scheduled_at, sent_at, error_message, retry_count, created_at
```

**`broadcasts`** — delivery log (populated after send)
```
id, moment_id, total_recipients, sent_count, failed_count,
started_at, completed_at, triggered_by
```

**`messages`** — inbound WhatsApp messages
```
id, phone_number, message_id, type, content, media_url,
timestamp, processed, created_at
```

**`advisories`** — MCP output per message
```
id, message_id, harm_score, spam_score, urgency_level,
language_detected, flags, confidence, raw_output, created_at
```

**`authority_profiles`**
```
id, name, phone_number, role, region, scope, level (1-5),
blast_radius_cap, is_active, verified_at, created_at
```

**`flags`** — trust and safety markers
```
id, message_id, flag_type, severity, resolved, resolved_by,
resolved_at, notes, created_at
```

**`admin_users`** — managed by Supabase Auth
```
id (uuid, FK to auth.users), email, role (super_admin|admin|moderator),
created_at
```

---

## 6. System Architecture & Data Flows

### Inbound Message Flow
```
WhatsApp → POST /webhook → HMAC verify → parse message type
  → if command (START/STOP/HELP/REGIONS/STATUS/AUTHORITY):
      → execute command → send reply
  → if content message:
      → store in messages table
      → call mcp_advisory() SQL function
      → store advisory
      → if harm_score > 0.7 or spam_score > 0.8: create flag
      → if authority sender: enrich context
```

### Outbound Broadcast Flow
```
Admin creates Moment (status: draft)
  → Admin schedules or triggers broadcast
  → API creates moment_intents rows (one per matching subscriber)
  → n8n cron (every 1min) picks up pending intents
  → n8n fetches subscriber details
  → n8n renders message from template
  → n8n calls WhatsApp API
  → n8n marks intent sent/failed
  → API aggregates into broadcasts row
```

### Urgent Moment Flow
```
Moment created with is_urgent=true
  → Bypass normal scheduler
  → Server cron (every 2min) picks up urgent pending moments
  → Immediate intent creation and dispatch
  → Authority blast_radius_cap enforced before intent creation
```

### Weekly Digest Flow
```
Sunday 9AM SAST cron
  → Fetch all sent moments from past 7 days
  → Group by region
  → Render digest template per region
  → Create intents for all active subscribers in each region
  → Dispatch via n8n
```

---

## 7. Authority System

The authority system is a **dynamic enrichment layer** — it does not replace the core broadcast system, it adds context and controls to it.

### Hierarchy (level 1 = highest)
1. National authority (e.g. national NGO director)
2. Provincial authority (e.g. provincial coordinator)
3. District authority (e.g. district councillor)
4. Local authority (e.g. ward councillor, chief)
5. Community figure (e.g. school principal, clinic sister)

### Key Rules
- **Fail-open**: if authority lookup fails, message is still processed normally
- **Blast radius cap**: each authority level has a max recipient count per broadcast
- **Scope filtering**: authority's region scope is enforced — a ward councillor cannot broadcast to a province
- **In-memory cache**: 5-minute TTL, reduces DB load, acceptable staleness for this use case
- **Verification**: authorities must be verified by a super_admin before their elevated permissions activate

### Blast Radius Caps (defaults)
| Level | Cap |
|---|---|
| 1 (National) | Unlimited |
| 2 (Provincial) | 50,000 |
| 3 (District) | 10,000 |
| 4 (Local) | 2,000 |
| 5 (Community) | 500 |

These are soft caps — super_admin can override per authority profile.

---

## 8. MCP Content Intelligence

MCP (Moderation/Content Processing) is the advisory layer that analyses every inbound message. It is **advisory-only** — it never blocks content automatically.

### Philosophy: Log Everything, Block Nothing
Human moderators make final decisions. MCP provides scored signals. This is intentional — South African community content is highly contextual, multilingual, and culturally specific. Automated blocking would cause false positives that erode community trust.

### What MCP Analyses
- **Harm score** (0.0–1.0): violence, harassment, threats, hate speech
- **Spam score** (0.0–1.0): repetition, unsolicited commercial content, scam patterns
- **Urgency level**: `low | medium | high | critical`
- **Language detected**: en, zu, xh, af, st, tn, ts, ve, nr, ss, nso (all 11 official SA languages)
- **Flags**: array of specific signal types triggered

### Escalation Thresholds
- harm_score > 0.7 → create flag, surface in moderation queue
- spam_score > 0.8 → create flag
- urgency = critical → surface in urgent queue regardless of harm/spam

### Implementation
- Primary: `mcp_advisory()` SQL function in Supabase (regex + pattern matching)
- Secondary: Claude API (when available) for nuanced analysis
- Fallback: safe defaults (all scores 0, urgency low) — never fails hard

---

## 9. WhatsApp Integration

### Phone Number
+27 65 829 5041 (WhatsApp Business API)

### Webhook Security
- HMAC-SHA256 signature verification on every inbound POST
- Verify token for GET webhook registration
- Both enforced — no bypass

### User Commands (inbound)
| Command | Action |
|---|---|
| `START` / `JOIN` | Opt in to broadcasts, set region if provided |
| `STOP` / `UNSUBSCRIBE` | Opt out immediately |
| `HELP` | Send help menu |
| `REGIONS` | List available regions |
| `STATUS` | Show subscription status |
| `AUTHORITY` | Show authority info for sender (if applicable) |

### Broadcast Message Format
```
📢 [Sponsored] Moment — {REGION}

{CONTENT}

📍 {LOCATION_DETAIL}
🌱 {CATEGORY_DETAIL}

Brought to you by {SPONSOR_NAME}
🌐 More info: /moments?province={REGION}
```

Non-sponsored format omits the `[Sponsored]` label and sponsor line.

### Interactive Elements
- List messages for region selection during onboarding
- Button replies for opt-in confirmation
- All button/list IDs are namespaced: `moments_confirm_optin`, `moments_region_kzn`, etc.

### Template Messages
WhatsApp requires pre-approved templates for outbound messages to users who haven't messaged in 24h. All broadcast templates must be submitted and approved in Meta Business Manager before use.

---

## 10. Admin Dashboard — Module Map

The admin dashboard is a Next.js 14 app with Supabase Auth. All data fetched via the API layer — never direct Supabase calls from the browser.

### Modules
1. **Dashboard** — analytics overview, recent activity, system health
2. **Moments** — CRUD, scheduling, broadcast trigger, status tracking
3. **Broadcasts** — delivery logs, success rates, per-moment analytics
4. **Subscribers** — list, filter by region/status, manual opt-out
5. **Sponsors** — CRUD sponsor profiles, link to moments
6. **Moderation** — flagged content queue, advisory scores, resolve/escalate
7. **Authority Profiles** — CRUD, verification, blast radius config
8. **Campaigns** — group moments into campaigns, campaign analytics
9. **Settings** — admin user management, RBAC, system config
10. **Audit Log** — immutable log of all admin actions

### RBAC Roles
| Role | Permissions |
|---|---|
| `super_admin` | Everything including user management and authority verification |
| `admin` | All content operations, no user management |
| `moderator` | Moderation queue only, read-only elsewhere |

### UI Principles
- shadcn/ui components throughout — no custom component library
- Dark mode support via Tailwind dark: classes
- Mobile-responsive (admins may use phones)
- Optimistic updates with React Query mutations
- Toast notifications for all async actions
- Confirmation dialogs for destructive actions (broadcast, delete)

---

## 11. n8n Automation

n8n handles the async delivery loop. It is the only system that calls the WhatsApp API for outbound messages (except urgent broadcasts which can bypass via server cron).

### Core Workflow: Intent Executor
- Trigger: Cron every 1 minute
- Fetch: `moment_intents` where `status = pending` and `scheduled_at <= now()`
- For each intent: fetch subscriber, render template, call WhatsApp API
- On success: mark intent `sent`, update broadcasts aggregate
- On failure: mark intent `failed`, increment retry_count, log error_message
- Retry logic: max 3 retries with exponential backoff

### Other Workflows
- **Digest Generator**: Sunday 9AM — creates weekly digest intents
- **Stale Intent Cleanup**: Daily — marks intents stuck in pending > 24h as failed
- **Broadcast Aggregator**: Hourly — rolls up intent counts into broadcasts table
- **Health Check**: Every 5min — pings API /health, alerts on failure
- **Subscriber Sync**: On-demand — reconciles subscription status

---

## 12. Security Architecture

### Authentication
- Supabase Auth JWTs for all admin API calls
- JWT verified at Edge Function middleware layer
- Role extracted from JWT custom claims
- No session tokens, no cookies for API auth

### API Security
- CORS: explicit allowlist of admin app origin only
- Rate limiting: per-IP and per-user
- HMAC verification: all webhook requests
- Zod validation: all request bodies and query params
- Service role key: Edge Functions only, never in frontend env vars

### Secrets Management
- All secrets in environment variables
- `.env.example` documents required vars, never actual values
- Supabase secrets for Edge Function env vars
- No hardcoded credentials anywhere

### Database Security
- RLS enabled on all tables
- Service role used only in Edge Functions
- Anon key has no meaningful permissions
- Admin users access data only via authenticated API calls

### What Was Fixed from v1
- `Proof321#` hardcoded password → Supabase Auth
- Wildcard CORS → explicit origin allowlist
- Custom session tokens → Supabase Auth JWTs
- Service role in frontend → Edge Functions only
- No input validation → Zod on every endpoint

---

## 13. Environment Variables

```bash
# WhatsApp
WHATSAPP_TOKEN=           # Business API bearer token
WHATSAPP_PHONE_ID=        # Phone number ID from Meta
WEBHOOK_VERIFY_TOKEN=     # Random string for webhook registration
WHATSAPP_APP_SECRET=      # For HMAC signature verification

# Supabase
SUPABASE_URL=             # Project URL
SUPABASE_ANON_KEY=        # Safe for frontend (limited permissions)
SUPABASE_SERVICE_KEY=     # Edge Functions only — never frontend

# Auth
NEXTAUTH_SECRET=          # Next.js auth secret (if using NextAuth adapter)

# External
ANTHROPIC_API_KEY=        # Claude API for enhanced MCP (optional)
SENTRY_DSN=               # Error tracking

# App
NEXT_PUBLIC_API_URL=      # Admin app → API base URL
NEXT_PUBLIC_APP_URL=      # Public PWA URL
NODE_ENV=                 # development | production
```

---

## 14. API Contract Summary

All endpoints are on the Supabase Edge Function base URL. All admin endpoints require `Authorization: Bearer <supabase_jwt>`.

### Public
```
GET  /health                    → system status
GET  /webhook                   → WhatsApp verification (query: hub.challenge)
POST /webhook                   → inbound WhatsApp messages
```

### Admin — Moments
```
GET    /admin/moments           → list (pagination, filter by status/region/category)
POST   /admin/moments           → create
GET    /admin/moments/:id       → get single
PUT    /admin/moments/:id       → update
DELETE /admin/moments/:id       → soft delete
POST   /admin/moments/:id/broadcast → trigger immediate broadcast
```

### Admin — Sponsors
```
GET    /admin/sponsors          → list
POST   /admin/sponsors          → create
PUT    /admin/sponsors/:id      → update
DELETE /admin/sponsors/:id      → deactivate
```

### Admin — Subscribers
```
GET    /admin/subscribers       → list (filter by region/status)
PUT    /admin/subscribers/:id   → update (opt-out, region change)
```

### Admin — Moderation
```
GET    /admin/moderation        → flagged content queue
PUT    /admin/moderation/:id    → resolve or escalate flag
GET    /admin/moderation/:id/advisory → full advisory detail
```

### Admin — Authority
```
GET    /admin/authority         → list profiles
POST   /admin/authority         → create profile
PUT    /admin/authority/:id     → update
POST   /admin/authority/:id/verify → verify (super_admin only)
```

### Admin — Analytics
```
GET    /admin/analytics         → dashboard metrics
GET    /admin/analytics/broadcasts → broadcast history with rates
GET    /admin/analytics/regions → per-region engagement
```

---

## 15. Engineering Philosophy

### 1. WhatsApp is the product
Every technical decision serves the WhatsApp experience. The admin dashboard is a tool, not the product. If a feature doesn't improve what subscribers receive on WhatsApp, question whether it's needed.

### 2. Fail open, log everything
The platform serves communities that depend on receiving information. A missed message is worse than a slightly imperfect one. Systems fail open (authority lookup fails → message still sends). Everything is logged for human review.

### 3. Advisory over automation
MCP scores are signals, not verdicts. Humans make moderation decisions. This is especially important for South African multilingual content where automated systems have high false positive rates.

### 4. Frontend knows nothing about the database
The admin dashboard is a consumer of the API. It does not know table names, column names, or Supabase internals. All data access is through typed API responses. This is enforced architecturally — the service role key is not available to the frontend.

### 5. The intent queue is the contract
Once a moment_intent row exists, delivery is guaranteed (with retries). The API creates intents; n8n delivers them. These two systems are decoupled. n8n can be replaced, restarted, or swapped without losing delivery guarantees.

### 6. Authority is enrichment, not gatekeeping
The authority system adds context and caps — it does not prevent anyone from sending messages. A message from an unverified number is processed normally. Authority status elevates, it does not restrict.

### 7. Regions are first-class
South Africa's 9 provinces are not just filter tags — they are a core dimension of every piece of content, every subscription, every broadcast. Region targeting is the primary way content reaches the right communities.

### 8. Sponsored content is transparent
Every sponsored Moment is labelled. The broadcast format always includes `[Sponsored]` when a sponsor is attached. This is non-negotiable for community trust.

### 9. Privacy by default
No individual tracking. Aggregate metrics only. Phone numbers are hashed where possible in logs. POPIA compliance is a baseline, not a feature.

### 10. Build for the person on a 2G connection
WhatsApp messages are the delivery mechanism. Keep content short. No rich media unless necessary. The platform's value is in reach and trust, not in visual polish.

---

## 16. Build Order (for AI-assisted development)

When rebuilding from scratch, follow this order to avoid dependency issues:

1. **Monorepo scaffold** — turbo, workspaces, tsconfig, eslint
2. **`packages/types`** — all shared TypeScript types and enums
3. **`packages/validators`** — Zod schemas for all entities
4. **`packages/db`** — Drizzle schema matching DATA_MODELS.md
5. **Database migrations** — run against Supabase, verify schema
6. **`apps/api` — webhook endpoint** — inbound message handling, HMAC verify
7. **`apps/api` — admin endpoints** — all CRUD with Supabase Auth middleware
8. **`apps/admin` — auth** — Supabase Auth login, session, RBAC
9. **`apps/admin` — dashboard + moments** — core admin modules
10. **`apps/admin` — remaining modules** — sponsors, moderation, authority, analytics
11. **n8n workflows** — intent executor, digest, cleanup
12. **`apps/web`** — public PWA (lowest priority)
13. **MCP enhancements** — Claude integration on top of SQL baseline
14. **End-to-end testing** — webhook → intent → n8n → WhatsApp

---

## 17. Regions & Categories Reference

### Regions
| Code | Name |
|---|---|
| KZN | KwaZulu-Natal |
| WC | Western Cape |
| GP | Gauteng |
| EC | Eastern Cape |
| FS | Free State |
| LP | Limpopo |
| MP | Mpumalanga |
| NC | Northern Cape |
| NW | North West |

### Categories
`Education` · `Safety` · `Culture` · `Opportunity` · `Events` · `Health` · `Technology`

---

## 18. Glossary

| Term | Definition |
|---|---|
| Moment | A piece of community content created by an admin for broadcast |
| Intent | A queued delivery task: one Moment × one subscriber |
| Broadcast | The aggregate record of a Moment's delivery run |
| Advisory | MCP output for an inbound message (scores + flags) |
| Authority | A verified community figure with elevated broadcast permissions |
| Blast Radius | The maximum number of recipients an authority can reach per broadcast |
| Digest | A weekly summary of Moments grouped by region |
| MCP | Moderation/Content Processing — the content intelligence layer |
| POPIA | Protection of Personal Information Act (South African privacy law) |
| Fail-open | System continues operating with degraded functionality rather than blocking |

---

*Last updated: v2 rebuild planning phase. Maintained alongside the codebase — update this document when architecture or philosophy changes.*
