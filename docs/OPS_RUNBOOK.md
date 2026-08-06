# Moments v2 — Operations Runbook

Complete step-by-step deployment guide for Phase 17J.
Work through each section in order. Do not skip ahead.

---

## Prerequisites

- Access to: Supabase dashboard, Vercel dashboard, Meta Business Manager, Sanity dashboard, domain DNS panel (co.za registrar)
- Node.js 18+ installed locally
- `pnpm` installed locally (`npm install -g pnpm`)
- Supabase CLI installed (`npm install -g supabase`)
- Git access to `https://github.com/prooftv/unami-platform-core`

---

## Section 1 — DNS Configuration

### Domains to configure

| App | Domain |
|---|---|
| Public PWA (`apps/web`) | `moments.unamifoundation.org` |
| Admin (`apps/admin`) | `admin.moments.unamifoundation.org` |

### co.za DNS — what to add

Log in to your co.za registrar (e.g. Afrihost, Domains.co.za, Hetzner SA).
Navigate to DNS Management for `unamifoundation.org`.

Add the following records. Vercel will give you the exact values during domain setup (Section 4),
but the record types are always the same:

**For `moments.unamifoundation.org` (apex-style subdomain):**

```
Type:   CNAME
Name:   moments
Value:  cname.vercel-dns.com
TTL:    3600
```

**For `admin.moments.unamifoundation.org`:**

```
Type:   CNAME
Name:   admin.moments
Value:  cname.vercel-dns.com
TTL:    3600
```

> If your registrar does not allow CNAME on a subdomain that has other records,
> use an A record instead. Vercel will show you the IP during domain setup.
> Vercel's current IP: `76.76.21.21`

**Verification record (Vercel will prompt for this):**

```
Type:   TXT
Name:   _vercel
Value:  <shown in Vercel dashboard during domain setup>
TTL:    3600
```

DNS propagation takes 15 minutes to 4 hours on co.za. Continue with other sections while waiting.

---

## Section 2 — Supabase

### 2A — Upgrade to Pro plan

1. Go to `https://supabase.com/dashboard`
2. Select project `arqeiadudzwbmzdhqkit`
3. Settings → Billing → Upgrade to Pro
4. Required for: custom domains, increased function invocations, storage limits

### 2B — Apply all migrations

Migrations must be applied in order. Migrations 000–005 may already be applied.
Check which are applied first:

```bash
# From your local machine, in the repo root
supabase db remote status --db-url "postgresql://postgres:[DB_PASSWORD]@db.arqeiadudzwbmzdhqkit.supabase.co:5432/postgres"
```

If you do not have the DB password, get it from:
Supabase dashboard → Settings → Database → Connection string → copy password.

Apply all pending migrations:

```bash
supabase db push --db-url "postgresql://postgres:[DB_PASSWORD]@db.arqeiadudzwbmzdhqkit.supabase.co:5432/postgres"
```

This applies all files in `supabase/migrations/` in order:

| Migration | What it adds |
|---|---|
| `000_initial_schema.sql` | Baseline — 26 tables |
| `001_grant_service_role_privileges.sql` | Service role grants |
| `002_governance_adaptation.sql` | moment_type, participation columns |
| `003_participation_engine.sql` | participation_log, participation_count |
| `004_evidence_layer.sql` | evidence table, weather_context |
| `005_commercial_layer.sql` | campaign_type, project tracking columns |
| `006_platform_records.sql` | records table, notices table, governance_nodes |
| `007_whatsapp_tables.sql` | whatsapp_templates, template_messages, messaging_windows |
| `008_community_records.sql` | moment_id FK on records, anon RLS for public timeline |

Verify in Supabase dashboard → Table Editor that all tables exist.

### 2C — Create storage buckets

Go to Supabase dashboard → Storage → New bucket.

**Bucket 1:**
```
Name:         evidence
Public:       Yes (enable public access)
File size:    10 MB
Allowed MIME: image/jpeg, image/png, image/webp, image/gif, application/pdf, video/mp4
```

