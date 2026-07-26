# Architecture & Data Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL LAYER                           │
│  WhatsApp Users ──► Meta Cloud API ──► /webhook Edge Function   │
│  Admin Users    ──► Admin Dashboard ──► /admin-api Edge Function│
│  Public Users   ──► Web PWA         ──► /admin-api (public)     │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      SUPABASE LAYER                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   webhook/   │  │  admin-api/  │  │  broadcast-processor/│  │
│  │  index.ts    │  │  index.ts    │  │  index.ts            │  │
│  │              │  │              │  │                      │  │
│  │ - Verify WA  │  │ - Auth/RBAC  │  │ - Process intents    │  │
│  │ - Parse msgs │  │ - CRUD ops   │  │ - Send via WA API    │  │
│  │ - MCP call   │  │ - Analytics  │  │ - Update status      │  │
│  │ - Store msgs │  │ - Broadcasts │  │                      │  │
│  │ - Commands   │  │              │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│  ┌──────▼─────────────────▼──────────────────────▼───────────┐  │
│  │                    PostgreSQL Database                     │  │
│  │  messages │ moments │ moment_intents │ subscriptions       │  │
│  │  sponsors │ campaigns │ broadcasts │ advisories            │  │
│  │  admin_users │ admin_roles │ authority_profiles            │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                        n8n LAYER                                │
│                                                                 │
│  intent-executor (cron: every 1 min)                            │
│    ├── Fetch pending moment_intents WHERE channel='whatsapp'    │
│    ├── Fetch opted-in subscriptions                             │
│    ├── Filter by region                                         │
│    ├── Send via WhatsApp Cloud API                              │
│    └── Update intent status → 'sent' or 'failed'               │
│                                                                 │
│  inbound-message (webhook trigger)                              │
│    └── Route complex message flows                              │
└─────────────────────────────────────────────────────────────────┘
```

## Core Data Flow: Creating & Broadcasting a Moment

```
Admin creates Moment
        │
        ▼
POST /admin-api/moments
        │
        ▼
Insert into moments table (status: 'draft')
        │
        ▼
Insert into moment_intents (channel: 'pwa', status: 'pending')
Insert into moment_intents (channel: 'whatsapp', status: 'pending') [if publish_to_whatsapp=true]
        │
        ▼
Admin clicks "Broadcast"
        │
        ▼
POST /admin-api/moments/:id/broadcast
        │
        ▼
Update moment status → 'broadcasted'
Upsert moment_intent (channel: 'whatsapp', status: 'pending')
        │
        ▼
n8n intent-executor (runs every 1 min)
        │
        ├── Fetches pending whatsapp intents
        ├── Fetches opted-in subscribers (filtered by region)
        ├── Sends WhatsApp message to each subscriber
        └── Updates intent status → 'sent' (or 'failed' with error)
```

## WhatsApp Message Flow (Inbound)

```
User sends WhatsApp message
        │
        ▼
Meta Cloud API → POST /webhook
        │
        ▼
Verify HMAC signature
        │
        ▼
Parse message type (text/image/audio/video/document/interactive)
        │
        ├── Is command? (START/STOP/HELP/REGIONS/INTERESTS/STATUS/etc.)
        │       └── Handle command, send response, return
        │
        ├── Is interactive button/list reply?
        │       └── Route to button handler, return
        │
        └── Is content message?
                ├── Dedup check (whatsapp_id)
                ├── Authority lookup (fail-open)
                ├── Store in messages table
                ├── MCP analysis (SQL function + Claude fallback)
                ├── Store advisory
                ├── Auto-approve if confidence < threshold
                ├── Download & store media if present
                └── Create draft moment for admin review
```

## MCP (Content Intelligence) Architecture

```
Incoming message content
        │
        ▼
mcp_advisory() SQL function (always runs, fast)
        │
        ├── Harm detection (regex patterns, SA-specific)
        ├── Spam detection (scam patterns, financial fraud)
        ├── Urgency classification
        └── Returns: confidence score, harm_signals, spam_indicators
        │
        ▼
If ANTHROPIC_API_KEY set → Claude API analysis (async, enriches)
        │
        ▼
Store in advisories table
        │
        ▼
Auto-approve if confidence < authority threshold (default: 0.3)
Escalate to admin if confidence > 0.7
```

## Authority System

The authority system allows trusted community members to have elevated
content privileges without being full admins.

```
authority_profiles table:
  - user_identifier: phone number or user ID
  - authority_level: 1-5 (1=community, 5=national)
  - role_label: "Community Leader", "NGO Partner", etc.
  - scope: 'community' | 'region' | 'province' | 'national'
  - scope_identifier: e.g., 'KZN' for province scope
  - approval_mode: 'admin_review' | 'ai_review' | 'auto'
  - blast_radius: max subscribers for their broadcasts
  - risk_threshold: MCP confidence threshold for auto-approval

Effects:
  - Lower risk_threshold → more content auto-approved
  - Higher blast_radius → reaches more subscribers
  - approval_mode='auto' → bypasses admin review queue
  - scope='national' → content goes to all regions
```

## RBAC (Admin Roles)

```
superadmin     → Full access, user management, system settings
content_admin  → Create/edit moments, campaigns, sponsors
moderator      → Review flagged content, approve/reject messages
viewer         → Read-only access to all data
```

## Campaign → Moment Pipeline

```
Campaign created (status: pending_review)
        │
        ▼
Content admin reviews
        │
        ▼
Superadmin approves (status: approved)
        │
        ▼
Superadmin publishes
        │
        ├── Creates Moment from campaign data
        ├── Sets publish_to_whatsapp=true
        ├── Sets publish_to_pwa=true
        ├── Creates moment_intents for both channels
        └── Updates campaign status → 'published'
```

## Database Key Relationships

```
sponsors ──────────────────────────────────────────────────────┐
    │                                                           │
    └──► campaigns ──────────────────────────────────────────┐ │
                │                                            │ │
                └──► moments ◄───────────────────────────────┘ │
                        │                                       │
                        ├──► moment_intents                     │
                        │         └──► (n8n processes these)    │
                        ├──► broadcasts                         │
                        │         └──► broadcast_batches        │
                        └──► advisories                         │
                                                                │
messages ──► advisories                                         │
    │                                                           │
    └──► media                                                  │
                                                                │
subscriptions (WhatsApp users)                                  │
    └──► (filtered when broadcasting moments)                   │
                                                                │
admin_users ──► admin_roles ──► admin_sessions                  │
authority_profiles ──► authority_audit_log                      │
```

## Separation of Concerns

```
apps/admin/     → UI only. No Supabase calls. No business logic.
                  All data via fetch() to /admin-api Edge Function.

apps/web/       → UI only. No Supabase calls.
                  Public data via fetch() to /admin-api public endpoints.

supabase/functions/admin-api/
                → All business logic. Supabase service role.
                  Auth validation, RBAC, data operations.

supabase/functions/webhook/
                → WhatsApp message processing.
                  MCP analysis, subscription management.

supabase/functions/broadcast-processor/
                → Called by n8n or directly.
                  Processes moment_intents, sends WhatsApp messages.

n8n/            → Orchestration only.
                  Polls intents, triggers broadcast-processor.
```
