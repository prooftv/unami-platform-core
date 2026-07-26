# Moments v2 — Security Model

## Authentication
- Supabase Auth handles all sessions. No custom auth tables.
- JWT tokens (RS256, 1 hour expiry). Refresh tokens 7 days.
- Sessions stored in httpOnly cookies via Supabase SSR helpers.
- No passwords in code. No hardcoded credentials anywhere.

## RBAC — Admin Roles
Stored in `admin_roles` table, keyed to Supabase Auth user ID.

| Role | Permissions |
|---|---|
| superadmin | All operations including role management and deletes |
| content_admin | Create, edit, schedule, broadcast moments and campaigns |
| moderator | Approve, flag, reject messages and moments |
| viewer | Read-only across all tables |

## Role Enforcement Pattern (Edge Functions)
```typescript
const auth = await requireAuth(req, ['superadmin', 'content_admin']);
if (auth instanceof Response) return auth; // 401 or 403
```

## Authority System (Community Members)
Separate from admin roles. Trusted WhatsApp users with elevated content privileges.
- Levels 1–5 (Community Member → National Authority)
- Controls blast_radius (max subscribers reachable)
- Controls approval_mode (admin_review / ai_review / auto)
- Fail-open: authority lookup errors NEVER block message processing

## Webhook Security
- Meta webhook verified via HMAC-SHA256 (x-hub-signature-256)
- Always returns HTTP 200 to Meta — errors logged internally, never surfaced
- Deduplication by whatsapp_id prevents replay

## CORS
- Restricted to ADMIN_URL and WEB_URL env vars only
- No wildcard origins

## Data Privacy (POPIA)
- Phone numbers are PII — never exposed to anon role
- Admin UI masks phone numbers: +27...1234 (last 4 digits only)
- Messages retained 90 days
- Right to erasure: DELETE on subscriptions cascades

## Immutable Rules
- Broadcasted moments CANNOT be edited or deleted
- Status transitions are one-directional: draft → scheduled → broadcasted
- Service role key only in Edge Function secrets, never in frontend code