**Bucket 2:**
```
Name:         moments-media
Public:       Yes (enable public access)
File size:    20 MB
Allowed MIME: image/jpeg, image/png, image/webp, image/gif
```

### 2D — Set system settings

Go to Supabase dashboard → Table Editor → `system_settings`.

Insert or update the following row:

```
key:   participation_webhook_url
value: https://your-n8n-instance.com/webhook/participation
```

If n8n is not yet configured, set a placeholder URL. The webhook failure is non-fatal —
participation submissions still succeed if the webhook is unreachable.

### 2E — Deploy Edge Functions

From the repo root:

```bash
# Login to Supabase CLI
supabase login
# Enter your access token: sbp_476373c395af757354507a8b98cbe33d7069e69f

# Link to the project
supabase link --project-ref arqeiadudzwbmzdhqkit

# Deploy all 20 Edge Functions
supabase functions deploy
```

This deploys all functions in `supabase/functions/`:
`analytics`, `auth`, `authority`, `broadcast`, `broadcasts`, `campaigns`,
`evidence`, `media`, `moderation`, `moments`, `notices`, `participation`,
`records`, `retry-batches`, `settings`, `sponsors`, `subscribers`,
`user-profiles`, `webhook`

Verify in Supabase dashboard → Edge Functions that all 20 appear with green status.

### 2F — Set Edge Function secrets

Go to Supabase dashboard → Edge Functions → Manage secrets.

Set each secret exactly as named. These are consumed by `Deno.env.get()` in the functions.

**Core secrets (required for all functions):**

```
SUPABASE_URL              = https://arqeiadudzwbmzdhqkit.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxODU5OCwiZXhwIjoyMDgxNzk0NTk4fQ.WyolKqTVdblr1r8eCjOOaBuMq2uLAJIM_0YC3n3M7s8
SUPABASE_ANON_KEY         = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1OTgsImV4cCI6MjA4MTc5NDU5OH0.ZuFeM6U3_-romnhLN2X3ozqWHovifqMQjxRAc3N8r2E
SUPABASE_JWT_SECRET       = e/YQk8MPNNiyCciu9FhOk5VEZlAlNNkYkpbU0zfljt+GxijZ6Bf2dvQeSw+zTa83buKl+lRJTb2HVT9qCrNVrA==
```

**CORS secrets (must match your Vercel deployment URLs):**

```
ADMIN_URL = https://admin.moments.unamifoundation.org
WEB_URL   = https://moments.unamifoundation.org
```

**WhatsApp secrets — see Section 3 before setting these:**

```
WHATSAPP_TOKEN            = <regenerate from Meta Business Manager — old token is expired>
WHATSAPP_PHONE_NUMBER_ID  = 940140815849209
WEBHOOK_VERIFY_TOKEN      = whatsapp_gateway_verify_2024_secure
WEBHOOK_HMAC_SECRET       = <generate a new random string — 32+ chars — set same value in Meta>
WHATSAPP_DEFAULT_TEMPLATE = moment_broadcast
```

**Optional secrets:**

```
ANTHROPIC_API_KEY = <your Anthropic key — enables AI analysis in advisory function>
```

> Note: `WEBHOOK_HMAC_SECRET` must be generated by you. Use any password generator.
> Example: `openssl rand -hex 32` in terminal. Set the same value in Meta Developer Console
> when configuring the webhook (Section 3C).

---

## Section 3 — WhatsApp Business API

### 3A — Regenerate WHATSAPP_TOKEN

The token from the previous deployment is expired. You must regenerate it.

1. Go to `https://developers.facebook.com`
2. Select your app → WhatsApp → API Setup
3. Under "Temporary access token", click Generate
4. Copy the new token — it is valid for 24 hours for testing
5. For production: go to Meta Business Manager → System Users → Generate permanent token
   - Assign the system user to your WhatsApp Business Account
   - Grant `whatsapp_business_messaging` and `whatsapp_business_management` permissions
   - Generate a permanent token (does not expire)
6. Set this as `WHATSAPP_TOKEN` in Supabase secrets (Section 2F)

### 3B — Verify phone number

