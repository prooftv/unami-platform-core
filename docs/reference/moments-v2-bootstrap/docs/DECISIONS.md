# Business Decisions & Design Rationale

Every significant decision made in the original system, preserved here so the rebuild
makes the same choices intentionally — or consciously changes them.

---

## Content Philosophy

### Decision: Advisory-only moderation (never auto-block)
**Rationale:** South African community content is multilingual and culturally nuanced.
Automated blocking would suppress legitimate content from Zulu, Xhosa, Sotho speakers
whose phrasing might trigger English-trained classifiers. MCP advises, humans decide.
**Implementation:** MCP sets confidence score. Only auto-approve (not auto-block).
High confidence → escalate to human. Never silently drop messages.

### Decision: Preserve content formatting exactly
**Rationale:** Community members write in their natural style. Stripping newlines or
whitespace changes meaning and feels disrespectful. Admin-created content also needs
formatting preserved for readability in WhatsApp.
**Implementation:** content stored as-is. No trim, no strip. Only length validation.

### Decision: "Partner content" not "Sponsored"
**Rationale:** Meta WhatsApp policies restrict certain commercial language in broadcast
messages. "Sponsored" can trigger policy violations. "In partnership with" and
"partner content" are compliant and feel more community-oriented.
**Implementation:** is_sponsored=true → "In partnership with {display_name}" in broadcasts.

### Decision: Community moments go through admin review by default
**Rationale:** The platform serves vulnerable communities. Unreviewed content could
spread misinformation, scams, or harmful material. Trust must be earned.
**Exception:** Authority users with approval_mode='auto' bypass review.
**Implementation:** WhatsApp submissions → draft status → admin moderation queue.

---

## WhatsApp Architecture

### Decision: Intent-based broadcasting (not direct send)
**Rationale:** Direct sending from the API blocks the response and fails silently on
large subscriber lists. The intent system decouples creation from delivery, enables
retries, provides delivery tracking, and lets n8n handle rate limiting properly.
**Implementation:** moments → moment_intents → n8n executor → WhatsApp API → status update.

### Decision: n8n for broadcast orchestration (not Supabase Edge Functions)
**Rationale:** Edge Functions have execution time limits (30s default). Broadcasting
to 3000+ subscribers takes minutes. n8n has no time limit, built-in retry logic,
visual debugging, and can be self-hosted for cost control.
**Exception:** The webhook processing and intent creation happen in Edge Functions
(fast, event-driven). Only the actual sending loop is in n8n.

