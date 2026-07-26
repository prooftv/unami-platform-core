# Data Models — Complete Reference

All fields, types, constraints, and relationships for every table.

---

## moments
The central content unit. Everything revolves around moments.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| title | TEXT | NOT NULL, length 3-200 | |
| content | TEXT | NOT NULL, length 10-2000 | Formatting preserved exactly |
| raw_content | TEXT | nullable | Original before any processing |
| region | TEXT | NOT NULL, CHECK enum | KZN/WC/GP/EC/FS/LP/MP/NC/NW/National |
| category | TEXT | NOT NULL, CHECK enum | Education/Safety/Culture/Opportunity/Events/Health/Technology/Community |
| language | TEXT | default 'eng' | eng/zul/xho/afr |
| sponsor_id | UUID | FK sponsors(id), nullable | |
| is_sponsored | BOOLEAN | default false | |
| pwa_link | TEXT | nullable | Deep link to PWA moment page |
| media_urls | TEXT[] | nullable | Array of public storage URLs |
| scheduled_at | TIMESTAMPTZ | nullable | Future broadcast time |
| broadcasted_at | TIMESTAMPTZ | nullable | When actually broadcast |
| status | TEXT | CHECK enum, default 'draft' | draft/scheduled/broadcasted/cancelled |
| urgency_level | TEXT | CHECK enum, default 'low' | low/medium/high/urgent |
| content_source | TEXT | CHECK enum, default 'admin' | admin/community/whatsapp/campaign |
| created_by | TEXT | nullable | admin user ID or phone number |
| publish_to_whatsapp | BOOLEAN | default false | Admin must explicitly enable |
| publish_to_pwa | BOOLEAN | default true | |
| digest_sent | TIMESTAMPTZ | nullable | When included in weekly digest |
| broadcast_sent | TIMESTAMPTZ | nullable | For urgent moment tracking |
| created_at | TIMESTAMPTZ | default NOW() | |
| updated_at | TIMESTAMPTZ | auto-updated by trigger | |

---

## sponsors

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| name | TEXT | UNIQUE NOT NULL | Slug: "unami-foundation" |
| display_name | TEXT | NOT NULL | Shown to users: "Unami Foundation" |
| contact_email | TEXT | nullable | |
| logo_url | TEXT | nullable | |
| website_url | TEXT | nullable | |
| tier | TEXT | CHECK enum, default 'bronze' | bronze/silver/gold/platinum |
| monthly_budget | DECIMAL(10,2) | default 0 | ZAR |
| active | BOOLEAN | default true | |
| created_at | TIMESTAMPTZ | default NOW() | |
| updated_at | TIMESTAMPTZ | auto-updated | |

---

## campaigns

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| title | TEXT | NOT NULL | |
| content | TEXT | NOT NULL | |
| category | TEXT | NOT NULL | |
| sponsor_id | UUID | FK sponsors(id), nullable | |
| budget | DECIMAL(10,2) | default 0 | ZAR |
| target_regions | TEXT[] | nullable | Provinces to target |
| target_categories | TEXT[] | nullable | Categories to target |
| media_urls | TEXT[] | nullable | |
| scheduled_at | TIMESTAMPTZ | nullable | |
| status | TEXT | CHECK enum | pending_review/approved/active/paused/completed/cancelled/published |
| template_name | TEXT | nullable | WhatsApp template used |
| created_by | TEXT | nullable | Admin user ID |
| created_at | TIMESTAMPTZ | default NOW() | |
| updated_at | TIMESTAMPTZ | auto-updated | |

---

