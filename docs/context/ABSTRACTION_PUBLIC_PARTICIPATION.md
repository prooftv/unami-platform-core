# ABSTRACTION_PUBLIC_PARTICIPATION.md

> Extracted from Umkhandlu source. No simulation. No inference beyond what the code contains.

---

## What Public Participation Is

Public participation is the structured capture of community input on a governance process. In Umkhandlu, it appears in two forms:

1. **Statutory participation** — public comments on development notices (legally required)
2. **Campaign participation** — community feedback on infrastructure projects (governance record)

Source: `src/components/modules/submitComment.ts`, `src/components/modules/PublicCommentForm.tsx`, `src/studio/schema/documents/campaign.ts` (`participationLog`), `src/studio/schema/documents/developmentNotice.ts`

---

## Form 1 — Statutory Public Comment

### What It Does

Captures structured objections, comments, support, and questions on a development notice during its open comment period.

### Where It Lives

`/development-notices/[slug]` — rendered only when `status === 'open'` and `commentDeadline` has not passed.

### Form Fields

| Field | Type | Validation |
|---|---|---|
| `noticeId` | hidden | From page context |
| `noticeTitle` | hidden | From page context |
| `name` | text | Required, min 2 chars |
| `contact` | text | Required, min 3 chars (email or phone) |
| `relationship` | select | `resident` / `landowner` / `business` / `community` / `organisation` / `other` |
| `commentType` | select | `comment` / `objection` / `support` / `question` |
| `comment` | textarea | Required, min 10 chars |
| `popia` | checkbox | Required. Must be `'on'` before submission is accepted |

### POPIA Compliance

- Consent checkbox is required. Server validates `popia === 'on'` via `literal('on')` Valibot schema.
- `popia` field is stripped from the webhook payload. `popiaConsent: true` is sent instead.
- Personal details (name, contact) are never stored in the CMS.
- The POPIA notice displayed to the user states: details are collected solely for this public participation process, forwarded to the applicant and/or relevant authority, not stored on the platform, not used for any other purpose.

### Delivery

```typescript
sendToWebhook('public_comment', {
  noticeId,
  noticeTitle,
  name,
  contact,
  relationship,
  commentType,
  comment,
  popiaConsent: true,
})
```

Webhook type: `'public_comment'`
Destination: webhook URL configured in CMS Settings → Analytics
Receiver: n8n / Make / Zapier or any webhook endpoint

### What Is Stored in the CMS

Nothing from the form submission. The only CMS field updated is `commentsReceived` (a counter), updated manually by the operator from webhook data.

### Server Action

Source: `src/components/modules/submitComment.ts`

```
'use server'
validateWith(CommentSchema)  // Valibot
→ sendToWebhook('public_comment', payload)
→ return { success: true } | { success: false, message }
```

Uses `useActionState` (React 19) on the client. Progressive enhancement — works without JS.

---

## Form 2 — Campaign Participation Log

### What It Does

Provides an auditable record of community feedback received on an infrastructure project. Entered manually by the operator from webhook data. Not a live form — a structured log.

### Where It Lives

`campaign.participationLog[]` — field on the `campaign` document. Visible in Sanity Studio tracking tab.

### Log Entry Fields

| Field | Type | Notes |
|---|---|---|
| `date` | date | Required |
| `commentType` | enum | `comment` / `objection` / `support` / `question` / `complaint` / `issue` |
| `relationship` | enum | `resident` / `landowner` / `business` / `community` / `organisation` / `other` |
| `summary` | text | Required. No personal info (POPIA). Brief summary only |
| `actionTaken` | string | e.g. "Forwarded to PMU", "Escalated to engineer", "Resolved" |

### POPIA Note in Schema

The field description explicitly states: "Do NOT include names, phone numbers, or emails." The log records type, date, and summary only.

---

## Webhook Architecture

Source: `src/actions/webhook.ts`

### Three Webhook Types

| Type | Source | Fields |
|---|---|---|
| `contact` | Contact form | `name`, `email`, `message` |
| `subscribe` | Subscribe form | `email` |
| `public_comment` | Development notice comment form | `noticeId`, `noticeTitle`, `name`, `contact`, `relationship`, `commentType`, `comment`, `popiaConsent` |

### Webhook URL

Configured in CMS Settings → Analytics (`settings.webhookUrl`). Fetched from Sanity on first use, cached in memory for the server process lifetime.

### Delivery

```typescript
POST webhookUrl
Content-Type: application/json
Body: {
  type: 'contact' | 'subscribe' | 'public_comment',
  timestamp: ISO string,
  ...formData
}
```

Returns `true` if `response.ok`, `false` on failure. Failure does not throw — it returns an error state to the user.

---

## Domain-Specific vs Platform-Generic

| Concept | Domain-specific | Platform-generic |
|---|---|---|
| Structured public comment form | ❌ | ✅ |
| POPIA consent on participation forms | ❌ | ✅ (SA-specific law, but consent pattern is universal) |
| Personal data via webhook only, never stored | ❌ | ✅ |
| Participation log on projects (manual, anonymised) | ❌ | ✅ |
| Comment types (comment / objection / support / question) | ❌ | ✅ |
| Relationship to site (resident / landowner / etc.) | ❌ | ✅ |
| Webhook delivery architecture | ❌ | ✅ |
| Comment deadline enforcement | ❌ | ✅ |
| `commentsReceived` counter (manual) | ❌ | ✅ |
| Statutory comment period (30 days, SPLUMA) | ✅ SA statutory context | ❌ |
| `pto` / `estate` / `liquor` notice types | ✅ SA statutory context | ❌ |
| POPIA (Protection of Personal Information Act) | ✅ SA law | ❌ (consent pattern is generic) |

**Platform abstraction:** Public participation is a structured, consent-gated form that delivers personal data via webhook and never stores it. The platform records a count and an anonymised log. The specific legal framework (POPIA, SPLUMA comment periods) is jurisdiction-specific. The architecture — consent, webhook delivery, anonymised log — is platform-generic.