### Decision: Immediate opt-out (no confirmation step)
**Rationale:** POPIA (South Africa's GDPR equivalent) requires immediate opt-out
processing. Any delay or confirmation step is non-compliant. Also, users who want
to stop receiving messages are already frustrated — adding friction makes it worse.
**Implementation:** STOP command → immediate opted_in=false → confirmation sent → done.

### Decision: Interactive buttons/lists over plain text menus
**Rationale:** Plain text menus require users to type exact commands. Interactive
buttons reduce friction, work better on mobile, and feel more like a proper app.
WhatsApp Business API supports up to 3 buttons or 10 list items.
**Fallback:** If interactive message fails, fall back to plain text automatically.

### Decision: Store all inbound messages (including commands)
**Rationale:** Audit trail for compliance. Understanding user behavior. Debugging
delivery issues. Commands are filtered out before MCP analysis but still logged.
**Exception:** Commands are NOT stored in messages table — only content messages.
This keeps the moderation queue clean.

### Decision: Fail-open on all external service calls
**Rationale:** WhatsApp message processing must never fail due to a secondary service
(authority lookup, MCP analysis, n8n trigger). If any of these fail, processing
continues with safe defaults. A missed advisory is better than a lost message.
**Implementation:** Every external call wrapped in try/catch with null/default return.

---

## Database Decisions

### Decision: Supabase Auth replaces custom admin_users + admin_sessions
**Rationale:** The original custom session system used `session_${Date.now()}_${Math.random()}`
tokens — not cryptographically secure. Supabase Auth provides proper JWT tokens,
password hashing, magic links, and session management out of the box.
**Migration:** admin_users table kept for display name/metadata. Auth handled by Supabase.

### Decision: moment_intents as the publishing pipeline
**Rationale:** Separates the "what to publish" from "how/when to publish". Enables
multiple channels (pwa, whatsapp, email, sms) from one moment. Provides delivery
status tracking. Enables retry without re-creating the moment.
**Unique constraint:** (moment_id, channel) — prevents duplicate delivery.

### Decision: Soft deletes NOT used
**Rationale:** Adds complexity (every query needs WHERE deleted_at IS NULL). For this
system, hard deletes with CASCADE are simpler and the data isn't needed after deletion.
**Exception:** subscriptions — opted_out records kept for compliance audit trail.

### Decision: regions stored as TEXT[] array on subscriptions
**Rationale:** Users can subscribe to multiple regions. Array is simpler than a
junction table for this use case. Supabase supports array contains queries natively.
**Query pattern:** `.contains('regions', [moment.region])` for filtering.

### Decision: Single CLEAN_SCHEMA.sql (not incremental migrations during dev)
**Rationale:** The original system accumulated 30+ migration files over 6 months,
many of which conflicted or were applied out of order. For a fresh start, one
authoritative schema file is cleaner. Incremental migrations only after first deploy.

---

## API Design Decisions

### Decision: Hono.js on Supabase Edge Functions (not Express)
**Rationale:** Express is Node.js only. Supabase Edge Functions run Deno. Hono is
designed for edge runtimes, has proper routing (vs the original `if path.includes()`
pattern), TypeScript-first, and has Zod validation middleware built in.
**Original problem:** The admin-api/index.ts was 1200+ lines of if/else path matching.

### Decision: All business logic in API layer, never in frontend
**Rationale:** The original system had Supabase service role keys in frontend JS files
and business logic (broadcast triggering, MCP calls) in browser-executed code.
This is a security vulnerability and makes the system impossible to audit.
**Rule:** Frontend only calls API endpoints. API layer calls Supabase with service role.

### Decision: Shared Zod schemas between frontend and API
**Rationale:** Validation logic was duplicated — frontend had its own checks, API had
different checks, database had constraints. Mismatches caused confusing errors.
Shared schemas in packages/validators ensure one source of truth.

### Decision: Public endpoints require no auth, admin endpoints require JWT
**Rationale:** The public PWA (moments feed, stats) should be accessible without login.
Admin operations (create/edit/broadcast) require authentication. Clear separation.
**Public:** GET /api/moments, GET /api/stats, GET /health
**Admin:** everything else requires Authorization: Bearer <supabase_jwt>

---

## Security Decisions

### Decision: CORS restricted to known domains (not *)
**Rationale:** The original system had `'Access-Control-Allow-Origin': '*'` on all
Edge Functions. This allows any website to call the admin API with a stolen token.
**Implementation:** CORS origin set to NEXT_PUBLIC_ADMIN_URL and NEXT_PUBLIC_APP_URL only.

### Decision: HMAC verification on webhook
**Rationale:** Without HMAC verification, anyone can POST fake WhatsApp messages to
the webhook and inject content into the system. Meta signs all webhook payloads.
**Implementation:** X-Hub-Signature-256 header verified against WEBHOOK_HMAC_SECRET.

### Decision: Rate limiting per IP and per endpoint
**Rationale:** Without rate limiting, the moderation queue can be flooded, the
broadcast endpoint can be abused, and the WhatsApp API quota can be exhausted.
**Implementation:** rate_limits table tracks requests per IP per endpoint per window.

### Decision: Service role key only in Edge Functions, never in frontend
**Rationale:** Service role key bypasses all RLS policies. If exposed in frontend,
anyone can read/write any data in the database.
**Implementation:** Frontend only gets NEXT_PUBLIC_SUPABASE_ANON_KEY. Service role
key set as Supabase secret, only accessible in Edge Function runtime.

---

## Operational Decisions

### Decision: Sentry for error tracking (optional)
**Rationale:** Silent failures are the hardest to debug. Sentry captures unhandled
errors with full context (request, user, stack trace) without requiring log parsing.
**Implementation:** SENTRY_DSN env var — if not set, Sentry is disabled entirely.

### Decision: In-memory authority cache (not Redis)
**Rationale:** Redis adds infrastructure cost and complexity. Authority lookups are
read-heavy and the data changes rarely. 5-minute in-memory cache is sufficient for
the scale of this system (< 10,000 subscribers).
**Limitation:** Cache is per-instance. If multiple Edge Function instances run,
each has its own cache. Acceptable trade-off for simplicity.

### Decision: n8n self-hosted (not cloud)
**Rationale:** n8n cloud has per-execution pricing that becomes expensive at scale.
Self-hosted on a small VPS (2GB RAM) handles thousands of executions per day for
a fixed monthly cost. Workflows are version-controlled as JSON files.

### Decision: Vercel for frontend hosting
**Rationale:** Zero-config Next.js deployment, automatic preview deployments on PRs,
edge network for fast global delivery, free tier sufficient for this scale.

### Decision: Three GitHub Actions workflows only (not 6+)
**Rationale:** The original system had 6 workflows that overlapped and conflicted.
Three is sufficient: CI (lint/test on PR), Deploy (on main push), Migrate (on release).

---

## Features Intentionally NOT Built

### No real-time chat
WhatsApp is broadcast-only. Users can reply but replies go to admin moderation,
not to other users. This is a notice board, not a chat platform.

### No user accounts on PWA
The public PWA is anonymous. No login, no profiles, no personalization.
WhatsApp subscription IS the user account.

### No payment processing
Budget tracking is internal accounting only. No Stripe, no payment gateway.
Sponsors pay via invoice outside the system.

### No email notifications to subscribers
WhatsApp only. Email would require separate opt-in and POPIA compliance work.
Future feature if needed.

### No AI content generation
MCP is for moderation/analysis only. Content is always human-written.
The system assists humans, it doesn't replace them.
