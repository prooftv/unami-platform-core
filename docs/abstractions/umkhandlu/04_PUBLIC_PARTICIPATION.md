# 04 — Public Participation

> Umkhandlu Abstraction Pack · Unami Platform Core
> Source: `ABSTRACTION_PUBLIC_PARTICIPATION.md`

---

## What Public Participation Is

Public participation is the structured capture of community input on a governance process. It is consent-gated, webhook-delivered, and never stored in the platform.

The platform records a count and an anonymised log. Personal data never persists.

This is not a comment system. It is a participation engine with legal standing.

---

## Two Participation Forms

### Form 1 — Statutory Public Comment

Captures structured objections, comments, support, and questions on a development notice during its open comment period.

**When it appears:** Only when `notice.status === 'open'` and `commentDeadline` has not passed.

**What it captures:**

| Field | Type | Validation |
|---|---|---|
| `noticeId` | hidden | From page context |
| `noticeTitle` | hidden | From page context |
| `name` | text | Required, min 2 chars |
| `contact` | text | Required, min 3 chars (email or phone) |
| `relationship` | select | `resident` / `landowner` / `business` / `community` / `organisation` / `other` |
| `commentType` | select | `comment` / `objection` / `support` / `question` |
| `comment` | textarea | Required, min 10 chars |
| `popia` | checkbox | Required. Must be `'on'` before submission |

**What is stored:** Nothing. The `commentsReceived` counter on the notice is updated manually by the operator.

**What is delivered:** A webhook payload with `popiaConsent: true` replacing the raw `popia` field.

### Form 2 — Campaign Participation Log

An auditable record of community feedback received on an infrastructure project. Entered manually by the operator from webhook data. Not a live form — a structured log.

**Log entry fields:**

| Field | Type | Notes |
|---|---|---|
| `date` | date | Required |
| `commentType` | enum | `comment` / `objection` / `support` / `question` / `complaint` / `issue` |
| `relationship` | enum | `resident` / `landowner` / `business` / `community` / `organisation` / `other` |
| `summary` | text | Required. No personal info. Brief summary only. |
| `actionTaken` | string | e.g. "Forwarded to PMU", "Escalated to engineer", "Resolved" |

---

## The Consent Architecture

Consent is not a checkbox. It is an architectural constraint.

```
User fills form
    │
    ▼
Consent checkbox required
    │
    ├── Not checked → form does not submit
    │
    └── Checked → server validates popia === 'on'
                        │
                        ▼
                  popia field stripped
                  popiaConsent: true added
                        │
                        ▼
                  Webhook delivery
                        │
                        ▼
                  Nothing stored in platform
```

The POPIA notice displayed to the user states:
- Details are collected solely for this public participation process
- Forwarded to the applicant and/or relevant authority
- Not stored on the platform
- Not used for any other purpose

This consent architecture is platform-generic. The specific legislation (POPIA) is South African. The pattern — explicit consent, webhook delivery, no storage — applies universally.

---

## Webhook Architecture

Three webhook event types in the Umkhandlu implementation:

| Type | Source | Fields |
|---|---|---|
| `contact` | Contact form | `name`, `email`, `message` |
| `subscribe` | Subscribe form | `email` |
| `public_comment` | Development notice comment form | `noticeId`, `noticeTitle`, `name`, `contact`, `relationship`, `commentType`, `comment`, `popiaConsent` |

**Delivery:**
```
POST webhookUrl
Content-Type: application/json
Body: {
  type: 'contact' | 'subscribe' | 'public_comment',
  timestamp: ISO string,
  ...formData
}
```

The webhook URL is configured in CMS settings. It is not hardcoded. Any webhook receiver (n8n, Make, Zapier, custom endpoint) can receive the payload.

**Failure handling:** Webhook failure returns an error state to the user. It does not throw. The form can be resubmitted.

---

## Participation Lifecycle

```
Notice published (status: open)
    │
    ▼
Comment period active (commentDeadline not passed)
    │
    ├── User submits comment
    │       │
    │       ▼
    │   Consent validated
    │       │
    │       ▼
    │   Webhook delivered
    │       │
    │       ▼
    │   commentsReceived counter incremented (manually by operator)
    │
    ▼
Comment period closed (commentDeadline passed)
    │
    ▼
Operator reviews webhook data
    │
    ▼
Participation log updated (anonymised entries only)
    │
    ▼
Notice status updated: approved / rejected / withdrawn
    │
    ▼
Proof of publication certificate generated
```

---

## Moments Adaptation

Moments does not yet have a participation engine. The structural mapping is:

| Participation concept | Moments equivalent | Notes |
|---|---|---|
| Statutory public comment | — | Not yet implemented |
| Comment deadline | — | Not yet implemented |
| Participation log | — | Not yet implemented |
| Webhook delivery | WhatsApp webhook | Different delivery, same principle |
| Consent gate | — | Not yet implemented |
| `commentsReceived` counter | — | Not yet implemented |
| `commentType` | — | Not yet implemented |
| `relationship` | — | Not yet implemented |

The participation engine is a future evolution for Moments. When it arrives, it will follow the same architecture: consent-gated, webhook-delivered, never stored, anonymised log.

The community response to a Moment — a WhatsApp reply, a comment, a reaction — is the Moments equivalent of a public comment. The architecture for capturing, routing, and logging it should follow the same principles.

---

## Platform Implementation Notes

When implementing participation in Unami Platform Core:

1. The `participation_submissions` table does not exist — submissions are never stored.
2. The `participation_log` table is the anonymised record — no personal data, ever.
3. The `participation_counts` table (or column on `notices`) tracks submission counts.
4. The webhook delivery is an Edge Function responsibility — not a client-side call.
5. Consent validation happens server-side — the client cannot bypass it.
6. The comment deadline is enforced server-side — the form is not rendered after the deadline, but the server also validates.
7. The `commentType` and `relationship` enums are platform-generic — the vocabulary is application-defined.
8. Progressive enhancement: the form works without JavaScript (React 19 `useActionState` pattern).