## subscriptions
WhatsApp users who have opted in.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| phone_number | TEXT | UNIQUE NOT NULL, CHECK E.164 | Must start with + |
| opted_in | BOOLEAN | default true | |
| regions | TEXT[] | default ['National'] | Provinces subscribed to |
| categories | TEXT[] | default all categories | |
| language_preference | TEXT | default 'eng' | |
| delivery_schedule | TEXT | default 'instant' | instant/morning/evening/weekly |
| paused_until | TIMESTAMPTZ | nullable | Pause end time |
| opted_in_at | TIMESTAMPTZ | default NOW() | |
| opted_out_at | TIMESTAMPTZ | nullable | |
| last_activity | TIMESTAMPTZ | default NOW() | Last message sent/received |
| consent_timestamp | TIMESTAMPTZ | nullable | POPIA compliance |
| consent_method | TEXT | nullable | 'whatsapp_optin' |
| double_opt_in_confirmed | BOOLEAN | default false | |
| created_at | TIMESTAMPTZ | default NOW() | |

---

## messages
All inbound WhatsApp messages (content only, not commands).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| whatsapp_id | TEXT | UNIQUE NOT NULL | Meta's message ID for dedup |
| from_number | TEXT | NOT NULL | E.164 format |
| message_type | TEXT | CHECK enum | text/image/audio/video/document |
| content | TEXT | nullable | Text content |
| media_url | TEXT | nullable | Public URL after download |
| media_id | TEXT | nullable | Meta's media ID |
| language_detected | TEXT | nullable | Detected language code |
| authority_context | JSONB | nullable | Authority profile snapshot at time of message |
| timestamp | TIMESTAMPTZ | default NOW() | |
| processed | BOOLEAN | default false | |
| moderation_status | TEXT | CHECK enum, default 'pending' | pending/approved/flagged/rejected |
| created_at | TIMESTAMPTZ | default NOW() | |
| updated_at | TIMESTAMPTZ | auto-updated | |

---

## moment_intents
Publishing pipeline. One row per channel per moment.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| moment_id | UUID | FK moments(id) CASCADE | |
| channel | TEXT | CHECK enum | pwa/whatsapp/email/sms |
| action | TEXT | CHECK enum | publish/update/delete |
| status | TEXT | CHECK enum, default 'pending' | pending/processing/sent/failed/cancelled |
| template_id | TEXT | nullable | WhatsApp template name |
| payload | JSONB | nullable | {title, full_text, summary, link, region} |
| attempts | INTEGER | default 0 | Retry counter |
| last_attempt_at | TIMESTAMPTZ | nullable | |
| last_error | TEXT | nullable | Error message on failure |
| created_at | TIMESTAMPTZ | default NOW() | |
| updated_at | TIMESTAMPTZ | auto-updated | |
| UNIQUE | (moment_id, channel) | | No duplicate intents |

---

## broadcasts
Execution log for each broadcast run.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| moment_id | UUID | FK moments(id) CASCADE | |
| campaign_id | UUID | FK campaigns(id), nullable | |
| recipient_count | INTEGER | default 0, >= 0 | |
| success_count | INTEGER | default 0, >= 0 | |
| failure_count | INTEGER | default 0, >= 0 | |
| broadcast_started_at | TIMESTAMPTZ | default NOW() | |
| broadcast_completed_at | TIMESTAMPTZ | nullable | |
| status | TEXT | CHECK enum | pending/processing/completed/failed |
| authority_context | JSONB | nullable | Authority snapshot used for filtering |
| error_details | JSONB | nullable | |
| created_at | TIMESTAMPTZ | default NOW() | |

---

## broadcast_batches
Parallel batch processing for large subscriber lists.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| broadcast_id | UUID | FK broadcasts(id) CASCADE | |
| batch_number | INTEGER | NOT NULL | |
| recipients | TEXT[] | NOT NULL | Phone numbers in this batch |
| status | TEXT | CHECK enum | pending/processing/completed/failed |
| success_count | INTEGER | default 0 | |
| failure_count | INTEGER | default 0 | |
| started_at | TIMESTAMPTZ | nullable | |
| completed_at | TIMESTAMPTZ | nullable | |
| created_at | TIMESTAMPTZ | default NOW() | |

---