1. Meta Developer Console → WhatsApp → Phone Numbers
2. Confirm `+27 65 829 5041` (Phone ID: `940140815849209`) is listed and verified
3. Status must be `Connected` — not `Pending` or `Restricted`

### 3C — Register webhook in Meta Developer Console

1. Meta Developer Console → WhatsApp → Configuration → Webhook
2. Click Edit
3. Set:
   ```
   Callback URL:  https://arqeiadudzwbmzdhqkit.supabase.co/functions/v1/webhook
   Verify token:  whatsapp_gateway_verify_2024_secure
   ```
4. Click Verify and Save
   - Meta will send a GET request to the webhook URL
   - The Edge Function will respond with the challenge if the verify token matches
   - If verification fails: confirm `WEBHOOK_VERIFY_TOKEN` secret is set in Supabase (Section 2F)
5. Under Webhook Fields, subscribe to: `messages`

### 3D — Submit WhatsApp templates

Templates must be submitted via the Graph API and approved by Meta before any broadcast.
Approval takes 24–48 hours.

**Submit `moment_broadcast` template (MARKETING):**

```bash
curl -X POST \
  "https://graph.facebook.com/v19.0/<WHATSAPP_BUSINESS_ACCOUNT_ID>/message_templates" \
  -H "Authorization: Bearer <WHATSAPP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "moment_broadcast",
    "language": "en",
    "category": "MARKETING",
    "components": [
      {
        "type": "HEADER",
        "format": "TEXT",
        "text": "📢 Moment — {{1}}"
      },
      {
        "type": "BODY",
        "text": "{{2}}\n\n{{3}}\n\n🏷️ {{4}} • 📍 {{5}}\n\n🌐 More: https://moments.unamifoundation.org"
      },
      {
        "type": "FOOTER",
        "text": "Reply STOP to unsubscribe"
      }
    ]
  }'
```

**Submit `sponsored_moment` template (MARKETING):**

```bash
curl -X POST \
  "https://graph.facebook.com/v19.0/<WHATSAPP_BUSINESS_ACCOUNT_ID>/message_templates" \
  -H "Authorization: Bearer <WHATSAPP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sponsored_moment",
    "language": "en",
    "category": "MARKETING",
    "components": [
      {
        "type": "HEADER",
        "format": "TEXT",
        "text": "{{1}} [Sponsored] Moment — {{2}}"
      },
      {
        "type": "BODY",
        "text": "{{3}}\n\n{{4}}\n\n🏷️ {{5}} • 📍 {{6}}\n\n✨ Proudly sponsored by {{7}}\n\n🌐 More: https://moments.unamifoundation.org"
      },
      {
        "type": "FOOTER",
        "text": "Reply STOP to unsubscribe"
      },
      {
        "type": "BUTTONS",
        "buttons": [
          {
            "type": "URL",
            "text": "Learn More",
            "url": "https://moments.unamifoundation.org/moment/{{1}}"
          }
        ]
      }
    ]
  }'
```

Replace `<WHATSAPP_BUSINESS_ACCOUNT_ID>` with your WABA ID from Meta Business Manager.
Replace `<WHATSAPP_TOKEN>` with the regenerated token from Section 3A.

**Check template status:**

```bash
curl "https://graph.facebook.com/v19.0/<WHATSAPP_BUSINESS_ACCOUNT_ID>/message_templates?name=moment_broadcast" \
  -H "Authorization: Bearer <WHATSAPP_TOKEN>"
```

Status will be `PENDING` → `APPROVED` or `REJECTED`.
Do not attempt a broadcast until `moment_broadcast` is `APPROVED`.

**Update template status in Supabase:**

Once approved, update the local registry:

```sql
UPDATE whatsapp_templates
SET status = 'approved', approved_at = NOW()
WHERE name = 'moment_broadcast';

UPDATE whatsapp_templates
SET status = 'approved', approved_at = NOW()
WHERE name = 'sponsored_moment';
```

Run this in Supabase dashboard → SQL Editor.

---

## Section 4 — Vercel Deployments

### 4A — Deploy `apps/web` (Public PWA)

