# API Contracts

All API endpoints are served by the `admin-api` Supabase Edge Function.
Base URL: `https://<project>.supabase.co/functions/v1/admin-api`

## Authentication

All admin endpoints require:
```
Authorization: Bearer <supabase_jwt_token>
```

Public endpoints (no auth):
- `GET /api/moments` — public moments feed
- `GET /api/stats` — public stats
- `GET /health` — health check

---

## Auth Endpoints

### POST /auth/login
Login with email + password.
```json
// Request
{ "email": "admin@example.com", "password": "..." }

// Response 200
{
  "access_token": "<supabase_jwt>",
  "user": { "id": "uuid", "email": "...", "name": "..." },
  "role": "superadmin"
}

// Response 401
{ "error": "Invalid credentials" }
```

### GET /auth/me
Get current user + role.
```json
// Response 200
{
  "user": { "id": "uuid", "email": "...", "name": "..." },
  "role": "superadmin | content_admin | moderator | viewer"
}
```

### POST /auth/logout
Invalidate session.
```json
// Response 200
{ "success": true }
```

---

## Moments Endpoints

### GET /moments
List moments with pagination and filters. (Admin: all statuses. Public: broadcasted only)
```
Query params:
  page=1, limit=20
  status=draft|scheduled|broadcasted|cancelled
  region=KZN|WC|GP|EC|FS|LP|MP|NC|NW|National
  category=Education|Safety|Culture|Opportunity|Events|Health|Technology|Community
  source=admin|community|whatsapp|campaign
  search=<text>

Response 200:
{
  "moments": [
    {
      "id": "uuid",
      "title": "...",
      "content": "...",
      "region": "KZN",
      "category": "Education",
      "language": "eng",
      "status": "broadcasted",
      "urgency_level": "low|medium|high|urgent",
      "is_sponsored": false,
      "sponsor_id": null,
      "sponsor": { "display_name": "..." },
      "pwa_link": "https://...",
      "media_urls": [],
      "scheduled_at": null,
      "broadcasted_at": "2024-01-01T00:00:00Z",
      "publish_to_whatsapp": true,
      "publish_to_pwa": true,
      "content_source": "admin",
      "created_by": "admin",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### POST /moments
Create a new moment.
```json
// Request
{
  "title": "Community Garden Opens",
  "content": "Full content here...",
  "region": "KZN",
  "category": "Opportunity",
  "language": "eng",
  "sponsor_id": "uuid | null",
  "is_sponsored": false,
  "pwa_link": "https://...",
  "media_urls": ["https://..."],
  "scheduled_at": "2024-06-01T09:00:00Z | null",
  "status": "draft | scheduled",
  "urgency_level": "low | medium | high | urgent",
  "publish_to_pwa": true,
  "publish_to_whatsapp": false
}

// Response 201
{ "moment": { ...moment object... } }

// Response 400
{ "error": "Missing required fields: title, content, region, category" }
```

### PUT /moments/:id
Update a moment. Cannot update broadcasted moments.
```json
// Request — any subset of moment fields
{ "title": "Updated title", "status": "scheduled" }

// Response 200
{ "moment": { ...updated moment... } }

// Response 400
{ "error": "Cannot update broadcasted moments" }
```

### DELETE /moments/:id
Delete a moment and its related broadcasts/intents.
```json
// Response 200
{ "success": true }
```

### POST /moments/:id/broadcast
Immediately queue a moment for WhatsApp broadcast.
```json
// Response 200
{
  "success": true,
  "moment_id": "uuid",
  "intent_id": "uuid",
  "message": "Moment queued for WhatsApp broadcast. n8n will process within 1 minute."
}
```

### POST /moments/:id/schedule
Schedule a moment for future broadcast.
```json
// Request
{ "scheduled_at": "2024-06-01T09:00:00Z" }

// Response 200
{ "moment": { ...moment with status: 'scheduled'... } }
```

---

## Campaigns Endpoints

### GET /campaigns
```
Query params: page, limit, status, sponsor_id

