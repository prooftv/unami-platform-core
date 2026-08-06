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
| campaign_type | TEXT | NOT NULL, CHECK enum, default 'ad' | ad/activation/csr |
| project_health | TEXT | nullable, CHECK enum | green/amber/red — RAG status, csr type only |
| project_phase | TEXT | nullable, CHECK enum | planning/procurement/construction/commissioning/operational |
| project_reference | TEXT | nullable | Format: PRJ-YYYY-XXXX |
| funding_source | TEXT | nullable | Programme or entity funding the project |
| contractor | TEXT | nullable | Main contractor name |
| beneficiaries | INTEGER | nullable, CHECK >= 0 | Community members impacted |
| impact_summary | TEXT | nullable | For reports and sponsor feedback |
| lessons_learned | TEXT | nullable | At project closure — permanent institutional memory |
| progress_log | JSONB | NOT NULL, default '[]' | Append-only array of {date, update} entries |
| deliverables_certified | JSONB | NOT NULL, default '[]' | Array of certified deliverable objects |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**Certified deliverable shape:**
```json
{
  "id": "uuid",
  "task": "string",
  "status": "pending | certified | disputed",
  "certifiedBy": "string",
  "percentageComplete": 0-100,
  "weightage": 0-100,
  "certificationDate": "ISO date",
  "notes": "string"
}
```

**Progress log entry shape:**
```json
{ "date": "ISO date", "update": "string", "addedBy": "userId" }
```

**Rules:**
- `progress_log` is append-only — entries are never edited or deleted.
- `deliverables_certified` entries can transition: `pending` → `certified` or `pending` → `disputed`.
- `lessons_learned` is written at closure — permanent institutional memory, never overwritten.
- `campaign_type` defaults to `ad` — existing campaigns are unaffected.

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

## Platform Records — Phase 18A

Added by migration `006_platform_records.sql`. Platform-owned tables reusable across all applications.

### records

Institutional memory nodes with lineage. The governance equivalent of a moment.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| type | TEXT | NOT NULL | minutes/resolution/community-decision/land-allocation/dispute-resolution/report/infrastructure-concern/project-outcome/policy/agenda/public-notice/external-resource |
| title | TEXT | NOT NULL, length 3–200 | |
| content | TEXT | NOT NULL, length 10–5000 | |
| status | TEXT | NOT NULL, default 'pending' | pending/adopted/approved/resolved/rejected |
| authority_id | TEXT | nullable | Governance authority identifier |
| approved_by | TEXT | nullable | Person who approved |
| parent_record_id | UUID | FK records(id) ON DELETE SET NULL, nullable | Lineage chain |
| origin_notice_id | UUID | FK notices(id) ON DELETE SET NULL, nullable | Origin notice |
| weather_context | JSONB | nullable | WeatherSnapshot — auto-captured |
| created_by | TEXT | NOT NULL | Admin user ID |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**Rules:**
- Records are immutable once status reaches terminal state (adopted/approved/resolved/rejected).
- New records reference old ones via `parent_record_id` — the chain is never broken.
- `weather_context` is auto-captured, never manually entered.

**RLS:** anon: no access. authenticated: read. service_role: all.

---

### notices

Governance event origins. Community and statutory notices.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| type | TEXT | NOT NULL | meeting/announcement/resolution/alert/opportunity/employment/smme/project-update/eia/rezoning/land-use/township/building/mining/liquor/telecom/estate/liquidation/pto |
| title | TEXT | NOT NULL, length 3–200 | |
| content | TEXT | NOT NULL, length 10–5000 | |
| status | TEXT | NOT NULL, default 'draft' | draft/published/open/closed/approved/rejected/withdrawn/archived |
| is_statutory | BOOLEAN | NOT NULL, default false | Derived from type on insert |
| comment_deadline | TIMESTAMPTZ | nullable | Statutory notices only |
| comments_received | INTEGER | NOT NULL, default 0, CHECK >= 0 | Operator-maintained count |
| weather_context | JSONB | nullable | WeatherSnapshot — auto-captured |
| created_by | TEXT | NOT NULL | Admin user ID |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**Rules:**
- `is_statutory` is set automatically based on `type` — not user-supplied.
- `comment_deadline` is required for statutory notices when status transitions to `open`.
- `comments_received` is incremented by the operator from webhook data — never from live submissions.

**RLS:** anon: SELECT where status IN ('published', 'open'). authenticated: all. service_role: all.

---

## WhatsApp Template Management — Phase 17I

Added by migration `007_whatsapp_tables.sql`. Tracks template approval state, delivery audit, and messaging windows.
The `moments` table supplies all template variable values at send time — these tables do not duplicate moment content.

### whatsapp_templates

