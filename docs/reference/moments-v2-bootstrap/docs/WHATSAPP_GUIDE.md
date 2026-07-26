# WhatsApp Integration Guide

## Overview
WhatsApp number: +27 65 829 5041
API version: v19.0 (Meta Cloud API)
Webhook URL: `https://<project>.supabase.co/functions/v1/webhook`

---

## Inbound Message Commands

All commands are case-insensitive.

| Command | Aliases | Action |
|---|---|---|
| `START` | JOIN, SUBSCRIBE | Opt in, send welcome with interactive buttons |
| `STOP` | UNSUBSCRIBE, QUIT, CANCEL | Immediate opt-out (POPIA/GDPR compliant) |
| `HELP` | INFO, MENU, ? | Show full command list |
| `REGIONS` | REGION, AREAS | Show region selector (interactive list) |
| `INTERESTS` | CATEGORIES, TOPICS | Show category selector (interactive list) |
| `STATUS` | SETTINGS | Show current subscription settings |
| `LANGUAGE` | — | Language selector (EN/ZU/XH) |
| `RECENT` | — | Last 5 broadcasted moments |
| `SUBMIT` | SHARE, MOMENTS | Content submission guide + category selector |
| `SEARCH` | — | Search moments by region/topic/popular |
| `REPORT` | — | Report inappropriate content |
| `FEEDBACK` | — | Feedback options |
| `PAUSE` | — | Pause notifications (1d/3d/7d/30d) |
| `SCHEDULE` | — | Set delivery schedule (instant/morning/evening/weekly) |
| `MYAUTHORITY` | — | View own authority profile (if exists) |

### Region Codes (direct input)
User can type region codes directly: `KZN WC GP`

| Code | Province |
|---|---|
| KZN | KwaZulu-Natal |
| WC | Western Cape |
| GP | Gauteng |
| EC | Eastern Cape |
| FS | Free State |
| LP | Limpopo |
| MP | Mpumalanga |
| NC | Northern Cape |
| NW | North West |

### Category Codes (direct input)
User can type category codes: `EDU SAF OPP` or `ALL`

| Code | Category |
|---|---|
| EDU | Education |
| SAF | Safety |
| CUL | Culture |
| OPP | Opportunity |
| EVE | Events |
| HEA | Health |
| TEC | Technology |
| COM | Community |

---

## Interactive Message Types

### Interactive Buttons (max 3 buttons)
Used for: welcome, unsubscribe confirmation, status, language selection.

```json
{
  "messaging_product": "whatsapp",
  "to": "+27...",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "Message body here" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "btn_regions", "title": "📍 Choose Regions" } },
        { "type": "reply", "reply": { "id": "btn_interests", "title": "🏷️ Choose Interests" } },
        { "type": "reply", "reply": { "id": "btn_help", "title": "❓ Help" } }
      ]
    }
  }
}
```

### Interactive List (for more than 3 options)
Used for: region selection, category selection, search, pause duration, schedule.

```json
{
  "messaging_product": "whatsapp",
  "to": "+27...",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": { "text": "Choose your regions:" },
    "action": {
      "button": "Select Regions",
      "sections": [{
        "title": "Provinces",
        "rows": [
          { "id": "KZN", "title": "🏖️ KwaZulu-Natal", "description": "KZN" },
          { "id": "WC", "title": "🍷 Western Cape", "description": "WC" }
        ]
      }]
    }
  }
}
```

---

## Button ID Reference

All button IDs handled in the webhook:

```
btn_regions          → Show region interactive list
btn_interests        → Show category interactive list
btn_help             → Show help text
btn_resubscribe      → Re-opt-in after unsubscribe
btn_confirm_unsub    → Confirm unsubscribe (legacy)
btn_pause_instead    → Pause 7 days instead of unsubscribe
btn_cancel           → Cancel action

KZN/WC/GP/EC/FS/LP/MP/NC/NW  → Region selection from list
EDU/SAF/CUL/OPP/EVE/HEA/TEC/COM → Category selection from list

lang_en / lang_zu / lang_xh  → Language selection

submit_edu/saf/opp/eve/other → Content submission category
report_spam/inappropriate/wrong → Content report type
feedback_good/suggest/issue  → Feedback type

search_region / search_topic / search_popular → Search type
search_kzn/wc/gp/ec          → Region search results
search_edu/saf/opp/eve        → Category search results

pause_1d / pause_3d / pause_7d / pause_30d → Pause duration
sched_instant/morning/evening/weekly        → Delivery schedule

see_moments / done / add_more_regions / add_more_topics → Navigation
auth_stats / auth_help → Authority profile actions
```

---

## Outbound Broadcast Format

### Standard Moment Broadcast
```
📢 Unami Foundation Moments — KZN

Community Garden Opens in Soweto

Free seedlings and training provided. Join us at 9 AM for the opening ceremony this Saturday.

🌐 More: moments.unamifoundation.org/m/<id>

📱 Reply STOP to unsubscribe
```

