# Environment Variables

## Required for All Environments

```bash
# ─── Supabase ───────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
# NEVER expose this in frontend — API/Edge only
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# ─── WhatsApp Cloud API ─────────────────────────────────────────
WHATSAPP_TOKEN=<meta-business-api-token>
WHATSAPP_PHONE_ID=<phone-number-id>
WHATSAPP_BUSINESS_ACCOUNT_ID=<business-account-id>

# ─── Webhook Security ───────────────────────────────────────────
WEBHOOK_VERIFY_TOKEN=<random-string-for-meta-webhook-verification>
WEBHOOK_HMAC_SECRET=<random-string-for-hmac-signature-verification>
INTERNAL_WEBHOOK_SECRET=<random-string-for-n8n-to-api-calls>

# ─── n8n ────────────────────────────────────────────────────────
N8N_WEBHOOK_URL=https://your-n8n-instance.com
N8N_API_KEY=<n8n-api-key>

# ─── AI / MCP ───────────────────────────────────────────────────
# Optional: Claude API for enhanced content analysis
# Falls back to SQL rule-based analysis if not set
ANTHROPIC_API_KEY=<claude-api-key>

# ─── Application ────────────────────────────────────────────────
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://moments.unamifoundation.org
NEXT_PUBLIC_ADMIN_URL=https://admin.moments.unamifoundation.org
NEXT_PUBLIC_API_URL=https://<project-ref>.supabase.co/functions/v1/admin-api

# ─── Monitoring (Optional) ──────────────────────────────────────
SENTRY_DSN=<sentry-dsn>
```

## Supabase Edge Function Secrets

Set these via Supabase CLI (NOT in .env files):
```bash
supabase secrets set WHATSAPP_TOKEN=...
supabase secrets set WHATSAPP_PHONE_ID=...
supabase secrets set WEBHOOK_VERIFY_TOKEN=...
supabase secrets set WEBHOOK_HMAC_SECRET=...
supabase secrets set INTERNAL_WEBHOOK_SECRET=...
supabase secrets set ANTHROPIC_API_KEY=...
supabase secrets set N8N_WEBHOOK_URL=...
```

## n8n Environment Variables

Set in n8n instance settings:
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE=<service-role-key>
SUPABASE_ANON_KEY=<anon-key>
WHATSAPP_TOKEN=<meta-business-api-token>
PHONE_NUMBER_ID=<phone-number-id>
INTERNAL_WEBHOOK_SECRET=<same-as-above>
```

## Frontend Apps (.env.local)

```bash
# apps/admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=https://<project-ref>.supabase.co/functions/v1/admin-api

# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=https://<project-ref>.supabase.co/functions/v1/admin-api
```

## Security Notes

1. `SUPABASE_SERVICE_ROLE_KEY` — NEVER in frontend. Edge functions only.
2. `WHATSAPP_TOKEN` — NEVER in frontend. Edge functions only.
3. `ANTHROPIC_API_KEY` — NEVER in frontend. Edge functions only.
4. All secrets in Supabase Edge Functions via `supabase secrets set`
5. Frontend only gets `NEXT_PUBLIC_*` variables (anon key + URLs)
6. Rotate `WEBHOOK_HMAC_SECRET` and `INTERNAL_WEBHOOK_SECRET` every 90 days
