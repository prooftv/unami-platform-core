# Database Schema — Moments v2

Derived from `packages/shared/src/types` and `packages/shared/src/enums`.
This document is the source of truth before any migration is written.
Change here first. Then generate SQL.

---

## Entity Map

```
sponsors ──────────────────────────────────────┐
                                                │
moments ──── moment_intents                    │
   │                                           │
   ├──── broadcasts ──── broadcast_batches     │
   │                                           │
   ├──── advisories                            │
   ├──── comments ──── whatsapp_comments       │
   ├──── moment_stats                          │
   ├──── media                                 │
   └──── marketing_compliance                  │
                                               │
campaigns ─────────────────────────────────────┘
   └──── budget_transactions

subscriptions (standalone — keyed by phone number)

messages ──── advisories
   └──── media

authority_profiles ──── authority_audit_log

admin_roles (maps Supabase Auth → role)

system_settings
feature_flags
rate_limits
audit_logs
error_logs
analytics_events
user_profiles
```

---

## Core Content

### moments

The central unit. Everything else references this table.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| title | TEXT | NOT NULL, length 3–200 | |
| content | TEXT | NOT NULL, length 10–2000 | |
| raw_content | TEXT | nullable | Original before processing |
| region | TEXT | NOT NULL, CHECK enum | KZN/WC/GP/EC/FS/LP/MP/NC/NW/National |
| category | TEXT | NOT NULL, CHECK enum | Education/Safety/Culture/Opportunity/Events/Health/Technology/Community |
| language | TEXT | NOT NULL, default 'eng' | eng/zul/xho/afr |
| sponsor_id | UUID | FK sponsors(id) ON DELETE SET NULL, nullable | |
| is_sponsored | BOOLEAN | NOT NULL, default false | |
| pwa_link | TEXT | nullable | Deep link to PWA page |
| media_urls | TEXT[] | NOT NULL, default '{}' | Public storage URLs |
| scheduled_at | TIMESTAMPTZ | nullable | Future broadcast time |
| broadcasted_at | TIMESTAMPTZ | nullable | When actually sent |
| status | TEXT | NOT NULL, CHECK enum, default 'draft' | draft → scheduled → broadcasted → cancelled |
| urgency_level | TEXT | NOT NULL, CHECK enum, default 'low' | low/medium/high/urgent |
| moment_type | TEXT | NOT NULL, CHECK enum, default 'standard' | standard/community/opportunity/infrastructure/consultation |
| participation_enabled | BOOLEAN | NOT NULL, default false | Whether community responses are open |
| participation_deadline | TIMESTAMPTZ | nullable | Response window close time |
| content_source | TEXT | NOT NULL, CHECK enum, default 'admin' | admin/community/whatsapp/campaign |
| created_by | TEXT | nullable | Admin user ID or phone number |
| publish_to_whatsapp | BOOLEAN | NOT NULL, default false | Admin must explicitly enable |
| publish_to_pwa | BOOLEAN | NOT NULL, default true | |
| digest_sent | TIMESTAMPTZ | nullable | When included in weekly digest |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated by trigger | |

**Indexes:** `status`, `region`, `category`, `content_source`, `scheduled_at`, `sponsor_id`

**Business rules:**
- Status is one-directional: draft → scheduled → broadcasted. No reverting.
- `publish_to_whatsapp` defaults false — admin must opt in per moment.
- `sponsor_id` nullable — not all moments are sponsored.

**RLS:**
- `anon`: SELECT where status = 'broadcasted' and publish_to_pwa = true
- `service_role`: all operations
- `authenticated` (admin): all operations

---

### sponsors

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| name | TEXT | UNIQUE NOT NULL | Slug: lowercase, hyphens only |
| display_name | TEXT | NOT NULL | Shown to users |
| contact_email | TEXT | nullable | |
| logo_url | TEXT | nullable | |
| website_url | TEXT | nullable | |
| tier | TEXT | NOT NULL, CHECK enum, default 'bronze' | bronze/silver/gold/platinum |
| monthly_budget | DECIMAL(10,2) | NOT NULL, default 0 | ZAR |
| active | BOOLEAN | NOT NULL, default true | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**RLS:** anon: no access. authenticated: read. service_role: all.

