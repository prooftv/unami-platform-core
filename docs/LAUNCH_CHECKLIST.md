# Moments v2 — Launch Checklist

Phase 17J acceptance document. Every item must be signed off before Moments v2 is considered shipped.

---

## Infrastructure

| Item | Owner | Status |
|---|---|---|
| Supabase project on Pro plan (or higher) | Ops | ⏳ |
| All migrations applied — 000 through 005 | Ops | ⏳ |
| `evidence` storage bucket created, public read enabled | Ops | ⏳ |
| `moments-media` storage bucket created, public read enabled | Ops | ⏳ |
| RLS policies verified on all tables | Ops | ⏳ |
| `participation_webhook_url` set in `system_settings` | Ops | ⏳ |

---

## Edge Functions

| Item | Owner | Status |
|---|---|---|
| All 19 Edge Functions deployed | Ops | ⏳ |
| `SUPABASE_URL` secret set | Ops | ⏳ |
| `SUPABASE_SERVICE_ROLE_KEY` secret set | Ops | ⏳ |
| `ADMIN_URL` secret set (CORS) | Ops | ⏳ |
| `WEB_URL` secret set (CORS) | Ops | ⏳ |
| `WHATSAPP_TOKEN` secret set | Ops | ⏳ |
| `WHATSAPP_PHONE_NUMBER_ID` secret set | Ops | ⏳ |
| `WEBHOOK_VERIFY_TOKEN` secret set | Ops | ⏳ |
| `WEBHOOK_HMAC_SECRET` secret set | Ops | ⏳ |
| `WHATSAPP_DEFAULT_TEMPLATE` secret set (optional) | Ops | ⏳ |
| `ANTHROPIC_API_KEY` secret set (optional — AI analysis) | Ops | ⏳ |

---

## WhatsApp

| Item | Owner | Status |
|---|---|---|
| WhatsApp Business Account verified by Meta | Ops | ⏳ |
| Phone number registered and approved | Ops | ⏳ |
| Webhook URL configured in Meta Developer Console | Ops | ⏳ |
| Webhook verification token matches `WEBHOOK_VERIFY_TOKEN` | Ops | ⏳ |
| HMAC secret matches `WEBHOOK_HMAC_SECRET` | Ops | ⏳ |
| Broadcast template submitted and approved by Meta | Ops | ⏳ |
| HELP reply tested end-to-end with real number | Ops | ⏳ |
| STATUS reply tested end-to-end | Ops | ⏳ |
| MYAUTHORITY reply tested end-to-end | Ops | ⏳ |
| Opt-in flow tested (START → confirmation message) | Ops | ⏳ |
| Opt-out flow tested (STOP → confirmation message) | Ops | ⏳ |
| First real broadcast sent to test subscriber | Ops | ⏳ |

---

## Deployments

| Item | Owner | Status |
|---|---|---|
| `apps/admin` deployed to Vercel | Ops | ⏳ |
| `apps/web` deployed to Vercel | Ops | ⏳ |
| Custom domain configured for `apps/admin` | Ops | ⏳ |
| Custom domain configured for `apps/web` | Ops | ⏳ |
| SSL certificates active on both domains | Ops | ⏳ |
| Environment variables set in Vercel for both apps | Ops | ⏳ |
| Vercel preview deployments disabled or restricted | Ops | ⏳ |

---

## Sanity CMS

| Item | Owner | Status |
|---|---|---|
| Sanity Studio deployed | Ops | ⏳ |
| All 10 schemas defined in Studio | Ops | ⏳ |
| 15 seed documents verified in Studio | Ops | ⏳ |
| Revalidation webhook configured in Sanity → `/api/revalidate` | Ops | ⏳ |
| `SANITY_REVALIDATE_SECRET` matches webhook config | Ops | ⏳ |
| ISR working — content update triggers revalidation | Ops | ⏳ |

---

## Security

| Item | Owner | Status |
|---|---|---|
| Security headers on `apps/admin` — X-Frame-Options, CSP, HSTS | Eng | ✅ |
| Security headers on `apps/web` — X-Frame-Options, CSP, HSTS | Eng | ✅ |
| Rate limits active on all 19 Edge Functions | Eng | ✅ |
| No hardcoded credentials in any file | Eng | ✅ |
| Service role key not exposed in any frontend bundle | Eng | ✅ |
| Phone numbers masked in admin UI (last 4 digits only) | Eng | ✅ |
| POPIA consent enforced at DB level on `participation_log` | Eng | ✅ |
| Broadcasted moments immutable — no edit/delete path exists | Eng | ✅ |

---

## Performance

| Item | Owner | Status |
|---|---|---|
| `apps/web` Lighthouse ≥ 90 — Performance | Eng | ⏳ |
| `apps/web` Lighthouse ≥ 90 — Accessibility | Eng | ⏳ |
| `apps/web` Lighthouse ≥ 90 — Best Practices | Eng | ⏳ |
| `apps/web` Lighthouse ≥ 90 — SEO | Eng | ⏳ |
| `apps/admin` Lighthouse ≥ 80 — Performance | Eng | ⏳ |
| LCP < 2.5s on moment detail page | Eng | ⏳ |
| CLS < 0.1 on homepage | Eng | ⏳ |
| Service worker caching verified — offline page loads | Eng | ⏳ |
| ISR cache headers verified on Sanity-driven pages | Eng | ⏳ |

---

## Functional Validation

| Item | Owner | Status |
|---|---|---|
| Create moment → broadcast → appears on PWA feed | Eng | ⏳ |
| Consultation moment → participation form → webhook delivered | Eng | ⏳ |
| Evidence upload → appears on public moment detail | Eng | ⏳ |
| CSR campaign → progress log → deliverable certified → complete | Eng | ⏳ |
| Subscribe via PWA → receives broadcast on WhatsApp | Eng | ⏳ |
| Admin role enforcement — viewer cannot broadcast | Eng | ⏳ |
| Sanity content update → ISR revalidation → PWA updated | Eng | ⏳ |
| Intelligence dashboard — all 4 aggregations populated | Eng | ⏳ |

---

## Rollback Procedures

| Scenario | Procedure |
|---|---|
| Bad Edge Function deploy | Supabase dashboard → Functions → redeploy previous commit |
| Bad migration | Migrations 001–005 are additive only. Schema changes require a new forward migration. |
| Bad `apps/admin` deploy | Vercel → Deployments → Promote previous deployment |
| Bad `apps/web` deploy | Vercel → Deployments → Promote previous deployment |
| Broadcast sent to wrong audience | Broadcasted moments are immutable. Issue a correction moment. |
| Supabase outage | `apps/web` serves cached ISR pages. `apps/admin` shows error states. No data loss. |

---

## Sign-off

| Role | Name | Date |
|---|---|---|
| Engineering | | |
| Product | | |
| Operations | | |

---

*This document is the Phase 17J acceptance checklist. Moments v2 is not shipped until all items are signed off.*