## advisories
MCP analysis results.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| message_id | UUID | FK messages(id) CASCADE, nullable | |
| moment_id | UUID | FK moments(id) CASCADE, nullable | |
| advisory_type | TEXT | CHECK enum | language/urgency/harm/spam/content_quality |
| confidence | DECIMAL(3,2) | 0-1 | Overall risk score |
| harm_signals | JSONB | nullable | {violence, harassment, threats, hate_speech} |
| spam_indicators | JSONB | nullable | {promotional, repetitive, links, financial_fraud} |
| urgency_level | TEXT | default 'low' | low/medium/high/urgent |
| escalation_suggested | BOOLEAN | default false | confidence > 0.7 |
| details | JSONB | nullable | Full analysis output |
| created_at | TIMESTAMPTZ | default NOW() | |

---

## moderation_audit
Human moderation action log.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| message_id | UUID | FK messages(id) CASCADE, nullable | |
| moment_id | UUID | FK moments(id) CASCADE, nullable | |
| action | TEXT | CHECK enum | approved/flagged/rejected |
| moderator | TEXT | NOT NULL | Admin user ID or 'system_auto' |
| reason | TEXT | nullable | |
| timestamp | TIMESTAMPTZ | default NOW() | |
| created_at | TIMESTAMPTZ | default NOW() | |

---

## media
Media attachments.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| message_id | UUID | FK messages(id) CASCADE, nullable | |
| moment_id | UUID | FK moments(id) CASCADE, nullable | |
| whatsapp_media_id | TEXT | nullable | Meta's media ID |
| media_type | TEXT | CHECK enum | image/audio/video/document |
| original_url | TEXT | nullable | Meta's temporary URL |
| storage_path | TEXT | nullable | Supabase Storage path |
| file_size | BIGINT | > 0 | Bytes |
| mime_type | TEXT | nullable | |
| processed | BOOLEAN | default false | |
| created_at | TIMESTAMPTZ | default NOW() | |

---

## authority_profiles

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| user_identifier | TEXT | NOT NULL | Phone number or user ID |
| authority_level | INTEGER | default 1, 1-5 | |
| role_label | TEXT | NOT NULL | "Community Leader", "NGO Partner" |
| scope | TEXT | NOT NULL | community/region/province/national |
| scope_identifier | TEXT | nullable | e.g., 'KZN' for province scope |
| approval_mode | TEXT | default 'admin_review' | admin_review/ai_review/auto |
| blast_radius | INTEGER | default 100 | Max subscribers reachable |
| risk_threshold | DECIMAL(3,2) | default 0.7 | MCP auto-approve threshold |
| status | TEXT | default 'active' | active/suspended/expired |
| valid_until | TIMESTAMPTZ | nullable | Expiry date |
| metadata | JSONB | default {} | Extra context |
| created_by | TEXT | nullable | Admin user ID |
| updated_by | TEXT | nullable | |
| created_at | TIMESTAMPTZ | default NOW() | |
| updated_at | TIMESTAMPTZ | auto-updated | |

---

## authority_audit_log

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| authority_profile_id | UUID | FK authority_profiles(id) |
| action | TEXT | created/updated/suspended/enforced |
| actor_id | TEXT | Admin user ID who performed action |
| context | JSONB | Action-specific context |
| timestamp | TIMESTAMPTZ | default NOW() |

---

## admin_roles
Maps Supabase Auth user IDs to admin roles.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | Supabase Auth user ID, UNIQUE |
| role | TEXT | superadmin/content_admin/moderator/viewer |
| granted_by | TEXT | Admin user ID who granted role |
| granted_at | TIMESTAMPTZ | default NOW() |

---

## system_settings

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| setting_key | TEXT | UNIQUE NOT NULL |
| setting_value | TEXT | NOT NULL |
| description | TEXT | nullable |
| updated_at | TIMESTAMPTZ | auto-updated |
| created_at | TIMESTAMPTZ | default NOW() |

---