1. Go to `https://vercel.com/dashboard`
2. New Project → Import Git Repository → `prooftv/unami-platform-core`
3. Configure:
   ```
   Root Directory:    apps/web
   Framework:         Next.js
   Build Command:     cd ../.. && pnpm build --filter=web
   Output Directory:  .next
   Install Command:   pnpm install
   ```
4. Add environment variables (all required):

   ```
   NEXT_PUBLIC_SUPABASE_URL        = https://arqeiadudzwbmzdhqkit.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1OTgsImV4cCI6MjA4MTc5NDU5OH0.ZuFeM6U3_-romnhLN2X3ozqWHovifqMQjxRAc3N8r2E
   NEXT_PUBLIC_API_URL             = https://arqeiadudzwbmzdhqkit.supabase.co/functions/v1
   NEXT_PUBLIC_SANITY_PROJECT_ID   = g4t7r2a1
   NEXT_PUBLIC_SANITY_DATASET      = production
   NEXT_PUBLIC_WHATSAPP_NUMBER     = 27658295041
   SANITY_REVALIDATE_SECRET        = <generate a random string — 32+ chars>
   ```

   > `SANITY_REVALIDATE_SECRET`: generate with `openssl rand -hex 32` or any password generator.
   > You will use this same value in Section 5C when configuring the Sanity webhook.

5. Click Deploy
6. Once deployed, note the Vercel URL (e.g. `unami-platform-core-web.vercel.app`)

### 4B — Add custom domain to `apps/web`

1. Vercel → Project (web) → Settings → Domains
2. Add domain: `moments.unamifoundation.org`
3. Vercel will show you the DNS record to add — it will be one of:
   - CNAME `moments` → `cname.vercel-dns.com`
   - A record `moments` → `76.76.21.21`
4. Add this record in your co.za DNS panel (Section 1 has the format)
5. Vercel will automatically provision an SSL certificate once DNS propagates
6. Wait for status to show green ✓ before proceeding

### 4C — Deploy `apps/admin` (Moments Admin)

1. Vercel → New Project → same repo
2. Configure:
   ```
   Root Directory:    apps/admin
   Framework:         Next.js
   Build Command:     cd ../.. && pnpm build --filter=admin
   Output Directory:  .next
   Install Command:   pnpm install
   ```
3. Add environment variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL        = https://arqeiadudzwbmzdhqkit.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycWVpYWR1ZHp3Ym16ZGhxa2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTg1OTgsImV4cCI6MjA4MTc5NDU5OH0.ZuFeM6U3_-romnhLN2X3ozqWHovifqMQjxRAc3N8r2E
   NEXT_PUBLIC_API_URL             = https://arqeiadudzwbmzdhqkit.supabase.co/functions/v1
   ```

4. Click Deploy
5. Once deployed, add custom domain: `admin.moments.unamifoundation.org`
6. Add the CNAME/A record in your co.za DNS panel

### 4D — Disable preview deployments (security)

For both projects:
1. Vercel → Project → Settings → Git → Deployment Protection
2. Enable "Vercel Authentication" on preview deployments
   OR set "Only deploy production branch" to prevent public preview URLs

---

## Section 5 — Sanity CMS

### 5A — Create Sanity Studio project

The Sanity project already exists: `g4t7r2a1` / dataset: `production`.

If you need to create the Studio locally first:

```bash
cd apps/web
npx sanity@latest init --project g4t7r2a1 --dataset production
```

### 5B — Define schemas in Sanity Studio

The 10 schemas required are defined in `apps/web/src/lib/sanity/types.ts`.
You need to create a `sanity.config.ts` and schema files in a Studio project.

The 10 document types to define:

| Schema type | Purpose |
|---|---|
| `homePage` | Homepage hero, featured stories, SEO |
| `featuredStory` | Editorial long-form content |
| `sponsorPage` | Sponsor editorial profile |
| `campaignPage` | Campaign editorial presentation |
| `aboutPage` | Platform and organisation story |
| `helpArticle` | User guidance and FAQs |
| `privacyPage` | Privacy policy content |
| `termsPage` | Terms of service content |
| `authorityPage` | Governance authority editorial profile |
| `siteSettings` | Navigation, featured categories, footer |

Each schema must match the field names in `apps/web/src/lib/sanity/types.ts` exactly.

### 5C — Deploy Sanity Studio

```bash
# From your Sanity Studio directory
npx sanity deploy
```

Choose a studio hostname, e.g. `unami-moments.sanity.studio`.

### 5D — Seed initial content

Run the seed script to populate all 15 documents with initial content:

```bash
# From repo root
SANITY_API_TOKEN=skEXag6A0HMwmJY2uANRxpsHIibKSCXyg2AYsA7K6fbWo5npcPBbEmOYCRXQxjuej0GaoHU2lFydXq6K02CdEpZ8cECRMjjEq7TGm6hbjv4BYvHUCdjSKzHThWaSSZyqC2rgwFNQddM2vlfGncBp5lV1uSzxOXf1RtZZfGnohFlxpac32g9n \
  node apps/web/scripts/seed-sanity.mjs
