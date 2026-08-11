# API Contract — Moments v2

Single source of truth for every Edge Function endpoint.
All request/response shapes, auth requirements, error contracts, and status codes.

Last updated: Phase 10 complete. Phases 11–13 endpoints defined here before implementation.

---

## Conventions

- All requests require `Authorization: Bearer <jwt>` unless marked `public`
- All responses are `application/json`
- Paginated responses always return `{ data: T[], pagination: { page, limit, total, totalPages } }`
- Error responses always return `{ error: string }`
- Validation errors return `{ error: "Validation failed", details: ZodFlattenedError }`
- Phone numbers are always POPIA-masked in responses: `+27...1234`
- Status transitions are one-directional and enforced server-side
- `requireAuth(roles)` — 401 if no token, 403 if role not in allowed list

---

## Base URL

```
{SUPABASE_URL}/functions/v1
```

---

## Auth — `/auth`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/auth/me` | all | Returns session role + authority_id |

### GET /auth/me
**Response 200:**
```json
{ "id": "uuid", "email": "string", "role": "superadmin|content_admin|moderator|viewer", "authority_id": "uuid|null" }
```

---

## Moments — `/moments`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/moments` | all | Paginated list with filters |
| GET | `/moments/:id` | all | Single moment with sponsor join |
| POST | `/moments` | superadmin, content_admin | Create draft |
| PUT | `/moments/:id` | superadmin, content_admin | Update (not broadcasted) |
| DELETE | `/moments/:id` | superadmin | Delete (not broadcasted) |
| POST | `/moments/:id/schedule` | superadmin, content_admin | Set scheduled_at, status → scheduled |
| POST | `/moments/:id/cancel` | superadmin, content_admin | status → cancelled |
| GET | `/moments/:id/stats` | all | Engagement counters from moment_stats |
| GET | `/moments/public` | **public** | Broadcasted + publish_to_pwa=true, paginated |
| GET | `/moments/public/:id` | **public** | Single public moment |

### GET /moments/public — Query params (public, no auth)
| Param | Type | Description |
|---|---|
| page | number | default 1 |
| limit | number | default 20, max 50 |
| region | Region | filter by region |
| category | Category | filter by category |
| search | string | ilike on title + content |

Returns only `status = 'broadcasted' AND publish_to_pwa = true` moments.
Phone numbers, admin metadata, and internal fields are excluded from the response.

### GET /moments/public/:id — Response 200
Same shape as list item. Returns 404 if moment is not broadcasted or not publish_to_pwa.
| Param | Type | Description |
|---|---|---|
| page | number | default 1 |
| limit | number | default 20, max 100 |
| status | MomentStatus | filter by status |
| region | Region | filter by region |
| category | Category | filter by category |
| source | ContentSource | filter by content_source |
| search | string | ilike on title + content |

### POST /moments — Body
```json
{
  "title": "string (3–200)",
  "content": "string (10–2000)",
  "region": "Region",
  "category": "Category",
  "language": "Language",
  "urgencyLevel": "UrgencyLevel",
  "publishToPwa": "boolean",
  "publishToWhatsapp": "boolean",
  "isSponsored": "boolean",
  "sponsorId": "uuid|null",
  "pwaLink": "url|null",
  "mediaUrls": "url[]",
  "scheduledAt": "datetime|null"
}
```
**Response 201:** Full Moment object. Side effect: inserts `moment_stats` row.

### PUT /moments/:id — Body
Same as POST but all fields optional. Min 1 field required.
**Errors:** 404 not found, 409 already broadcasted

### POST /moments/:id/schedule — Body
```json
{ "scheduledAt": "datetime" }
```
**Errors:** 409 if status !== 'draft'

### POST /moments/:id/cancel
No body.
**Errors:** 409 if broadcasted or already cancelled

### GET /moments/:id/stats — Response 200
```json
{ "viewCount": 0, "commentCount": 0, "shareCount": 0, "reactionCount": 0, "updatedAt": "datetime" }
```

---

## Broadcast (trigger) — `/broadcast`

| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/broadcast/:momentId` | superadmin, content_admin | Execute broadcast pipeline |

### POST /broadcast/:momentId — Response 200
```json
{ "broadcastId": "uuid", "recipientCount": 0, "successCount": 0, "failureCount": 0, "status": "completed|failed" }
```
**Errors:** 404 moment not found, 409 already broadcasted or cancelled

---

## Broadcasts (history) — `/broadcasts`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/broadcasts` | all | Paginated list with moment join |
| GET | `/broadcasts/:id` | all | Single broadcast |

### GET /broadcasts — Query params
| Param | Type | Description |
|---|---|---|
| page | number | default 1 |
| limit | number | default 20, max 100 |
| momentId | uuid | filter by moment |

### Response item shape
```json
{
  "id": "uuid", "momentId": "uuid", "campaignId": "uuid|null",
  "recipientCount": 0, "successCount": 0, "failureCount": 0,
  "status": "BroadcastStatus", "broadcastStartedAt": "datetime",
  "broadcastCompletedAt": "datetime|null",
  "moment": { "id": "uuid", "title": "string", "region": "Region", "category": "Category" }
}
```

---

## Subscribers — `/subscribers`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/subscribers` | all | Paginated list, phones masked |
| GET | `/subscribers/stats` | all | Aggregate stats |
| GET | `/subscribers/:id` | all | Single subscriber, phone masked |
| POST | `/subscribers/:id/opt-out` | superadmin, content_admin, moderator | Manual opt-out |

### GET /subscribers — Query params
| Param | Type | Description |
|---|---|---|
| page | number | default 1 |
| limit | number | default 20 |
| opted_in | boolean | filter by opt-in status |
| region | Region | filter by region membership |

### POST /subscribers/:id/opt-out — No body
Sets `opted_in = false`, `opted_out_at = now()`.
**Errors:** 404 not found, 409 already opted out

### GET /subscribers/stats — Response 200
```json
{
  "total": 0, "active": 0, "optedOut": 0, "newToday": 0,
  "optOutRate7d": 0.0,
  "bySchedule": { "instant": 0, "morning": 0, "evening": 0, "weekly": 0 },
  "byRegion": { "KZN": 0 }
}
```

---

## Moderation — `/moderation`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/moderation/stats` | all | Queue stats |
| GET | `/moderation/messages` | all | Paginated messages, phones masked |
| GET | `/moderation/messages/:id` | all | Single message with advisories |
| GET | `/moderation/advisories` | all | Paginated advisories |
| GET | `/moderation/advisories/:id` | all | Single advisory with full signal breakdown |
| POST | `/moderation/messages/:id/approve` | superadmin, content_admin, moderator | Approve message |
| POST | `/moderation/messages/:id/reject` | superadmin, content_admin, moderator | Reject message |
| GET | `/moderation/threads/:phone` | superadmin, content_admin, moderator | Message thread by masked phone |
| GET | `/moderation/comments` | all | Paginated comments |
| POST | `/moderation/comments/:id/approve` | superadmin, content_admin, moderator | Approve comment |
| POST | `/moderation/comments/:id/reject` | superadmin, content_admin, moderator | Reject comment |

### GET /moderation/messages/:id — Response 200
Full Message object + `advisories: Advisory[]` array.

### GET /moderation/advisories/:id — Response 200
Full Advisory object including `harmSignals`, `spamIndicators`, `details`.

### GET /moderation/threads/:phone — Query params
| Param | Type | Description |
|---|---|---|
| page | number | default 1 |
| limit | number | default 50 |

Returns messages ordered by timestamp ASC for the given masked phone prefix match.

### GET /moderation/comments — Query params
| Param | Type | Description |
|---|---|---|
| page | number | default 1 |
| limit | number | default 20 |
| status | ModerationStatus | filter |
| momentId | uuid | filter by moment |

---

