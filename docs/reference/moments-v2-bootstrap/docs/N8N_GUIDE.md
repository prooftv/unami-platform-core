# n8n Workflows Guide

## Overview
n8n handles all async orchestration — it never blocks the API response.
All workflows communicate with Supabase via REST API using service role key.

---

## Workflow 1: Intent Executor (CRITICAL — runs every 1 min)

**Purpose:** Poll `moment_intents` for pending WhatsApp intents and send messages.

**Trigger:** Cron — every 1 minute

**Flow:**
```
Cron trigger (every 1 min)
  → GET /rest/v1/moment_intents?status=eq.pending&channel=eq.whatsapp
  → Split into batches of 1 (process each intent)
  → GET /rest/v1/subscriptions?opted_in=eq.true
  → Filter subscribers by moment region
  → Check paused_until (skip paused subscribers)
  → Check delivery_schedule (skip if not their delivery window)
  → For each subscriber: POST WhatsApp message
  → PATCH moment_intents SET status='sent', attempts++
  → On error: PATCH status='failed', last_error=<message>
```

**Environment vars needed:**
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE
WHATSAPP_TOKEN
PHONE_NUMBER_ID
```

**File:** `n8n/intent-executor-workflow.json`

---

## Workflow 2: Inbound Message Router

**Purpose:** Route complex inbound message flows from webhook.

**Trigger:** Webhook (POST from Supabase webhook function)

**Flow:**
```
Webhook trigger
  → Parse message type
  → Route: command / media / community content / reply
  → For community content: trigger MCP analysis
  → For media: download and store
  → Update message status
```

**File:** `n8n/inbound-message-workflow.json`

---

## Workflow 3: Scheduled Broadcasts

**Purpose:** Process moments scheduled for future broadcast.

**Trigger:** Cron — every 5 minutes

**Flow:**
```
Cron trigger (every 5 min)
  → GET moments WHERE status='scheduled' AND scheduled_at <= now()
  → For each: PATCH status='broadcasted', broadcasted_at=now()
  → INSERT moment_intents (channel='whatsapp', status='pending')
  → INSERT moment_intents (channel='pwa', status='pending')
```

**File:** `n8n/scheduled-broadcasts-workflow.json`

---

## Workflow 4: Weekly Digest

**Purpose:** Send weekly digest to subscribers with `delivery_schedule='weekly'`.

**Trigger:** Cron — every Friday at 9 AM SAST (07:00 UTC)

**Flow:**
```
Cron trigger (Friday 07:00 UTC)
  → GET moments broadcasted in last 7 days
  → Group by region
  → GET subscriptions WHERE delivery_schedule='weekly' AND opted_in=true
  → Build digest message per region
  → Send WhatsApp message to each subscriber
  → Log in broadcasts table
```

**File:** `n8n/digest-workflow.json`

---

## Workflow 5: Campaign Budget Tracker

**Purpose:** Track spend and alert when budget thresholds hit.

**Trigger:** Cron — every hour

**Flow:**
```
Cron trigger (every hour)
  → GET campaign_budgets with spent_amount
  → Calculate utilization %
  → If utilization > warning_threshold: POST alert to admin webhook
  → If utilization > 100%: PATCH campaign status='paused'
```

**File:** `n8n/campaign-budget-workflow.json`

---

## Workflow 6: Retry Failed Intents

**Purpose:** Retry failed WhatsApp intents up to 3 times.

**Trigger:** Cron — every 15 minutes

**Flow:**
```
Cron trigger (every 15 min)
  → GET moment_intents WHERE status='failed' AND attempts < 3
  → For each: reset status='pending'
  → Intent executor will pick them up on next run
```

**File:** `n8n/retry-workflow.json`

---

## n8n Setup Instructions

### 1. Install n8n
```bash
# Docker (recommended)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Or npm
npm install -g n8n
n8n start
```

### 2. Set Environment Variables
In n8n Settings → Environment Variables:
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE=<service-role-key>
SUPABASE_ANON_KEY=<anon-key>
WHATSAPP_TOKEN=<meta-api-token>
PHONE_NUMBER_ID=<phone-number-id>
INTERNAL_WEBHOOK_SECRET=<secret>
```

### 3. Import Workflows
- Go to Workflows → Import from File
- Import each JSON file from `n8n/` directory
- Activate each workflow

### 4. Configure Credentials
- Create "Header Auth" credential for Supabase calls
- Create "Header Auth" credential for WhatsApp API

### 5. Test Intent Executor
```sql
-- Insert a test intent
INSERT INTO moment_intents (moment_id, channel, action, status, payload)
SELECT id, 'whatsapp', 'publish', 'pending',
  jsonb_build_object('title', title, 'full_text', content, 'link', 'https://test.com')
FROM moments LIMIT 1;

-- Watch n8n execute within 1 minute
-- Check: SELECT status FROM moment_intents ORDER BY created_at DESC LIMIT 1;
```
