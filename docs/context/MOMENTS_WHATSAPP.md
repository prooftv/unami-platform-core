# Moments — WhatsApp Business API Reference

Constitutional document for all WhatsApp integration work in Moments v2.
Read before touching `supabase/functions/webhook/`, `supabase/functions/broadcast/`, or any template logic.

---

## Account Details

- **Phone number**: +27 65 829 5041
- **Graph API version**: v19.0
- **Base send URL**: `https://graph.facebook.com/v19.0/{WHATSAPP_PHONE_NUMBER_ID}/messages`
- **Template management URL**: `https://graph.facebook.com/v19.0/{WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`
- **Webhook URL**: `https://moments.unamifoundation.org/webhook` → rewrites to Supabase Edge Function

### Required Supabase secrets (set via Supabase dashboard → Edge Functions → Secrets)

```
WHATSAPP_TOKEN                  Bearer token from Meta Business Manager
WHATSAPP_PHONE_NUMBER_ID        Phone number ID (not the display number)
WHATSAPP_BUSINESS_ACCOUNT_ID    WABA ID
WEBHOOK_VERIFY_TOKEN            Chosen verify token — must match Meta webhook config
WEBHOOK_HMAC_SECRET             HMAC secret for payload signature verification
WHATSAPP_DEFAULT_TEMPLATE       Template name fallback (e.g. moment_broadcast)
```

All tokens from v1 are expired. Regenerate from Meta Business Manager before any send or template operation.

---

## The Core Constraint — 24-Hour Messaging Window

WhatsApp only allows freeform messages within 24 hours of the user last messaging you.
Outside that window, only pre-approved templates work.

For a broadcast platform, the vast majority of subscribers are outside the 24-hour window at any broadcast time.

**Decision: MARKETING templates only for all outbound broadcasts. No exceptions.**

The freeform fallback in the current `broadcast/index.ts` (`buildFreeTextPayload`) must be removed
from the broadcast path. It remains valid only for inbound command responses (HELP, STATUS, MYAUTHORITY,
opt-in confirmation, opt-out confirmation) because the user just messaged us — we are always within
the 24-hour window for those responses.

---

## Template Strategy

| Template | Category | Used for |
|---|---|---|
| `welcome_confirmation` | UTILITY | Sent on START/JOIN — opt-in confirmation |
| `unsubscribe_confirmation` | UTILITY | Sent on STOP — opt-out confirmation |
| `moment_broadcast` | MARKETING | All non-sponsored moment broadcasts |
| `sponsored_moment` | MARKETING | Sponsored moment broadcasts |
| `subscription_preferences` | UTILITY | Preference management (future) |

UTILITY = transactional, user-requested. MARKETING = outbound broadcast to opted-in subscribers.

All 5 templates must be submitted to Meta and approved before any broadcast.
Approval takes 24–48 hours. Status: `PENDING → APPROVED → REJECTED / DISABLED`.

---

## Template Definitions

### `welcome_confirmation` (UTILITY)

```
BODY:
Welcome to Unami Foundation Moments! 🌟

You're now subscribed to community updates for {{1}}.

Categories: {{2}}

Reply STOP anytime to unsubscribe.

FOOTER:
Unami Foundation - Empowering Communities
```

Variables: `{{1}}` = region name, `{{2}}` = category list

**Current state:** `handleOptIn` sends freeform — correct for now (user just messaged us).
When WABA is verified and template is approved, switch to UTILITY template send.

---

### `unsubscribe_confirmation` (UTILITY)

```
BODY:
You have been unsubscribed from Unami Foundation Moments.

Reply START anytime to resubscribe.

Thank you for being part of our community! 🙏
```

Variables: none

**Current state:** `handleOptOut` sends freeform — correct for now.

---

### `moment_broadcast` (MARKETING)

