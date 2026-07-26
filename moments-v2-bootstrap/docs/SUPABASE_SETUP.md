# Supabase Setup Guide

## Project Configuration

### 1. Create Supabase Project
- Go to supabase.com → New Project
- Region: Africa (Cape Town) — closest to SA users
- Database password: generate strong password, store securely

### 2. Apply Database Schema
Paste `supabase/migrations/0001_initial.sql` into SQL Editor and run.
This creates all tables, indexes, RLS policies, functions, and triggers.

### 3. Configure Auth
- Authentication → Settings
- Enable Email provider
- Disable "Confirm email" for admin users (or set up SMTP)
- Set Site URL: https://admin.moments.unamifoundation.org
- Add redirect URLs: https://admin.moments.unamifoundation.org/auth/callback

### 4. Create Storage Bucket
Run in SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;
```

### 5. Deploy Edge Functions
```bash
supabase login
supabase link --project-ref <your-project-ref>

supabase functions deploy webhook
supabase functions deploy admin-api
supabase functions deploy broadcast-processor
supabase functions deploy mcp-advisory
```

### 6. Set Edge Function Secrets
```bash
supabase secrets set WHATSAPP_TOKEN=<token>
supabase secrets set WHATSAPP_PHONE_ID=<phone-id>
supabase secrets set WEBHOOK_VERIFY_TOKEN=<verify-token>
supabase secrets set WEBHOOK_HMAC_SECRET=<hmac-secret>
supabase secrets set INTERNAL_WEBHOOK_SECRET=<internal-secret>
supabase secrets set ANTHROPIC_API_KEY=<claude-key>
supabase secrets set N8N_WEBHOOK_URL=<n8n-url>
```

### 7. Seed Initial Data
```sql
-- Create first superadmin (after creating user in Supabase Auth dashboard)
INSERT INTO admin_roles (user_id, role, granted_by)
VALUES ('<supabase-auth-user-id>', 'superadmin', 'system');

-- Create Unami Foundation sponsor
INSERT INTO sponsors (name, display_name, contact_email, tier, active)
VALUES ('unami-foundation', 'Unami Foundation', 'info@unamifoundation.org', 'platinum', true);

-- Default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('monthly_budget', '10000', 'Monthly broadcast budget in ZAR'),
('warning_threshold', '80', 'Budget warning threshold percentage'),
('message_cost', '0.05', 'Cost per WhatsApp message in ZAR'),
('daily_limit', '500', 'Maximum messages per day'),
('broadcast_batch_size', '50', 'Subscribers per broadcast batch'),
('auto_approve_threshold', '0.3', 'MCP confidence threshold for auto-approval')
ON CONFLICT (setting_key) DO NOTHING;

-- Default feature flags
INSERT INTO feature_flags (flag_key, enabled, description) VALUES
('comments_enabled', true, 'Enable WhatsApp comment threading'),
('authority_system_enabled', true, 'Enable dynamic authority profiles'),
('ab_testing_enabled', true, 'Enable A/B testing for campaigns'),
('claude_analysis_enabled', false, 'Enable Claude API for MCP analysis')
ON CONFLICT (flag_key) DO NOTHING;
```

---

## RLS Policy Strategy

### Public (anon key) — READ ONLY
- moments: SELECT WHERE status = 'broadcasted'
- sponsors: SELECT WHERE active = true
- moment_stats: SELECT (all)
- user_profiles: SELECT (all)
- comments: SELECT WHERE moderation_status = 'approved'

### Service Role (Edge Functions only) — FULL ACCESS
- All tables: full CRUD
- Bypasses all RLS policies

### Authenticated (admin users) — ROLE-BASED
- Enforced in API layer (not RLS) for flexibility
- RLS just requires authentication for admin tables

### No Direct Client Access
- Frontend never uses service role key
- Frontend uses anon key only for auth (Supabase Auth SDK)
- All data operations go through Edge Function API

---

## Key SQL Functions

### mcp_advisory(message_content, language, type, from_number, timestamp)
Content moderation analysis. Returns JSONB with harm_signals, spam_indicators,
urgency_level, overall_confidence, escalation_suggested.

### lookup_authority(p_user_identifier)
Returns authority profile for a phone number or user ID.
Used by webhook and broadcast to apply authority-based filtering.

### log_authority_action(p_authority_profile_id, p_action, p_actor_id, p_context)
Inserts into authority_audit_log. Called on create/update/suspend/enforce.

### update_messaging_window(user_phone)
Updates the 24-hour messaging window for a subscriber.
Enables freeform messages (not just templates) within 24h of last inbound.

### refresh_analytics()
Refreshes all materialized views (unified_analytics, daily_stats, etc.)
Called by POST /analytics/refresh or scheduled job.

### check_campaign_budget(p_campaign_id, p_spend_amount)
Returns {allowed: boolean, reason: string}.
Checks if campaign has sufficient budget for a broadcast.

### update_campaign_stats(p_campaign_id, p_recipient_count, p_cost)
Updates campaign metrics after broadcast.

---

## Materialized Views

### unified_analytics
Single row with all key metrics. Refreshed on demand.
```
total_moments, active_subscribers, total_broadcasts,
broadcasts_today, delivery_rate_7d, sponsored_moments,
template_v2_adoption, avg_compliance_score, last_updated
```

### daily_stats
Per-day aggregates for the last 90 days.
```
stat_date, moments_count, broadcasts_count, new_subscribers,
success_count, failure_count
```

### regional_stats
Per-province aggregates.
```
region, moment_count, broadcast_count, subscriber_count
```

### category_stats
Per-category aggregates.
```
category, moment_count, broadcast_count
```

---

## Database Triggers

### update_updated_at_column
Fires BEFORE UPDATE on moments, messages, sponsors, campaigns.
Sets updated_at = NOW() automatically.

### moments_mcp_trigger
Fires AFTER INSERT on moments.
Creates a pending advisory record for admin-created moments.

### comment_count_trigger
Fires AFTER INSERT/DELETE on comments.
Updates moment_stats.comment_count and user_profiles.total_comments.

### reply_count_trigger
Fires AFTER INSERT/DELETE on comment_threads.
Updates comments.reply_count.

---

## Edge Function URLs

After deployment, functions are available at:
```
https://<project-ref>.supabase.co/functions/v1/webhook
https://<project-ref>.supabase.co/functions/v1/admin-api
https://<project-ref>.supabase.co/functions/v1/broadcast-processor
https://<project-ref>.supabase.co/functions/v1/mcp-advisory
```

## WhatsApp Webhook Configuration
Set in Meta Developer Console:
- Callback URL: `https://<project-ref>.supabase.co/functions/v1/webhook`
- Verify Token: value of WEBHOOK_VERIFY_TOKEN secret
- Subscribed fields: messages