---

### campaigns

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| title | TEXT | NOT NULL | |
| content | TEXT | NOT NULL | |
| category | TEXT | NOT NULL, CHECK enum | |
| sponsor_id | UUID | FK sponsors(id) ON DELETE SET NULL, nullable | |
| budget | DECIMAL(10,2) | NOT NULL, default 0 | ZAR |
| target_regions | TEXT[] | NOT NULL, default '{}' | |
| target_categories | TEXT[] | NOT NULL, default '{}' | |
| media_urls | TEXT[] | NOT NULL, default '{}' | |
| scheduled_at | TIMESTAMPTZ | nullable | |
| status | TEXT | NOT NULL, CHECK enum, default 'pending_review' | pending_review/approved/active/paused/completed/cancelled/published |
| template_name | TEXT | nullable | WhatsApp template used |
| created_by | TEXT | nullable | Admin user ID |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**Business rules:** Campaigns require approval before publish. Status workflow enforced in API, not DB.

**RLS:** anon: no access. authenticated: read. service_role: all.

---

## Publishing Pipeline

### moment_intents

One row per channel per moment. Drives the publishing queue.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, NOT NULL | |
| channel | TEXT | NOT NULL, CHECK enum | pwa/whatsapp/email/sms |
| action | TEXT | NOT NULL, CHECK enum | publish/update/delete |
| status | TEXT | NOT NULL, CHECK enum, default 'pending' | pending/processing/sent/failed/cancelled |
| template_id | TEXT | nullable | WhatsApp template name |
| payload | JSONB | nullable | {title, full_text, summary, link, region} |
| attempts | INTEGER | NOT NULL, default 0 | Retry counter |
| last_attempt_at | TIMESTAMPTZ | nullable | |
| last_error | TEXT | nullable | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**Unique constraint:** `(moment_id, channel)` — no duplicate intents per channel.

**RLS:** service_role only.

---

### broadcasts

Execution log for each broadcast run.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, NOT NULL | |
| campaign_id | UUID | FK campaigns(id) ON DELETE SET NULL, nullable | |
| recipient_count | INTEGER | NOT NULL, default 0, >= 0 | |
| success_count | INTEGER | NOT NULL, default 0, >= 0 | |
| failure_count | INTEGER | NOT NULL, default 0, >= 0 | |
| broadcast_started_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| broadcast_completed_at | TIMESTAMPTZ | nullable | |
| status | TEXT | NOT NULL, CHECK enum | pending/processing/completed/failed |
| authority_context | JSONB | nullable | Authority snapshot used for filtering |
| error_details | JSONB | nullable | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**RLS:** authenticated: read. service_role: all.

---

### broadcast_batches

Parallel batch processing for large subscriber lists.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| broadcast_id | UUID | FK broadcasts(id) ON DELETE CASCADE, NOT NULL | |
| batch_number | INTEGER | NOT NULL | |
| recipients | TEXT[] | NOT NULL | Phone numbers in this batch |
| status | TEXT | NOT NULL, CHECK enum | pending/processing/completed/failed |
| success_count | INTEGER | NOT NULL, default 0 | |
| failure_count | INTEGER | NOT NULL, default 0 | |
| started_at | TIMESTAMPTZ | nullable | |
| completed_at | TIMESTAMPTZ | nullable | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**RLS:** service_role only.

---

## WhatsApp

### subscriptions

WhatsApp users who have opted in. Keyed by phone number.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| phone_number | TEXT | UNIQUE NOT NULL, CHECK E.164 | Must start with + |
| opted_in | BOOLEAN | NOT NULL, default true | |
| regions | TEXT[] | NOT NULL, default '{National}' | |
| categories | TEXT[] | NOT NULL, default all categories | |
| language_preference | TEXT | NOT NULL, default 'eng' | |
| delivery_schedule | TEXT | NOT NULL, CHECK enum, default 'instant' | instant/morning/evening/weekly |
| paused_until | TIMESTAMPTZ | nullable | |
| opted_in_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| opted_out_at | TIMESTAMPTZ | nullable | |
| last_activity | TIMESTAMPTZ | NOT NULL, default NOW() | |
| consent_timestamp | TIMESTAMPTZ | nullable | POPIA compliance |
| consent_method | TEXT | nullable | 'whatsapp_optin' |
| double_opt_in_confirmed | BOOLEAN | NOT NULL, default false | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**Indexes:** `opted_in`, `regions` (GIN), `categories` (GIN), `delivery_schedule`