## comments
Community comments on moments (from WhatsApp replies).

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| moment_id | UUID | FK moments(id) CASCADE |
| from_number | TEXT | NOT NULL |
| content | TEXT | NOT NULL, max 500 chars |
| moderation_status | TEXT | pending/approved/rejected |
| featured | BOOLEAN | default false |
| reply_count | INTEGER | default 0 |
| created_at | TIMESTAMPTZ | default NOW() |
| updated_at | TIMESTAMPTZ | auto-updated |

---

## whatsapp_comments
Links WhatsApp message IDs to comments/moments for reply threading.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| whatsapp_message_id | TEXT | UNIQUE — Meta's message ID |
| comment_id | UUID | FK comments(id), nullable |
| from_number | TEXT | NOT NULL |
| moment_id | UUID | FK moments(id) |
| reply_to_message_id | TEXT | nullable — for threading |
| media_type | TEXT | text/image/audio/video |
| created_at | TIMESTAMPTZ | default NOW() |

---

## feature_flags

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| flag_key | TEXT | UNIQUE NOT NULL |
| enabled | BOOLEAN | default false |
| description | TEXT | nullable |
| updated_at | TIMESTAMPTZ | auto-updated |

---

## rate_limits

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| identifier | TEXT | IP address or user ID |
| endpoint | TEXT | API endpoint path |
| request_count | INTEGER | Requests in current window |
| window_start | TIMESTAMPTZ | Window start time |

---

## audit_logs
Admin action audit trail.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | TEXT | Admin user ID |
| action | TEXT | create/update/delete/approve/etc |
| resource_type | TEXT | moment/campaign/sponsor/etc |
| resource_id | TEXT | ID of affected resource |
| changes | JSONB | Before/after or request body |
| created_at | TIMESTAMPTZ | default NOW() |

---

## error_logs

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| error_type | TEXT | Category of error |
| error_message | TEXT | Error message |
| context | JSONB | Request context, IDs |
| severity | TEXT | low/medium/high/critical |
| created_at | TIMESTAMPTZ | default NOW() |

---

## moment_stats
Per-moment engagement counters.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| moment_id | UUID | UNIQUE FK moments(id) CASCADE |
| view_count | INTEGER | default 0 |
| comment_count | INTEGER | default 0 |
| share_count | INTEGER | default 0 |
| reaction_count | INTEGER | default 0 |
| updated_at | TIMESTAMPTZ | auto-updated |

---

## user_profiles
Anonymous community member profiles (keyed by phone number).

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| phone_number | TEXT | UNIQUE NOT NULL |
| display_name | TEXT | nullable |
| avatar_url | TEXT | nullable |
| bio | TEXT | max 200 chars |
| reputation_score | INTEGER | default 0 |
| total_comments | INTEGER | default 0 |
| total_featured | INTEGER | default 0 |
| created_at | TIMESTAMPTZ | default NOW() |
| updated_at | TIMESTAMPTZ | auto-updated |

---

## marketing_compliance
Compliance record per broadcast.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| moment_id | UUID | FK moments(id) |
| broadcast_id | UUID | FK broadcasts(id) |
| template_used | TEXT | WhatsApp template name |
| template_category | TEXT | UTILITY/MARKETING |
| sponsor_disclosed | BOOLEAN | Was sponsor attribution included |
| opt_out_included | BOOLEAN | Was STOP instruction included |
| pwa_link_included | BOOLEAN | Was PWA link included |
| compliance_score | INTEGER | 0-100 |
| created_at | TIMESTAMPTZ | default NOW() |

---

## budget_transactions
Spend tracking per campaign broadcast.

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| campaign_id | UUID | FK campaigns(id) |
| transaction_type | TEXT | spend/refund/adjustment |
| amount | DECIMAL(10,2) | ZAR |
| recipient_count | INTEGER | Messages sent |
| cost_per_recipient | DECIMAL(6,4) | ZAR per message |
| status | TEXT | completed/pending/failed |
| created_at | TIMESTAMPTZ | default NOW() |