```

Verify in Sanity Studio that all 15 documents appear.

### 5E — Configure revalidation webhook in Sanity

This webhook triggers ISR revalidation in `apps/web` when content is published.

1. Go to `https://sanity.io/manage` → Project `g4t7r2a1` → API → Webhooks
2. Add webhook:
   ```
   Name:    Moments PWA Revalidation
   URL:     https://moments.unamifoundation.org/api/revalidate
   Trigger: On create, On update, On delete
   Filter:  (leave blank — all document types)
   Secret:  <same value you set as SANITY_REVALIDATE_SECRET in Vercel>
   Header:  Authorization: Bearer <SANITY_REVALIDATE_SECRET>
   ```
3. Save and test — publish any document and confirm the webhook fires with 200

---

## Section 6 — Post-deployment Verification

Work through each test in order. All must pass before Moments v2 is considered live.

### 6A — Infrastructure checks

```
[ ] https://moments.unamifoundation.org loads (no SSL error)
[ ] https://admin.moments.unamifoundation.org loads (no SSL error)
[ ] Supabase dashboard — all 20 Edge Functions show green
[ ] Supabase dashboard — all 9 migrations applied
[ ] Supabase dashboard — evidence bucket exists, public
[ ] Supabase dashboard — moments-media bucket exists, public
```

### 6B — Admin app checks

```
[ ] Login with a superadmin account works
[ ] Moments list loads
[ ] Create a test moment (type: standard, region: KZN, category: Community)
[ ] Approve the test moment
[ ] Moment detail page loads with all panels
[ ] Evidence upload works — file appears in storage bucket
[ ] Analytics dashboard loads — all 4 tabs render
```

### 6C — Public PWA checks

```
[ ] Homepage loads with Sanity content (hero, featured stories)
[ ] /feed loads with moments from Supabase
[ ] Moment detail page loads (pick a broadcasted moment)
[ ] /subscribe page loads — WhatsApp opt-in form renders
[ ] /about, /help, /privacy, /terms load with Sanity content
[ ] /projects page loads
[ ] /intelligence page loads
[ ] Theme toggle works (light/dark)
[ ] Mobile navigation opens and closes
[ ] PWA install prompt appears on mobile
```

### 6D — WhatsApp end-to-end checks

Run these only after Section 3 is complete and `moment_broadcast` template is APPROVED.

```
[ ] Send "START" to +27 65 829 5041 — receive welcome message
[ ] Send "HELP" — receive command menu
[ ] Send "STATUS" — receive subscription status
[ ] Send "STOP" — receive unsubscribe confirmation
[ ] Send "START" again — resubscribe
[ ] Broadcast the test moment from admin — subscriber receives it
[ ] Delivery receipt appears in template_messages table
```

### 6E — Sanity ISR check

```
[ ] Update homepage hero text in Sanity Studio → Publish
[ ] Wait 10 seconds
[ ] Reload https://moments.unamifoundation.org — new text appears
[ ] Webhook log in Sanity shows 200 response
```

### 6F — Functional flow check