### Sponsored Moment Broadcast
```
🌟 Partner Content — KZN

Digital Skills Workshop — Free Training

Learn computer literacy, internet safety, and online job applications. Starting next week in Durban.

🏷️ Education • 📍 KZN

In partnership with Unami Foundation Partners
🌐 More: moments.unamifoundation.org/m/<id>

📱 Reply STOP to unsubscribe
```

---

## Webhook Security

### HMAC Verification
Meta signs all webhook payloads with `X-Hub-Signature-256`.

```typescript
const signature = req.headers.get('x-hub-signature-256')
const hmac = crypto.createHmac('sha256', WEBHOOK_HMAC_SECRET)
  .update(rawBody)
  .digest('hex')
const expected = `sha256=${hmac}`
if (signature !== expected) return 403
```

### Webhook Verification (GET)
Meta sends a GET request to verify the webhook endpoint.

```typescript
const mode = url.searchParams.get('hub.mode')
const token = url.searchParams.get('hub.verify_token')
const challenge = url.searchParams.get('hub.challenge')
if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
  return new Response(challenge)
}
```

---

## WhatsApp Template Messages

For marketing broadcasts (outside 24-hour window), Meta requires pre-approved templates.

### Template: `community_moment_v1`
Category: UTILITY
```
{{1}} — {{2}}

{{3}}

🌐 More: {{4}}

Reply STOP to unsubscribe
```
Parameters: [region, title, content_preview, pwa_link]

### Template: `verified_sponsored_v1`
Category: MARKETING
```
🌟 Partner Content — {{1}}

{{2}}

{{3}}

In partnership with {{4}}
🌐 {{5}}

Reply STOP to unsubscribe
```
Parameters: [region, title, content_preview, sponsor_name, pwa_link]

### Template: `official_announcement_v1`
Category: UTILITY
```
📢 Official Update — {{1}}

{{2}}

{{3}}

🌐 {{4}}

Reply STOP to unsubscribe
```

### Template Selection Logic
```
authority_level >= 4  → official_announcement_v1
sponsor_id set        → verified_sponsored_v1
default               → community_moment_v1
```

---

## Subscription Management

### Opt-In Flow
1. User sends `START`
2. Upsert subscription: `opted_in=true`, `opted_in_at=now()`
3. Send welcome with interactive buttons (regions + interests)
4. User selects regions → update `regions[]`
5. User selects categories → update `categories[]`

### Opt-Out Flow (POPIA/GDPR Compliant)
1. User sends `STOP`
2. **Immediately** update: `opted_in=false`, `opted_out_at=now()`
3. Send confirmation with resubscribe option
4. No more messages sent (n8n filters `opted_in=true` only)

### Pause Flow
1. User sends `PAUSE`
2. Show duration options (1d/3d/7d/30d)
3. Set `paused_until` timestamp
4. n8n checks `paused_until` before sending

### Delivery Schedule
- `instant` — send as soon as broadcast is queued
- `morning` — batch and send at 8 AM
- `evening` — batch and send at 6 PM
- `weekly` — Friday digest

---

## Media Handling

### Inbound Media
1. Receive `image/video/audio/document` message
2. Get media URL from WhatsApp API: `GET /v19.0/{media-id}`
3. Download media with Bearer token
4. Upload to Supabase Storage: `media/whatsapp/{timestamp}_{phone}_{media-id}`
5. Store in `media` table with `storage_path` and `public_url`
6. Update message record with `media_url`

### Outbound Media
- Store media in Supabase Storage `media` bucket
- Use public URL in moment's `media_urls[]`
- n8n includes media URL in broadcast payload

---

## Rate Limiting

WhatsApp Cloud API limits:
- 1,000 messages/second (business tier)
- 250 messages/second (standard tier)
- Add 15ms delay between messages in broadcast loop

n8n handles rate limiting via:
- Batch processing (split into batches of 50)
- Delay node between batches
- Retry on 429 errors with exponential backoff

---

## Error Handling

### Common WhatsApp API Errors
```
131047 — Message failed to send (user blocked or invalid number)
131026 — Message undeliverable (number not on WhatsApp)
130429 — Rate limit hit
131000 — Generic error
```

### Handling in n8n
- On error: update `moment_intents.status = 'failed'`, store error in `last_error`
- Increment `attempts` counter
- Retry up to 3 times with 5-minute delay
- After 3 failures: mark as `failed`, alert admin

---

## WhatsApp Business API Setup

1. Create Meta Business Account
2. Create WhatsApp Business App
3. Get Phone Number ID and Business Account ID
4. Generate permanent access token (System User token, not temporary)
5. Configure webhook:
   - URL: `https://<project>.supabase.co/functions/v1/webhook`
   - Verify Token: your `WEBHOOK_VERIFY_TOKEN`
   - Subscribe to: `messages`
6. Submit message templates for approval (3-5 business days)
7. Test with sandbox number first