**RLS:** service_role only. Phone numbers are PII — no anon access.

---

### messages

All inbound WhatsApp messages.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| whatsapp_id | TEXT | UNIQUE NOT NULL | Meta's message ID — dedup key |
| from_number | TEXT | NOT NULL | E.164 format |
| message_type | TEXT | NOT NULL, CHECK enum | text/image/audio/video/document |
| content | TEXT | nullable | Text content |
| media_url | TEXT | nullable | Public URL after download |
| media_id | TEXT | nullable | Meta's media ID |
| language_detected | TEXT | nullable | |
| authority_context | JSONB | nullable | Authority snapshot at time of message |
| timestamp | TIMESTAMPTZ | NOT NULL, default NOW() | |
| processed | BOOLEAN | NOT NULL, default false | |
| moderation_status | TEXT | NOT NULL, CHECK enum, default 'pending' | pending/approved/flagged/rejected |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**Indexes:** `from_number`, `moderation_status`, `processed`, `timestamp`

**RLS:** authenticated: read. service_role: all.

---

## Moderation

### advisories

MCP (AI) analysis results. Attached to messages or moments.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| message_id | UUID | FK messages(id) ON DELETE CASCADE, nullable | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, nullable | |
| advisory_type | TEXT | NOT NULL, CHECK enum | language/urgency/harm/spam/content_quality |
| confidence | DECIMAL(3,2) | NOT NULL, CHECK 0–1 | Overall risk score |
| harm_signals | JSONB | nullable | {violence, harassment, threats, hate_speech} |
| spam_indicators | JSONB | nullable | {promotional, repetitive, links, financial_fraud} |
| urgency_level | TEXT | NOT NULL, default 'low' | |
| escalation_suggested | BOOLEAN | NOT NULL, default false | true when confidence > 0.7 |
| details | JSONB | nullable | Full analysis output |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**Constraint:** CHECK (message_id IS NOT NULL OR moment_id IS NOT NULL)

**RLS:** authenticated: read. service_role: all.

---

### moderation_audit

Human moderation action log.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| message_id | UUID | FK messages(id) ON DELETE CASCADE, nullable | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, nullable | |
| action | TEXT | NOT NULL, CHECK enum | approved/flagged/rejected |
| moderator | TEXT | NOT NULL | Admin user ID or 'system_auto' |
| reason | TEXT | nullable | |
| timestamp | TIMESTAMPTZ | NOT NULL, default NOW() | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**RLS:** authenticated: read. service_role: all.

---

### comments

Community comments on moments (sourced from WhatsApp replies).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, NOT NULL | |
| from_number | TEXT | NOT NULL | |
| content | TEXT | NOT NULL, max 500 chars | |
| moderation_status | TEXT | NOT NULL, CHECK enum, default 'pending' | pending/approved/rejected |
| featured | BOOLEAN | NOT NULL, default false | |
| reply_count | INTEGER | NOT NULL, default 0 | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**RLS:** anon: SELECT where moderation_status = 'approved'. authenticated: all. service_role: all.

---

### whatsapp_comments

Links Meta message IDs to comments for reply threading.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| whatsapp_message_id | TEXT | UNIQUE NOT NULL | Meta's message ID |
| comment_id | UUID | FK comments(id) ON DELETE CASCADE, nullable | |
| from_number | TEXT | NOT NULL | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, NOT NULL | |
| reply_to_message_id | TEXT | nullable | For threading |
| media_type | TEXT | nullable | text/image/audio/video |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**RLS:** service_role only.

---

## Authority System

### authority_profiles