```
HEADER (TEXT): {{1}} Moment — {{2}}

BODY:
{{3}}

{{4}}

🏷️ {{5}} • 📍 {{6}}

🌐 More: https://moments.unamifoundation.org

FOOTER: Reply STOP to unsubscribe
```

Variables:
- `{{1}}` = emoji (📢 standard)
- `{{2}}` = region short code (e.g. KZN)
- `{{3}}` = moment title
- `{{4}}` = moment content (max 160 chars for compliance)
- `{{5}}` = category
- `{{6}}` = region full name

**Current state:** `buildTemplatePayload` sends 3 body params only — does not match this structure.
Needs a header component + 4 body params. See broadcast fix below.

---

### `sponsored_moment` (MARKETING)

```
HEADER (TEXT): {{1}} [Sponsored] Moment — {{2}}

BODY:
{{3}}

{{4}}

🏷️ {{5}} • 📍 {{6}}

✨ Proudly sponsored by {{7}}

🌐 More: https://moments.unamifoundation.org

FOOTER: Reply STOP to unsubscribe

BUTTON (URL): "Learn More" → {{8}}
```

Variables:
- `{{1}}` = sponsor tier emoji (👑 enterprise, ⭐ premium, 📢 standard)
- `{{2}}` = region short code
- `{{3}}` = moment title
- `{{4}}` = moment content
- `{{5}}` = category
- `{{6}}` = region full name
- `{{7}}` = sponsor display name
- `{{8}}` = PWA link with UTM tracking

**Current state:** No sponsored template branch exists. `is_sponsored = true` moments use the same
generic payload as non-sponsored. Needs a separate `buildSponsoredTemplatePayload` function.

---

## Meta API Constraints

- HEADER text: max 60 characters
- BODY text: max 1024 characters
- FOOTER text: max 60 characters
- Max 3 buttons per template
- Variable placeholders must be sequential: `{{1}}`, `{{2}}`, `{{3}}`
- No dynamic URLs in BODY — use a button component for URLs
- MARKETING templates require an approved business profile

---

## Broadcast Architecture — Current vs Required

### Current (broadcast/index.ts)

```
POST /broadcast/:momentId
  → load moment
  → fetch subscribers (region + category filter)
  → create broadcast record + batches
  → sendBatch() → buildTemplatePayload() OR buildFreeTextPayload()
  → update broadcast status
  → mark moment as broadcasted
```

Problems:
1. `buildTemplatePayload` sends wrong component structure (3 body params, no header)
2. No sponsored template branch
3. Freeform fallback should not exist for broadcasts — if template fails, log failure, do not fall back
4. Subscriber filter uses `.contains('regions', [...])` — needs verification against actual schema

### Required

```
POST /broadcast/:momentId
  → load moment (with sponsor data if is_sponsored)
  → fetch subscribers (opted_in, region match, category match, blast_radius cap)
  → create broadcast record + batches
  → sendBatch()
      → if is_sponsored: buildSponsoredTemplatePayload()
      → else: buildMomentBroadcastPayload()
      → no freeform fallback — log failure if template rejected
  → update broadcast status
  → mark moment as broadcasted
```

---

## n8n — Deferred, Not Eliminated (D-023)

n8n is the eventual automation layer. It is not needed for Phase 17J launch.

What n8n will handle (future):
- Intent Executor — polls `moment_intents` every 1 min, executes pending broadcasts
- Scheduled Campaign Processor — converts approved scheduled campaigns to moments
- Soft Moderation — polls `process_auto_approval_queue`
- Retry Handler — reprocesses failed messages
- Revenue Tracking — webhook on revenue events

**What this means for now:**
The `broadcast/index.ts` Edge Function handles broadcast execution directly.
The `moment_intents` table exists and is populated — it is the queue that n8n will eventually poll.
When n8n is connected, the broadcast Edge Function becomes the fallback/manual trigger only.

n8n hosting recommendation: Hetzner CX11 + Docker or n8n Cloud.
Do not use Railway (deprecated from this stack) or Render free tier (sleeps).

