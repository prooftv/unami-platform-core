# Deployment Guide

## Production URLs
- Admin Dashboard: https://admin.moments.unamifoundation.org
- Public PWA: https://moments.unamifoundation.org
- API (Edge): https://<project-ref>.supabase.co/functions/v1/admin-api
- Webhook: https://<project-ref>.supabase.co/functions/v1/webhook

---

## Supabase Edge Functions Deployment

```bash
# Link to project
supabase link --project-ref <your-project-ref>

# Deploy all functions
supabase functions deploy webhook --no-verify-jwt
supabase functions deploy admin-api
supabase functions deploy broadcast-processor
supabase functions deploy mcp-advisory

# Set all secrets
supabase secrets set \
  WHATSAPP_TOKEN=<token> \
  WHATSAPP_PHONE_ID=<phone-id> \
  WEBHOOK_VERIFY_TOKEN=<verify-token> \
  WEBHOOK_HMAC_SECRET=<hmac-secret> \
  INTERNAL_WEBHOOK_SECRET=<internal-secret> \
  ANTHROPIC_API_KEY=<claude-key> \
  N8N_WEBHOOK_URL=<n8n-url> \
  ADMIN_URL=https://admin.moments.unamifoundation.org \
  WEB_URL=https://moments.unamifoundation.org
```

---

## Vercel Deployment

### Admin App
```bash
cd apps/admin
vercel --prod

# Or via Vercel dashboard:
# - Connect GitHub repo
# - Root directory: apps/admin
# - Framework: Next.js
# - Build command: cd ../.. && pnpm build --filter=admin
# - Install command: pnpm install
# - Environment variables: add all NEXT_PUBLIC_* vars
```

### Web App
```bash
cd apps/web
vercel --prod

# Same settings, root directory: apps/web
```

### Vercel Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=https://<project>.supabase.co/functions/v1/admin-api
NEXT_PUBLIC_APP_URL=https://moments.unamifoundation.org
NEXT_PUBLIC_ADMIN_URL=https://admin.moments.unamifoundation.org
```

---

## Database Migration

```bash
# Apply initial schema
supabase db push

# Or paste supabase/migrations/0001_initial.sql into Supabase SQL Editor
```

---

## WhatsApp Webhook Registration

1. Go to Meta Developer Console → Your App → WhatsApp → Configuration
2. Webhook URL: `https://<project-ref>.supabase.co/functions/v1/webhook`
3. Verify Token: value of WEBHOOK_VERIFY_TOKEN
4. Click Verify and Save
5. Subscribe to: messages
6. Test with a message to your WhatsApp number

---

## n8n Deployment

### Self-hosted (recommended)
```bash
# Docker
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  --restart unless-stopped \
  n8nio/n8n

# Set environment variables in n8n Settings → Environment Variables
```

### Import Workflows
1. Open n8n at http://your-server:5678
2. Workflows → Import from File
3. Import each file from n8n/ directory
4. Activate all workflows

---

## Health Checks

After deployment, verify:

```bash
# Edge Function health
curl https://<project>.supabase.co/functions/v1/admin-api/health

# Webhook verification (Meta will do this automatically)
curl "https://<project>.supabase.co/functions/v1/webhook?hub.mode=subscribe&hub.verify_token=<your-token>&hub.challenge=test123"
# Should return: test123

# Database connection
curl https://<project>.supabase.co/functions/v1/admin-api/api/stats
# Should return: {"totalMoments":0,"activeSubscribers":0,"totalBroadcasts":0}
```

---

## GitHub Actions Setup

### Required Secrets (in GitHub repo settings)
```
SUPABASE_ACCESS_TOKEN=<supabase-access-token>
SUPABASE_PROJECT_ID=<project-ref>
VERCEL_TOKEN=<vercel-token>
VERCEL_ORG_ID=<vercel-org-id>
VERCEL_ADMIN_PROJECT_ID=<vercel-project-id-for-admin>
VERCEL_WEB_PROJECT_ID=<vercel-project-id-for-web>
```

---

## Rollback Procedures

### Edge Function Rollback
```bash
# Redeploy previous version
git checkout <previous-commit>
supabase functions deploy admin-api
```

### Database Rollback
```sql
-- Cancel pending intents if bad broadcast
UPDATE moment_intents
SET status = 'cancelled', updated_at = NOW()
WHERE status = 'pending'
  AND created_at > NOW() - INTERVAL '10 minutes';

-- Revert moment status
UPDATE moments
SET status = 'draft', broadcasted_at = NULL
WHERE id = '<moment-id>';
```

### n8n Rollback
- Deactivate workflow in n8n UI
- Fix issue
- Reactivate

---

## Monitoring

### Supabase Logs
- Edge Function logs: Supabase Dashboard → Edge Functions → Logs
- Database logs: Supabase Dashboard → Database → Logs
- Real-time: `supabase functions logs webhook --tail`

### Key Metrics to Watch
- moment_intents with status='failed': should be < 5%
- moment_intents with status='pending' > 10 min old: indicates n8n issue
- error_logs table: check for recurring errors
- rate_limits table: check for abuse patterns

### Alerts to Set Up
- Budget > 80% utilized: email alert
- Failed intents > 10 in 1 hour: Slack/email alert
- Webhook errors > 5 in 5 minutes: immediate alert