Trusted community members with elevated content privileges.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_identifier | TEXT | NOT NULL | Phone number or user ID |
| authority_level | INTEGER | NOT NULL, CHECK 1–5, default 1 | 1=Community Member … 5=National Authority |
| role_label | TEXT | NOT NULL | "Community Leader", "NGO Partner" |
| scope | TEXT | NOT NULL, CHECK enum | community/region/province/national |
| scope_identifier | TEXT | nullable | e.g. 'KZN' for province scope |
| approval_mode | TEXT | NOT NULL, CHECK enum, default 'admin_review' | admin_review/ai_review/auto |
| blast_radius | INTEGER | NOT NULL, default 100, CHECK 1–10000 | Max subscribers reachable |
| risk_threshold | DECIMAL(3,2) | NOT NULL, default 0.7, CHECK 0.1–0.9 | MCP auto-approve threshold |
| status | TEXT | NOT NULL, CHECK enum, default 'active' | active/suspended/expired |
| valid_until | TIMESTAMPTZ | nullable | null = permanent |
| metadata | JSONB | NOT NULL, default '{}' | |
| created_by | TEXT | nullable | Admin user ID |
| updated_by | TEXT | nullable | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**Blast radius defaults by level:**
- Level 1: 100 | Level 2: 250 | Level 3: 500 | Level 4: 1000 | Level 5: 10000

**DB function:** `lookup_authority(p_user_identifier TEXT)` — returns highest active, non-expired profile. SECURITY DEFINER. Cached in-memory for 5 minutes in Edge Functions.

**Fail-open rule:** Authority lookup errors NEVER block message processing. All callers handle null.

**RLS:** authenticated: read. service_role: all.

---

### authority_audit_log

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| authority_profile_id | UUID | FK authority_profiles(id) ON DELETE CASCADE, NOT NULL | |
| action | TEXT | NOT NULL, CHECK enum | created/updated/suspended/enforced |
| actor_id | TEXT | NOT NULL | Admin user ID |
| context | JSONB | nullable | {reason, changes, moment_id, blast_radius_applied} |
| timestamp | TIMESTAMPTZ | NOT NULL, default NOW() | |

**RLS:** authenticated: read. service_role: all.

---

## Admin

### admin_roles

Maps Supabase Auth user IDs to admin roles. No custom auth — Supabase Auth handles sessions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | UNIQUE NOT NULL | Supabase Auth user ID |
| role | TEXT | NOT NULL, CHECK enum | superadmin/content_admin/moderator/viewer |
| granted_by | TEXT | nullable | Admin user ID who granted role |
| granted_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**Role permissions:**
- `superadmin`: all operations including role management
- `content_admin`: create/edit/broadcast moments and campaigns
- `moderator`: approve/flag/reject messages and moments
- `viewer`: read-only across all tables

**RLS:** authenticated: SELECT own row. service_role: all.

---

## Media

### media

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| message_id | UUID | FK messages(id) ON DELETE CASCADE, nullable | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, nullable | |
| whatsapp_media_id | TEXT | nullable | Meta's media ID |
| media_type | TEXT | NOT NULL, CHECK enum | image/audio/video/document |
| original_url | TEXT | nullable | Meta's temporary URL |
| storage_path | TEXT | nullable | Supabase Storage path |
| file_size | BIGINT | NOT NULL, CHECK > 0 | Bytes |
| mime_type | TEXT | nullable | |
| processed | BOOLEAN | NOT NULL, default false | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**RLS:** service_role only.

---

## Analytics & Engagement

### moment_stats

Per-moment engagement counters. One row per moment.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| moment_id | UUID | UNIQUE FK moments(id) ON DELETE CASCADE, NOT NULL | |
| view_count | INTEGER | NOT NULL, default 0 | |
| comment_count | INTEGER | NOT NULL, default 0 | |
| share_count | INTEGER | NOT NULL, default 0 | |
| reaction_count | INTEGER | NOT NULL, default 0 | |
| participation_count | INTEGER | NOT NULL, default 0 | Denormalised count of participation submissions |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**RLS:** anon: read. service_role: all.

---

### participation_log