## Authority — `/authority`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/authority` | all | Paginated profiles |
| GET | `/authority/stats` | all | Aggregate stats |
| GET | `/authority/audit` | all | Paginated audit log |
| GET | `/authority/:id` | all | Single profile |
| POST | `/authority` | superadmin | Create profile |
| PUT | `/authority/:id` | superadmin | Update profile |
| POST | `/authority/:id/suspend` | superadmin | Suspend profile |

### POST /authority — Body
```json
{
  "userIdentifier": "string",
  "authorityLevel": "1–5",
  "roleLabel": "string",
  "scope": "AuthorityScope",
  "scopeIdentifier": "string|null",
  "approvalMode": "ApprovalMode",
  "blastRadius": "number (1–10000)",
  "riskThreshold": "number (0.1–0.9)",
  "validUntil": "datetime|null"
}
```
**Response 201:** Full AuthorityProfile object.

### PUT /authority/:id — Body
Same as POST but all fields optional.
**Errors:** 404 not found, 409 suspended

### POST /authority/:id/suspend — Body
```json
{ "reason": "string (1–500)" }
```
Sets `status = 'suspended'`. Logs to `authority_audit_log`.
**Errors:** 404 not found, 409 already suspended

---

## Sponsors — `/sponsors`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/sponsors` | all | Paginated list |
| GET | `/sponsors/stats` | all | Tier breakdown |
| GET | `/sponsors/:id` | all | Single sponsor |
| POST | `/sponsors` | superadmin, content_admin | Create sponsor |
| PUT | `/sponsors/:id` | superadmin, content_admin | Update sponsor |

### POST /sponsors — Body
```json
{
  "name": "string (lowercase slug)",
  "displayName": "string",
  "contactEmail": "email|null",
  "logoUrl": "url|null",
  "websiteUrl": "url|null",
  "tier": "SponsorTier",
  "monthlyBudget": "number >= 0"
}
```
**Response 201:** Full Sponsor object.

### PUT /sponsors/:id — Body
All fields optional except `name` (immutable — slug cannot change).
**Errors:** 404 not found

---

## Campaigns — `/campaigns`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/campaigns` | all | Paginated list with sponsor join |
| GET | `/campaigns/budget` | all | Active campaign budget utilisation |
| GET | `/campaigns/:id` | all | Single campaign with sponsor join |
| GET | `/campaigns/:id/transactions` | superadmin, content_admin | Budget transaction history |
| POST | `/campaigns` | superadmin, content_admin | Create campaign |
| PUT | `/campaigns/:id` | superadmin, content_admin | Update (not active/completed) |
| POST | `/campaigns/:id/approve` | superadmin | Approve → status: approved |
| POST | `/campaigns/:id/pause` | superadmin, content_admin | Pause active campaign |
| POST | `/campaigns/:id/cancel` | superadmin | Cancel campaign |

### POST /campaigns — Body
```json
{
  "title": "string",
  "content": "string (10–2000)",
  "category": "Category",
  "sponsorId": "uuid|null",
  "budget": "number >= 0",
  "targetRegions": "Region[] (min 1)",
  "targetCategories": "Category[]",
  "mediaUrls": "url[]",
  "scheduledAt": "datetime|null"
}
```
**Response 201:** Full Campaign object. Status defaults to `pending_review`.

### POST /campaigns/:id/approve — No body
Sets `status = 'approved'`. Only superadmin.
**Errors:** 409 if not pending_review

### POST /campaigns/:id/pause — No body
Sets `status = 'paused'`. Only from `active`.
**Errors:** 409 if not active

### POST /campaigns/:id/cancel — No body
Sets `status = 'cancelled'`.
**Errors:** 409 if completed

### GET /campaigns/:id/transactions — Response 200
```json
[{
  "id": "uuid", "transactionType": "spend|refund|adjustment",
  "amount": 0.00, "recipientCount": 0, "costPerRecipient": 0.0000,
  "status": "completed|pending|failed", "createdAt": "datetime"
}]
```

---

## Analytics — `/analytics`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | all | Platform-wide KPIs |
| GET | `/analytics/daily` | all | Daily stats (default 30 days) |
| GET | `/analytics/regional` | all | Moments by region |
| GET | `/analytics/categories` | all | Moments by category |
| GET | `/analytics/revenue` | all | Revenue and budget analytics |
| GET | `/analytics/intents` | all | Intent queue health |

