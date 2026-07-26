# Database Schema & Decisions

## Design Principles
- Single migration file — no more 30+ SQL files
- Supabase Auth replaces custom admin_users + admin_sessions
- RLS enabled on all tables — service role bypasses, anon gets public reads only
- All timestamps in UTC (TIMESTAMPTZ)
- UUIDs for all primary keys
- Soft deletes NOT used — hard delete with CASCADE

## Tables

### Core Content
- `moments` — the central content unit
- `sponsors` — sponsor profiles
- `campaigns` — sponsored content campaigns
- `moment_intents` — publishing pipeline (pwa + whatsapp)
- `broadcasts` — broadcast execution logs
- `broadcast_batches` — parallel batch processing

### WhatsApp
- `messages` — all inbound WhatsApp messages
- `subscriptions` — user opt-in/out state + preferences
- `media` — media attachments (stored in Supabase Storage)
- `whatsapp_comments` — links WA messages to moments as comments

### Moderation
- `advisories` — MCP analysis results per message/moment
- `moderation_audit` — human moderation action log
- `comments` — community comments on moments

### Admin
- `admin_roles` — maps Supabase Auth user IDs to roles
- `authority_profiles` — trusted community member profiles
- `authority_audit_log` — authority action history

### Analytics
- `analytics_events` — raw event tracking
- `moment_stats` — per-moment engagement counters
- `user_profiles` — anonymous community member profiles

### System
- `system_settings` — key/value config store
- `rate_limits` — per-IP/endpoint rate limiting
- `audit_logs` — admin action audit trail
- `error_logs` — application error tracking
- `feature_flags` — feature toggle system

## Key Business Rules (encoded in schema)

1. `moments.status` can only go: draft → scheduled → broadcasted (no going back)
2. `subscriptions.phone_number` must match E.164 format (+27...)
3. `moment_intents` has unique constraint on (moment_id, channel) — no duplicate intents
4. `sponsors.name` is unique slug — `display_name` is what users see
5. `campaigns` require approval before publish (status workflow enforced in API)
6. `authority_profiles.blast_radius` caps how many subscribers a community member can reach
7. `messages` deduped by `whatsapp_id` (Meta's message ID)