Anonymised record of participation submissions. No personal data ever stored here.
Personal data (name, contact) is delivered via webhook and never persisted.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, NOT NULL | |
| response_type | TEXT | NOT NULL, CHECK enum | comment/support/concern/question |
| relationship | TEXT | NOT NULL, CHECK enum | resident/business/community/organisation/other |
| popia_consent | BOOLEAN | NOT NULL | Must be true — server enforced |
| submitted_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**Rules:**
- No `name`, `contact`, `phone`, or any PII column — ever.
- Personal data is webhook-delivered only.
- `popia_consent` is always `true` — server rejects submissions where it is false.
- Entries are immutable — no updates, no deletes.

**RLS:** anon: no access. service_role: all.

---

### user_profiles

Anonymous community member profiles keyed by phone number.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| phone_number | TEXT | UNIQUE NOT NULL | |
| display_name | TEXT | nullable | |
| avatar_url | TEXT | nullable | |
| bio | TEXT | nullable, max 200 chars | |
| reputation_score | INTEGER | NOT NULL, default 0 | |
| total_comments | INTEGER | NOT NULL, default 0 | |
| total_featured | INTEGER | NOT NULL, default 0 | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**RLS:** anon: no access. authenticated: read. service_role: all.

---

### analytics_events

Raw event tracking for dashboard metrics.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| event_type | TEXT | NOT NULL | moment_viewed/broadcast_sent/subscriber_joined/etc |
| resource_type | TEXT | nullable | moment/broadcast/subscription |
| resource_id | TEXT | nullable | |
| metadata | JSONB | nullable | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**RLS:** service_role only.

---

## Compliance & Finance

### marketing_compliance

Compliance record per broadcast.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, NOT NULL | |
| broadcast_id | UUID | FK broadcasts(id) ON DELETE CASCADE, NOT NULL | |
| template_used | TEXT | nullable | |
| template_category | TEXT | nullable | UTILITY/MARKETING |
| sponsor_disclosed | BOOLEAN | NOT NULL, default false | |
| opt_out_included | BOOLEAN | NOT NULL, default false | |
| pwa_link_included | BOOLEAN | NOT NULL, default false | |
| compliance_score | INTEGER | NOT NULL, CHECK 0–100 | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**RLS:** authenticated: read. service_role: all.

---

### budget_transactions

Spend tracking per campaign broadcast.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| campaign_id | UUID | FK campaigns(id) ON DELETE CASCADE, NOT NULL | |
| transaction_type | TEXT | NOT NULL, CHECK enum | spend/refund/adjustment |
| amount | DECIMAL(10,2) | NOT NULL | ZAR |
| recipient_count | INTEGER | NOT NULL | Messages sent |
| cost_per_recipient | DECIMAL(6,4) | NOT NULL | ZAR per message, default 0.05 |
| status | TEXT | NOT NULL, CHECK enum | completed/pending/failed |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**RLS:** authenticated: read. service_role: all.

---

## System

### system_settings

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| setting_key | TEXT | UNIQUE NOT NULL | |
| setting_value | TEXT | NOT NULL | |
| description | TEXT | nullable | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**Seed values:** `monthly_budget`, `message_cost_zar`, `daily_message_limit`, `warning_threshold_percent`

**RLS:** authenticated: read. service_role: all.

---

### feature_flags

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| flag_key | TEXT | UNIQUE NOT NULL | |
| enabled | BOOLEAN | NOT NULL, default false | |
| description | TEXT | nullable | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**RLS:** authenticated: read. service_role: all.

---

### rate_limits

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| identifier | TEXT | NOT NULL | IP address or user ID |
| endpoint | TEXT | NOT NULL | API endpoint path |
| request_count | INTEGER | NOT NULL, default 1 | Requests in current window |
| window_start | TIMESTAMPTZ | NOT NULL | Window start time |

**Unique constraint:** `(identifier, endpoint)`

**Limits:** webhook: 1000/min | moments POST: 60/min | broadcast: 10/min | analytics: 30/min | login: 5/min

**RLS:** service_role only.

---

### audit_logs