---

## Supabase MCP

Supabase MCP (Model Context Protocol) is available for direct database introspection
during development — schema inspection, query testing, migration validation.

It does not change the architecture. Edge Functions remain the only layer that writes to the database.
MCP is a development tool, not a runtime dependency.

Use it to:
- Verify table schemas before writing migrations
- Test GROQ-equivalent queries against live data
- Inspect RLS policies
- Validate that migrations applied correctly

---

## Inbound Command Reference

All commands are processed in `webhook/index.ts` → `routeMessage()`.

| User sends | Matches | Handler | Response type |
|---|---|---|---|
| START, JOIN, SUBSCRIBE, YES | OPT_IN | `handleOptIn` | Freeform (within 24h window) |
| STOP, UNSUBSCRIBE, QUIT, CANCEL, NO | OPT_OUT | `handleOptOut` | Freeform (within 24h window) |
| HELP, INFO, MENU, ? | HELP | `handleHelp` | Freeform |
| STATUS, SETTINGS, MY | STATUS | `handleStatus` | Freeform |
| MYAUTHORITY | MY_AUTHORITY | `handleMyAuthority` | Freeform |
| anything else | — | advisory insert | None (moderation queue) |

Region selection (KZN, GP, WC etc.) and interest number selection (1,3,5) from v1 are not yet
implemented in the current webhook. These are Phase 17I additions if needed.

---

## Webhook Verification

Meta sends a GET to verify the webhook:
```
GET /webhook?hub.mode=subscribe&hub.verify_token={WEBHOOK_VERIFY_TOKEN}&hub.challenge={challenge}
```
Respond with raw `hub.challenge` and HTTP 200. If token mismatch, respond 403.
Current implementation in `webhook/index.ts` is correct.

The webhook always returns HTTP 200 to Meta for POST requests — even on errors (D-010).
Errors are logged to `error_logs`. Never surfaced to Meta.

---

## Database Tables for WABA

All exist in the current schema (migrations 000–005):

| Table | Purpose |
|---|---|
| `subscriptions` | Opt-in status, regions, categories, consent |
| `messages` | Inbound message log |
| `moment_intents` | Broadcast queue — n8n polls this |
| `broadcasts` | Aggregate delivery log per moment |
| `broadcast_batches` | Per-batch delivery tracking |
| `analytics_events` | Delivery receipts, opt-in/out events |
| `marketing_compliance` | Compliance score per broadcast |

Tables from v1 WABA context that do NOT exist yet and are needed:

| Table | Purpose | When needed |
|---|---|---|
| `whatsapp_templates` | Local record of template definitions + approval status | Before first broadcast |
| `template_messages` | Audit log of every template message sent | Before first broadcast |
| `messaging_windows` | 24h window tracking per phone number | Useful for command responses |

These require a new migration (`006_whatsapp_tables.sql`).
Write `docs/DATABASE_SCHEMA.md` update first, then the migration.

---

## What Needs to Change Before First Broadcast

Engineering (in order):

1. **Migration 006** — add `whatsapp_templates`, `template_messages`, `messaging_windows` tables
2. **`broadcast/index.ts`** — fix `buildTemplatePayload` to match `moment_broadcast` structure (header + 4 body params)
3. **`broadcast/index.ts`** — add `buildSponsoredTemplatePayload` for `is_sponsored = true` moments
4. **`broadcast/index.ts`** — remove freeform fallback from broadcast path
5. **`packages/api`** — add template management client methods if admin UI needs them

Ops (before going live):
1. Regenerate WHATSAPP_TOKEN in Meta Business Manager
2. Set all 6 secrets in Supabase Edge Functions
3. Register webhook URL in Meta Developer Console
4. Submit all 5 templates via Graph API
5. Wait for APPROVED status on `moment_broadcast` before any broadcast
6. Verify webhook end-to-end with a real number