---

## Settings — `/settings`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/settings/flags` | all | All feature flags |
| POST | `/settings/flags/:key` | superadmin | Toggle flag |
| GET | `/settings/system` | all | All system settings |
| POST | `/settings/system/:key` | superadmin | Update setting value |
| GET | `/settings/audit-logs` | superadmin | Paginated admin audit trail |
| GET | `/settings/error-logs` | superadmin | Paginated error log |

### GET /settings/audit-logs — Query params
| Param | Type | Description |
|---|---|---|
| page | number | default 1 |
| limit | number | default 20 |
| resourceType | string | filter by resource_type |
| userId | string | filter by user_id |

### GET /settings/error-logs — Query params
| Param | Type | Description |
|---|---|---|
| page | number | default 1 |
| limit | number | default 20 |
| severity | low\|medium\|high\|critical | filter |

---

## Webhook — `/webhook`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/webhook` | HMAC verify | Meta webhook verification |
| POST | `/webhook` | HMAC verify | Inbound WhatsApp messages |

Always returns HTTP 200. Errors logged to `error_logs` internally.

---

## Error Codes Reference

| Code | Meaning |
|---|---|
| 400 | Validation failed — see `details` |
| 401 | Missing or invalid JWT |
| 403 | Role not permitted for this operation |
| 404 | Resource not found |
| 409 | Business rule conflict (immutable state, duplicate, invalid transition) |
| 500 | Internal server error |

---

## Status Transition Rules

### Moment
```
draft → scheduled (POST /moments/:id/schedule)
draft → broadcasted (POST /broadcast/:momentId)
scheduled → broadcasted (POST /broadcast/:momentId)
draft → cancelled (POST /moments/:id/cancel)
scheduled → cancelled (POST /moments/:id/cancel)
broadcasted → [immutable — no transitions]
```

### Campaign
```
pending_review → approved (POST /campaigns/:id/approve)
approved → active (system/n8n)
active → paused (POST /campaigns/:id/pause)
paused → active (POST /campaigns/:id/approve)
active → completed (system)
any → cancelled (POST /campaigns/:id/cancel, except completed)
```

### Authority Profile
```
active → suspended (POST /authority/:id/suspend)
suspended → active (PUT /authority/:id with status: active — superadmin only)
active/suspended → expired (system, when valid_until passes)
```

---

## Implementation Status

| Endpoint group | Backend | API Client | UI |
|---|---|---|---|
| Moments (public read) | ✅ | ✅ | ✅ |
| Auth | ✅ | ✅ | ✅ |
| Moments (CRUD + schedule + cancel + stats) | ✅ | ✅ | ✅ |
| Broadcast (trigger) | ✅ | ✅ | ✅ |
| Broadcasts (history) | ✅ | ✅ | ✅ |
| Subscribers (list + stats + get) | ✅ | ✅ | ✅ |
| Subscribers (opt-out) | ✅ | ✅ | ✅ |
| Moderation (messages + advisories + approve/reject) | ✅ | ✅ | ✅ |
| Moderation (message detail + advisory detail) | ✅ | ✅ | ✅ |
| Moderation (threads) | ✅ | ✅ | ⏳ |
| Moderation (comments) | ✅ | ✅ | ✅ |
| Authority (list + stats + audit) | ✅ | ✅ | ✅ |
| Authority (create + update + suspend) | ✅ | ✅ | ✅ |
| Sponsors (list + stats + get) | ✅ | ✅ | ✅ |
| Sponsors (create + update) | ✅ | ✅ | ✅ |
| Campaigns (list + budget + get) | ✅ | ✅ | ✅ |
| Campaigns (create + approve + pause + cancel) | ✅ | ✅ | ✅ |
| Campaigns (transactions) | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ |
| Settings (flags + system) | ✅ | ✅ | ✅ |
| Settings (audit-logs + error-logs) | ✅ | ✅ | ✅ |