Response 200:
{
  "campaigns": [
    {
      "id": "uuid",
      "title": "...",
      "content": "...",
      "category": "...",
      "sponsor_id": "uuid",
      "sponsor": { "display_name": "..." },
      "budget": 5000.00,
      "target_regions": ["KZN", "WC"],
      "target_categories": ["Education"],
      "media_urls": [],
      "scheduled_at": null,
      "status": "pending_review|approved|active|paused|completed|cancelled|published",
      "template_name": "community_moment_v1",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "pagination": { ... }
}
```

### POST /campaigns
Requires: content_admin or superadmin role.
```json
// Request
{
  "title": "...",
  "content": "...",
  "category": "Education",
  "sponsor_id": "uuid",
  "budget": 5000.00,
  "target_regions": ["KZN"],
  "target_categories": ["Education"],
  "media_urls": [],
  "scheduled_at": null
}

// Response 201
{ "campaign": { ... } }
```

### PUT /campaigns/:id
Requires: content_admin or superadmin.
```json
// Request — any subset of campaign fields
{ "status": "paused" }

// Response 200
{ "campaign": { ... } }
```

### POST /campaigns/:id/approve
Requires: superadmin only.
```json
// Response 200
{ "campaign": { ...with status: 'approved'... } }
```

### POST /campaigns/:id/publish
Requires: superadmin only. Creates a Moment from the campaign and queues broadcast.
```json
// Response 200
{
  "success": true,
  "campaign_id": "uuid",
  "moment_id": "uuid",
  "recipient_count": 1250
}
```

### POST /campaigns/:id/broadcast
Requires: superadmin. Broadcast campaign to subscribers with budget check.
```json
// Response 200
{
  "success": true,
  "campaign_id": "uuid",
  "moment_id": "uuid",
  "recipient_count": 1250,
  "template": "verified_sponsored_v1",
  "estimated_cost": 62.50
}

// Response 403
{ "error": "Budget exceeded: spent 4800 of 5000 budget" }
```

### DELETE /campaigns/:id
```json
// Response 200
{ "success": true }
```

---

## Sponsors Endpoints

### GET /sponsors
```json
// Response 200
{
  "sponsors": [
    {
      "id": "uuid",
      "name": "unami-foundation",
      "display_name": "Unami Foundation",
      "contact_email": "...",
      "logo_url": "https://...",
      "website_url": "https://...",
      "tier": "bronze|silver|gold|platinum",
      "monthly_budget": 10000.00,
      "active": true,
      "created_at": "..."
    }
  ]
}
```

### POST /sponsors
```json
// Request
{
  "name": "acme-corp",
  "display_name": "ACME Corporation",
  "contact_email": "sponsor@acme.com",
  "logo_url": "https://...",
  "website_url": "https://...",
  "tier": "gold",
  "monthly_budget": 10000.00
}

// Response 201
{ "sponsor": { ... } }
```

### PUT /sponsors/:id
```json
// Request — any subset
{ "tier": "platinum", "monthly_budget": 25000 }

// Response 200
{ "sponsor": { ... } }
```

### DELETE /sponsors/:id
```json
// Response 200
{ "success": true }
```

---

## Analytics Endpoints

### GET /analytics
Main dashboard metrics.
```json
// Response 200
{
  "totalMoments": 245,
  "broadcastedMoments": 198,
  "communityMoments": 87,
  "adminMoments": 111,
  "campaignMoments": 47,
  "totalBroadcasts": 198,
  "successfulBroadcasts": 189,
  "pendingBroadcasts": 3,
  "failedBroadcasts": 6,
  "successRate": "95.5",
  "totalSubscribers": 3420,
  "activeSubscribers": 2891,
  "recentActivity": 1205,
  "systemStatus": {
    "intentSystem": "healthy | backlog",
    "lastUpdated": "..."
  }
}
```

### GET /analytics/revenue
Sponsor and budget analytics.
```json
// Response 200
{
  "totalCampaigns": 12,
  "totalRevenue30Days": 45000.00,
  "totalBudgetAllocated": 120000.00,
  "totalSpent": 38500.00,
  "totalBroadcasts": 198,
  "avgCostPerBroadcast": 194.44,
  "roi": "16.88",
  "profitMargin": "14.44",
  "budgetUtilization": "32.1"
}
```

### GET /analytics/campaigns
Campaign performance breakdown.
```json
// Query params: timeframe=7d|30d|90d

// Response 200
{
  "analytics": {
    "total_campaigns": 12,
    "total_reach": 45000,
    "total_cost": 38500.00
  },
  "campaigns": [ ... ]
}
```

### GET /analytics/dashboard
Full dashboard data (daily stats, regional, category breakdowns).
```json
// Response 200
{
  "daily": [ { "stat_date": "...", "moments_count": 5, "broadcasts_count": 3 } ],
  "regional": [ { "region": "KZN", "moment_count": 45 } ],
  "category": [ { "category": "Education", "moment_count": 67 } ]
}
```

### POST /analytics/refresh
Trigger analytics materialized view refresh.
```json
// Response 200
{ "success": true }
```

---

## Moderation Endpoints

### GET /moderation
Flagged messages queue.
```
Query params:
  filter=all|flagged|high_risk|escalated
  page=1, limit=20

Response 200:
{
  "flaggedMessages": [
    {
      "id": "uuid",
      "from_number": "+27...",
      "content": "...",
      "message_type": "text",
      "moderation_status": "pending|approved|flagged|rejected",
      "created_at": "...",
      "mcp_analysis": {
        "confidence": 0.85,
        "harm_signals": { "violence": true },
        "spam_indicators": { "promotional": false },
        "urgency_level": "high",
        "escalation_suggested": true
      }
    }
  ],
  "pagination": { ... }
}
```

### POST /messages/:id/approve
Approve a flagged message.
```json
// Response 200
{ "success": true, "message": "Message approved successfully" }
```

### POST /messages/:id/flag
Flag a message as inappropriate.
```json
// Response 200
{ "success": true, "message": "Message flagged successfully" }
```

### POST /messages/:id/reject
Reject a message.
```json
// Response 200
{ "success": true }
```

---

## Subscribers Endpoints

### GET /subscribers
```
Query params: filter=all|active|inactive, page, limit

Response 200:
{
  "subscribers": [
    {
      "id": "uuid",
      "phone_number": "+27...",
      "opted_in": true,
      "regions": ["KZN", "WC"],
      "categories": ["Education", "Safety"],
      "language_preference": "eng",
      "delivery_schedule": "instant|morning|evening|weekly",
      "paused_until": null,
      "opted_in_at": "...",
      "last_activity": "..."
    }
  ],
  "stats": { "total": 3420, "active": 2891, "inactive": 529 },
  "pagination": { ... }
}
```

---

## Broadcasts Endpoints

### GET /broadcasts
Broadcast history.
```json
// Response 200
{
  "broadcasts": [
    {
      "id": "uuid",
      "moment_id": "uuid",
      "moment": { "title": "...", "region": "KZN", "category": "Education" },
      "recipient_count": 1250,
      "success_count": 1198,
      "failure_count": 52,
      "status": "completed",
      "broadcast_started_at": "...",
      "broadcast_completed_at": "..."
    }
  ],
  "pagination": { ... }
}
```

---

## Settings Endpoints

### GET /settings
```json
// Response 200
{
  "settings": [
    { "setting_key": "monthly_budget", "setting_value": "10000", "description": "..." },
    { "setting_key": "message_cost", "setting_value": "0.05" },
    { "setting_key": "daily_limit", "setting_value": "500" },
    { "setting_key": "warning_threshold", "setting_value": "80" }
  ]
}
```

### PUT /settings/:key
```json
// Request
{ "value": "15000" }

// Response 200
{ "setting": { "setting_key": "monthly_budget", "setting_value": "15000" } }
```

---

## Budget Endpoints

### GET /budget/overview
```json
// Response 200
{
  "data": {
    "total": 10000,
    "used": 3850,
    "message_cost": 0.05,
    "messages_sent": 77000,
    "messages_remaining": 123000
  },
  "alerts": [
    { "level": "warning", "message": "Budget at 85% - monitor closely" }
  ]
}
```

### GET /budget/sponsors
Per-sponsor budget breakdown.

### GET /budget/transactions
Recent budget transactions.

### PUT /budget/settings
Update budget configuration.
```json
// Request
{
  "monthly_budget": 15000,
  "warning_threshold": 80,
  "message_cost": 0.05,
  "daily_limit": 500
}
```

---

## Authority Endpoints

### GET /authority
List authority profiles.
```
Query params: page, limit, status, scope

Response 200:
{
  "authority_profiles": [
    {
      "id": "uuid",
      "user_identifier": "+27...",
      "authority_level": 3,
      "role_label": "Community Leader",
      "scope": "province",
      "scope_identifier": "KZN",
      "approval_mode": "ai_review",
      "blast_radius": 500,
      "risk_threshold": 0.5,
      "status": "active",
      "valid_until": null,
      "created_at": "..."
    }
  ]
}
```

### POST /authority
Create authority profile. Requires: content_admin+.
```json
// Request
{
  "user_identifier": "+27821234567",
  "authority_level": 2,
  "role_label": "NGO Partner",
  "scope": "province",
  "scope_identifier": "KZN",
  "approval_mode": "ai_review",
  "blast_radius": 250,
  "risk_threshold": 0.5,
  "valid_until": "2025-12-31T00:00:00Z"
}
```

### PUT /authority/:id
Update authority profile.

### POST /authority/:id/suspend
Suspend authority profile. Requires: superadmin.
```json
// Request
{ "reason": "Violation of content guidelines" }
```

### GET /authority/audit
Authority action audit log.

---

## Admin Users Endpoints

### GET /admin-users
Requires: superadmin.
```json
// Response 200
{
  "users": [
    { "id": "uuid", "email": "...", "name": "...", "active": true, "last_login": "..." }
  ]
}
```

### POST /admin-users
Create admin user. Requires: superadmin.
```json
// Request
{ "email": "...", "name": "...", "password": "..." }
```

### PUT /admin-users/:id/role
Assign role. Requires: superadmin.
```json
// Request
{ "role": "content_admin" }
```

---

## Media Endpoints

### POST /upload-media
Upload media files. Multipart form data.
```
Form field: media_files (multiple files allowed)

Response 200:
{
  "files": [
    {
      "originalName": "photo.jpg",
      "publicUrl": "https://...supabase.co/storage/v1/object/public/media/...",
      "mimeType": "image/jpeg",
      "size": 245678
    }
  ]
}
```

---

## Public Endpoints (No Auth)

### GET /api/moments
Public moments feed (broadcasted only).
```
Query params: region, category, source, limit=50

Response 200:
{ "moments": [ ...broadcasted moments with sponsor info... ] }
```

### GET /api/stats
Public platform stats.
```json
// Response 200
{
  "totalMoments": 245,
  "activeSubscribers": 2891,
  "totalBroadcasts": 198
}
```

### GET /health
```json
// Response 200
{ "status": "ok", "timestamp": "..." }
```

---

## Compliance Endpoints

### POST /compliance/check
Check content against Meta/WhatsApp policies.
```json
// Request
{ "title": "...", "content": "...", "category": "Education" }

// Response 200
{
  "compliance": {
    "is_compliant": true,
    "risk_score": 15,
    "violation_severity": "SAFE",
    "violations": [],
    "requires_approval": false,
    "recommendation": "Content is compliant with Meta policies"
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{ "error": "Human readable error message" }
```

HTTP Status codes:
- `400` — Bad request / validation error
- `401` — Unauthorized (missing or invalid token)
- `403` — Forbidden (insufficient role)
- `404` — Resource not found
- `429` — Rate limit exceeded
- `500` — Internal server error