Local record of every Meta-approved template. Source of truth for template name, structure, and approval status.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| name | TEXT | UNIQUE NOT NULL | Template name as registered with Meta (e.g. `moment_broadcast`) |
| category | TEXT | NOT NULL, CHECK enum | UTILITY / MARKETING |
| language_code | TEXT | NOT NULL, default 'en' | BCP-47 language code |
| status | TEXT | NOT NULL, CHECK enum, default 'pending' | pending / approved / rejected / disabled |
| header_type | TEXT | nullable, CHECK enum | TEXT / IMAGE / VIDEO / DOCUMENT — null if no header |
| header_text | TEXT | nullable | Header text template (may contain `{{1}}`) |
| body_text | TEXT | NOT NULL | Body text template with `{{n}}` placeholders |
| footer_text | TEXT | nullable | Footer text (no variables allowed) |
| button_type | TEXT | nullable, CHECK enum | URL / QUICK_REPLY — null if no button |
| button_label | TEXT | nullable | Button display text |
| button_url | TEXT | nullable | URL template for URL buttons (may contain `{{n}}`) |
| variable_count | INTEGER | NOT NULL, default 0, CHECK >= 0 | Total variable count across all components |
| meta_template_id | TEXT | nullable | Meta's internal template ID after submission |
| submitted_at | TIMESTAMPTZ | nullable | When submitted to Meta for approval |
| approved_at | TIMESTAMPTZ | nullable | When Meta approved |
| created_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**Seed rows (inserted by migration):**
- `welcome_confirmation` — UTILITY, approved
- `unsubscribe_confirmation` — UTILITY, approved
- `moment_broadcast` — MARKETING, pending
- `sponsored_moment` — MARKETING, pending
- `subscription_preferences` — UTILITY, pending

**Rules:**
- Only templates with `status = 'approved'` may be used in broadcasts.
- `status` transitions: `pending → approved`, `pending → rejected`, `approved → disabled`.
- Template content is never edited after approval — create a new template version instead.

**RLS:** authenticated: read. service_role: all.

---

### template_messages

Audit log of every template message sent via the Meta API. One row per recipient per send.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| broadcast_id | UUID | FK broadcasts(id) ON DELETE CASCADE, NOT NULL | |
| moment_id | UUID | FK moments(id) ON DELETE CASCADE, NOT NULL | |
| template_name | TEXT | NOT NULL | Template used (denormalised — template may be deleted) |
| phone_number | TEXT | NOT NULL | Recipient E.164 phone number |
| variables | JSONB | NOT NULL, default '{}' | Variable values sent: `{"1": "value", "2": "value"}` |
| meta_message_id | TEXT | nullable | Meta's message ID from send response |
| status | TEXT | NOT NULL, CHECK enum, default 'sent' | sent / delivered / read / failed |
| error_code | TEXT | nullable | Meta error code if status = failed |
| error_message | TEXT | nullable | Meta error description |
| sent_at | TIMESTAMPTZ | NOT NULL, default NOW() | |
| delivered_at | TIMESTAMPTZ | nullable | Set by delivery receipt webhook |
| read_at | TIMESTAMPTZ | nullable | Set by read receipt webhook |

**Rules:**
- Rows are append-only — never updated except for `status`, `delivered_at`, `read_at` via delivery receipts.
- `variables` stores the exact values sent — not the template text. Enables audit reconstruction.
- Phone numbers are PII — no anon access.

**Indexes:** `broadcast_id`, `moment_id`, `phone_number`, `status`, `sent_at`

**RLS:** authenticated: read. service_role: all.

---

### messaging_windows

Tracks the 24-hour customer service window per phone number.
A window is open when the subscriber last messaged us within the past 24 hours.
Used to determine whether freeform replies are permitted (inbound command responses only).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| phone_number | TEXT | UNIQUE NOT NULL | E.164 format |
| last_inbound_at | TIMESTAMPTZ | NOT NULL | Timestamp of most recent inbound message from this number |
| window_expires_at | TIMESTAMPTZ | NOT NULL | `last_inbound_at + interval '24 hours'` — computed on insert/update |
| updated_at | TIMESTAMPTZ | NOT NULL, auto-updated | |

**Rules:**
- One row per phone number — upserted on every inbound message.
- `window_expires_at` is always `last_inbound_at + interval '24 hours'` — set by trigger, not application code.
- Broadcasts never consult this table — they always use MARKETING templates.
- Inbound command handlers (HELP, STATUS, MYAUTHORITY, opt-in, opt-out) may consult this table before deciding whether to send freeform or template.
- Rows are never deleted — they represent the last known contact time.

**Indexes:** `phone_number`, `window_expires_at`

**RLS:** service_role only. Phone numbers are PII.

---

## Next Step

Generate `supabase/migrations/000_initial_schema.sql` from this document.
One file. Everything in it. Incremental migrations begin only after that baseline is committed.
