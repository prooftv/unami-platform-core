# Security Hardening Guide

## Critical Issues Fixed in v2 (from v1 audit)

### 1. Hardcoded Credentials — FIXED
**v1 problem:** `if (password === 'Proof321#')` hardcoded in admin-api/index.ts
**v2 fix:** Supabase Auth handles all authentication. No passwords in code.

### 2. Wildcard CORS — FIXED
**v1 problem:** `'Access-Control-Allow-Origin': '*'` on all Edge Functions
**v2 fix:** CORS restricted to NEXT_PUBLIC_ADMIN_URL and NEXT_PUBLIC_APP_URL only

### 3. Service Role Key in Frontend — FIXED
**v1 problem:** Supabase service role key referenced in public JS files
**v2 fix:** Service role key only in Edge Function secrets via `supabase secrets set`

### 4. Insecure Session Tokens — FIXED
**v1 problem:** `session_${Date.now()}_${Math.random()}` — not cryptographically secure
**v2 fix:** Supabase Auth JWT tokens (RS256 signed)

### 5. No Input Validation — FIXED
**v1 problem:** Raw req.body passed directly to Supabase inserts
**v2 fix:** Zod validation on every endpoint via shared validators package

### 6. Missing HMAC on Webhook — FIXED
**v1 problem:** Webhook accepted any POST without signature verification
**v2 fix:** X-Hub-Signature-256 HMAC verification on all webhook requests

---

## Authentication

### Supabase Auth Setup
- Email/password authentication
- Magic link option for passwordless login
- JWT tokens (RS256, 1 hour expiry)
- Refresh tokens (7 day expiry)
- Session stored in httpOnly cookies (not localStorage)

### Admin Session Flow
```
1. User submits email + password to /auth/login
2. Supabase Auth validates credentials
3. Returns access_token (JWT) + refresh_token
4. Frontend stores in httpOnly cookie via Supabase SSR helpers
5. Every API request includes JWT in Authorization header
6. Edge Function validates JWT with Supabase Auth
7. Extracts user ID from JWT claims
8. Looks up role in admin_roles table
9. Enforces role-based access
```

### Role Enforcement in API
```typescript
// Every protected handler:
const { data: { user }, error } = await supabase.auth.getUser(token)
if (error || !user) return 401

const { data: roleData } = await supabase
  .from('admin_roles')
  .select('role')
  .eq('user_id', user.id)
  .single()

const role = roleData?.role || 'viewer'
if (!allowedRoles.includes(role)) return 403
```

---

## CORS Configuration

```typescript
const allowedOrigins = [
  Deno.env.get('ADMIN_URL') || 'https://admin.moments.unamifoundation.org',
  Deno.env.get('WEB_URL') || 'https://moments.unamifoundation.org',
]

const origin = req.headers.get('Origin') || ''
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}
```

---

## Webhook Security

### HMAC Verification
```typescript
const signature = req.headers.get('x-hub-signature-256')
const secret = Deno.env.get('WEBHOOK_HMAC_SECRET')

if (!signature || !secret) return new Response('Forbidden', { status: 403 })

const rawBody = await req.arrayBuffer()
const key = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(secret),
  { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
)
const sig = await crypto.subtle.sign('HMAC', key, rawBody)
const computed = 'sha256=' + Array.from(new Uint8Array(sig))
  .map(b => b.toString(16).padStart(2, '0')).join('')

if (signature !== computed) return new Response('Forbidden', { status: 403 })
```

### Internal Webhook Secret
For n8n → API calls:
```typescript
const internalSecret = req.headers.get('x-internal-secret')
if (internalSecret !== Deno.env.get('INTERNAL_WEBHOOK_SECRET')) return 403
```

---

## Rate Limiting

### Per-IP Rate Limiting
```typescript
// rate_limits table approach
const windowStart = new Date(Date.now() - 60_000).toISOString()
const { data } = await supabase
  .from('rate_limits')
  .select('request_count')
  .eq('identifier', clientIP)
  .eq('endpoint', path)
  .gte('window_start', windowStart)
  .single()

if (data?.request_count >= limit) return 429
```

### Limits by Endpoint
- POST /webhook: 1000/min (Meta sends bursts)
- POST /moments: 60/min per user
- POST /moments/:id/broadcast: 10/min per user
- GET /analytics: 30/min per user
- POST /auth/login: 5/min per IP

---

## Input Validation

### Zod Schema Example (shared in packages/validators)
```typescript
export const CreateMomentSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(2000),
  region: z.enum(['KZN','WC','GP','EC','FS','LP','MP','NC','NW','National']),
  category: z.enum(['Education','Safety','Culture','Opportunity','Events','Health','Technology','Community']),
  language: z.enum(['eng','zul','xho','afr']).default('eng'),
  sponsor_id: z.string().uuid().nullable().optional(),
  is_sponsored: z.boolean().default(false),
  pwa_link: z.string().url().nullable().optional(),
  media_urls: z.array(z.string().url()).default([]),
  scheduled_at: z.string().datetime().nullable().optional(),
  urgency_level: z.enum(['low','medium','high','urgent']).default('low'),
  publish_to_pwa: z.boolean().default(true),
  publish_to_whatsapp: z.boolean().default(false),
})
```

### API Validation Pattern
```typescript
const result = CreateMomentSchema.safeParse(body)
if (!result.success) {
  return new Response(JSON.stringify({
    error: 'Validation failed',
    details: result.error.flatten()
  }), { status: 400 })
}
const data = result.data // fully typed, safe to use
```

---

## Security Headers

Set on all API responses:
```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}
```

Set in Next.js `next.config.js`:
```javascript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
]
```

---

## Secret Rotation Schedule

| Secret | Rotation Frequency | How to Rotate |
|---|---|---|
| WHATSAPP_TOKEN | When compromised or annually | Meta Developer Console → Generate new token |
| WEBHOOK_HMAC_SECRET | Every 90 days | Generate new → update Supabase secret → update Meta webhook |
| INTERNAL_WEBHOOK_SECRET | Every 90 days | Generate new → update Supabase secret → update n8n env |
| SUPABASE_SERVICE_ROLE_KEY | When compromised | Supabase Dashboard → API Settings → Rotate |
| ANTHROPIC_API_KEY | When compromised | Anthropic Console → Rotate key |

---

## Data Privacy (POPIA Compliance)

### What We Store
- Phone numbers (required for WhatsApp)
- Message content (for moderation)
- Subscription preferences (regions, categories)
- Consent timestamp and method

### What We Don't Store
- Real names (unless user provides in message)
- Location data
- Device information
- Browsing behavior

### Data Retention
- Messages: 90 days (then anonymize or delete)
- Subscriptions: kept until opt-out + 30 days
- Broadcasts: kept indefinitely (aggregate data only)
- Audit logs: kept 2 years for compliance

### Phone Number Masking
- In admin UI: show +27...1234 (last 4 digits only)
- In exports: full number (admin only, logged)
- In logs: never log full phone numbers

### Right to Erasure
- User sends STOP → opted_out=true (immediate)
- Full deletion: admin can delete subscription record
- Cascades to: messages, comments, user_profiles