```
[ ] Create consultation moment → enable participation → set deadline
[ ] Broadcast it
[ ] Open moment on PWA — participation form appears
[ ] Submit a response — confirm it logs in participation_log
[ ] Create CSR campaign → add progress log entry → certify deliverable
[ ] View /projects — campaign appears
[ ] Upload evidence to a moment — appears on public moment detail
```

---

## Section 7 — Rollback Procedures

| Scenario | Action |
|---|---|
| Bad Edge Function deploy | Supabase dashboard → Edge Functions → select function → Deployments → redeploy previous |
| Bad migration | Migrations are additive only. Write a new forward migration to correct. Never modify applied migrations. |
| Bad `apps/web` deploy | Vercel → Project → Deployments → find last good deploy → Promote to Production |
| Bad `apps/admin` deploy | Same as above |
| Broadcast sent to wrong audience | Broadcasted moments are immutable. Create a correction moment and broadcast it. |
| Supabase outage | `apps/web` serves ISR-cached pages. `apps/admin` shows error states. No data loss. |
| Sanity outage | `apps/web` serves stale ISR cache. No Supabase data affected. |

---

## Section 8 — Environment Variable Reference

### `apps/web` — Vercel environment variables

| Variable | Value | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://arqeiadudzwbmzdhqkit.supabase.co` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon key) | ✅ |
| `NEXT_PUBLIC_API_URL` | `https://arqeiadudzwbmzdhqkit.supabase.co/functions/v1` | ✅ |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `g4t7r2a1` | ✅ |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` | ✅ |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `27658295041` | ✅ |
| `SANITY_REVALIDATE_SECRET` | `<your generated secret>` | ✅ |

### `apps/admin` — Vercel environment variables

| Variable | Value | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://arqeiadudzwbmzdhqkit.supabase.co` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon key) | ✅ |
| `NEXT_PUBLIC_API_URL` | `https://arqeiadudzwbmzdhqkit.supabase.co/functions/v1` | ✅ |

### Supabase Edge Function secrets

| Secret | Value | Required |
|---|---|---|
| `SUPABASE_URL` | `https://arqeiadudzwbmzdhqkit.supabase.co` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | service role JWT | ✅ |
| `SUPABASE_ANON_KEY` | anon JWT | ✅ |
| `SUPABASE_JWT_SECRET` | JWT secret | ✅ |
| `ADMIN_URL` | `https://admin.moments.unamifoundation.org` | ✅ |
| `WEB_URL` | `https://moments.unamifoundation.org` | ✅ |
| `WHATSAPP_TOKEN` | regenerated from Meta | ✅ |
| `WHATSAPP_PHONE_NUMBER_ID` | `940140815849209` | ✅ |
| `WEBHOOK_VERIFY_TOKEN` | `whatsapp_gateway_verify_2024_secure` | ✅ |
| `WEBHOOK_HMAC_SECRET` | `<your generated secret>` | ✅ |
| `WHATSAPP_DEFAULT_TEMPLATE` | `moment_broadcast` | ✅ |
| `ANTHROPIC_API_KEY` | your Anthropic key | optional |

---

## Section 9 — Sign-off

| Check | Status | Date |
|---|---|---|
| DNS propagated — both domains resolve | ⏳ | |
| All migrations applied (000–008) | ⏳ | |
| Storage buckets created | ⏳ | |
| All 20 Edge Functions deployed | ⏳ | |
| All Edge Function secrets set | ⏳ | |
| `apps/web` deployed with custom domain | ⏳ | |
| `apps/admin` deployed with custom domain | ⏳ | |
| Sanity Studio deployed | ⏳ | |
| Seed documents verified in Studio | ⏳ | |
| Revalidation webhook configured | ⏳ | |
| WhatsApp token regenerated | ⏳ | |
| Webhook registered in Meta | ⏳ | |
| `moment_broadcast` template approved | ⏳ | |
| End-to-end WhatsApp test passed | ⏳ | |
| First real broadcast sent | ⏳ | |
| Lighthouse ≥ 90 on `apps/web` | ⏳ | |

---

*This document covers Phase 17J operations. Engineering is complete. All remaining work is in this runbook.*