Admin action audit trail.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_id | TEXT | NOT NULL | Admin user ID |
| action | TEXT | NOT NULL | create/update/delete/approve/broadcast/etc |
| resource_type | TEXT | NOT NULL | moment/campaign/sponsor/subscription/etc |
| resource_id | TEXT | NOT NULL | |
| changes | JSONB | nullable | Before/after snapshot |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**Retention:** 2 years (POPIA compliance)

**RLS:** authenticated: read own rows. service_role: all.

---

### error_logs

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| error_type | TEXT | NOT NULL | |
| error_message | TEXT | NOT NULL | |
| context | JSONB | nullable | Request context, resource IDs |
| severity | TEXT | NOT NULL, CHECK enum | low/medium/high/critical |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**RLS:** authenticated: read. service_role: all.

---

## Triggers Required

All tables with `updated_at` need this trigger:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Tables: `moments`, `sponsors`, `campaigns`, `moment_intents`, `messages`, `comments`,
`whatsapp_comments`, `authority_profiles`, `moment_stats`, `user_profiles`,
`system_settings`, `feature_flags`

---

## DB Functions Required

```sql
-- Authority lookup (SECURITY DEFINER — bypasses RLS)
lookup_authority(p_user_identifier TEXT)

-- Authority action logging
log_authority_action(p_authority_profile_id UUID, p_action TEXT, p_actor_id TEXT, p_context JSONB)
```

---

## POPIA / Data Privacy Rules

- Phone numbers are PII. Never exposed to anon role.
- Admin UI masks phone numbers: show `+27...1234` (last 4 digits only).
- Messages retained 90 days, then deleted or anonymised.
- Subscriptions kept until opt-out + 30 days.
- Audit logs kept 2 years.
- Right to erasure: DELETE on subscriptions cascades to messages, comments, user_profiles.

---

---

### evidence

Formal evidence attachments on moments. Additive only — rows are never deleted.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, NOT NULL | |
| title | TEXT | NOT NULL, min 2 chars | Descriptive label for the attachment |
| file_type | TEXT | NOT NULL, CHECK enum | image/document/pdf |
| storage_path | TEXT | NOT NULL | Supabase Storage path |
| public_url | TEXT | NOT NULL | Public CDN URL |
| file_size | BIGINT | NOT NULL, CHECK > 0 | Bytes |
| mime_type | TEXT | NOT NULL | e.g. image/jpeg, application/pdf |
| uploaded_by | TEXT | NOT NULL | Admin user ID |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |

**Rules:**
- Rows are never deleted — evidence is immutable once attached.
- `file_type` is derived from `mime_type` on insert — not user-supplied.
- Accepted mime types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

**RLS:** anon: SELECT (public evidence on broadcasted moments). authenticated: SELECT. service_role: all.

---

**`moments` table — additional column (Phase 17F):**

| Column | Type | Constraints | Notes |
|---|---|---|---|
| weather_context | JSONB | nullable | WeatherSnapshot — auto-captured, never manually entered |

`weather_context` shape:
```json
{
  "type": "forecast | historical",
  "condition": "Clear sky",
  "temperatureCelsius": 22,
  "tempMinCelsius": 16,
  "tempMaxCelsius": 28,
  "rainfallMm": 0,
  "windKmh": 14,
  "humidityPercent": 58,
  "uvIndex": 6,
  "fetchedAt": "2025-01-01T10:00:00Z"
}
```

**Rules:**
- Captured automatically by `apps/web` server component on moment detail render.
- Historical snapshots (past dates) are fetched once and locked — never re-fetched.
- Forecast snapshots (future dates) are re-fetched on each render.
- If no region coordinates available, weather is silently skipped.
- Never manually entered or edited.

## What Is NOT in This Schema

- No custom auth tables — Supabase Auth handles sessions and JWTs.
- No `admin_users` or `admin_sessions` — replaced by `admin_roles` + Supabase Auth.
- No soft deletes — hard DELETE with CASCADE throughout.
- No `daily_stats` materialised table yet — computed from `analytics_events` on demand.
- No `participation_submissions` table — personal data is never stored. Webhook-delivered only.

---

## Next Step

Generate `supabase/migrations/000_initial_schema.sql` from this document.
One file. Everything in it. Incremental migrations begin only after that baseline is committed.
