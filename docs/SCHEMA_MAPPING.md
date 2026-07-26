# Schema Mapping — Moments v2

Maps every shared TypeScript type to its database table, the Edge Functions
that write to it, and the admin module that consumes it.

Use this when adding features, debugging data flow, or onboarding a new application.

---

## Type → Table → Function → Module

| Shared Type | DB Table | Edge Functions | Admin Module |
|---|---|---|---|
| `Moment` | `moments` | `moments`, `broadcast`, `webhook` | Moments |
| `Sponsor` | `sponsors` | `moments` | Sponsors |
| `Campaign` | `campaigns` | `broadcast` | Campaigns |
| `Broadcast` | `broadcasts` | `broadcast` | Broadcasts |
| `Subscription` | `subscriptions` | `webhook`, `scheduler` | Subscribers |
| `MomentIntent` | `moment_intents` | `broadcast`, `intent-processor` | — (internal) |
| `Message` | `messages` | `webhook` | Moderation |
| `Advisory` | `advisories` | `webhook`, `mcp-analysis` | Moderation |
| `AuthorityProfile` | `authority_profiles` | `webhook`, `broadcast` | Authority |
| `AdminUser` | `admin_roles` | all (auth check) | Admin Users |
| `SystemSetting` | `system_settings` | — | Settings |
| `BroadcastWithMoment` | `broadcasts` + `moments` | — | Broadcasts |
| `MomentWithSponsor` | `moments` + `sponsors` | — | Moments |
| `CampaignWithSponsor` | `campaigns` + `sponsors` | — | Campaigns |

---

## Tables with no shared type (infrastructure only)

| DB Table | Purpose | Consumed by |
|---|---|---|
| `broadcast_batches` | Parallel batch processing | `broadcast` Edge Function |
| `moderation_audit` | Human moderation log | Moderation module |
| `comments` | Community comments | PWA + Moderation module |
| `whatsapp_comments` | WA message → comment link | `webhook` Edge Function |
| `media` | Media attachments | `webhook` Edge Function |
| `moment_stats` | Engagement counters | PWA + Dashboard |
| `user_profiles` | Anonymous community profiles | PWA |
| `analytics_events` | Raw event stream | Dashboard metrics |
| `marketing_compliance` | Per-broadcast compliance record | Compliance module |
| `budget_transactions` | Campaign spend tracking | Campaigns module |
| `authority_audit_log` | Authority action history | Authority module |
| `feature_flags` | Feature toggles | All modules |
| `rate_limits` | Per-IP/endpoint throttling | All Edge Functions |
| `audit_logs` | Admin action trail | Settings / Audit module |
| `error_logs` | Application errors | Settings / Monitoring |

---

## Data Flow by Feature

### Moment published via admin

```
Admin UI
  → POST /moments (Edge Function: moments)
    → INSERT moments
    → INSERT moment_intents (pwa + whatsapp if enabled)
    → INSERT moment_stats (empty counters)
    → INSERT audit_logs
```

### WhatsApp message received

```
Meta webhook
  → POST /webhook (Edge Function: webhook)
    → INSERT messages (dedup by whatsapp_id)
    → lookup_authority(from_number)
    → INSERT advisories (MCP analysis)
    → Route: command / content submission / opt-in / opt-out
    → UPDATE subscriptions (if opt-in/out)
    → INSERT comments (if content submission approved)
```

### Broadcast triggered

```
Admin UI
  → POST /moments/:id/broadcast (Edge Function: broadcast)
    → SELECT subscriptions (filtered by region + category + opted_in)
    → INSERT broadcasts
    → INSERT broadcast_batches (50 recipients per batch)
    → UPDATE moment_intents status → processing
    → Send WhatsApp messages via Meta API
    → UPDATE broadcasts (success/failure counts)
    → UPDATE moments.broadcasted_at + status → broadcasted
    → INSERT marketing_compliance
    → INSERT budget_transactions (if campaign)
    → INSERT analytics_events
```

---

## Enum Values in Use

All enums live in `packages/shared/src/enums/index.ts` and are mirrored as
CHECK constraints in the database. When adding a new enum value:

1. Add to `packages/shared/src/enums/index.ts`
2. Write a new migration to update the CHECK constraint
3. Update this document

| Enum | DB Column | Values |
|---|---|---|
| `MomentStatus` | `moments.status` | draft / scheduled / broadcasted / cancelled |
| `ContentSource` | `moments.content_source` | admin / community / whatsapp / campaign |
| `UrgencyLevel` | `moments.urgency_level`, `advisories.urgency_level` | low / medium / high / urgent |
| `Language` | `moments.language`, `subscriptions.language_preference` | eng / zul / xho / afr |
| `Category` | `moments.category`, `campaigns.category` | Education / Safety / Culture / Opportunity / Events / Health / Technology / Community |
| `Region` | `moments.region` | KZN / WC / GP / EC / FS / LP / MP / NC / NW / National |
| `SponsorTier` | `sponsors.tier` | bronze / silver / gold / platinum |
| `CampaignStatus` | `campaigns.status` | pending_review / approved / active / paused / completed / cancelled / published |
| `DeliverySchedule` | `subscriptions.delivery_schedule` | instant / morning / evening / weekly |
| `BroadcastStatus` | `broadcasts.status`, `broadcast_batches.status` | pending / processing / completed / failed |
| `IntentChannel` | `moment_intents.channel` | pwa / whatsapp / email / sms |
| `IntentStatus` | `moment_intents.status` | pending / processing / sent / failed / cancelled |
| `IntentAction` | `moment_intents.action` | publish / update / delete |
| `ModerationStatus` | `messages.moderation_status`, `comments.moderation_status` | pending / approved / flagged / rejected |
| `MessageType` | `messages.message_type` | text / image / audio / video / document |
| `AuthorityScope` | `authority_profiles.scope` | community / region / province / national |
| `ApprovalMode` | `authority_profiles.approval_mode` | admin_review / ai_review / auto |
| `AuthorityProfileStatus` | `authority_profiles.status` | active / suspended / expired |
| `AdminRole` | `admin_roles.role` | superadmin / content_admin / moderator / viewer |
| `AdvisoryType` | `advisories.advisory_type` | language / urgency / harm / spam / content_quality |
