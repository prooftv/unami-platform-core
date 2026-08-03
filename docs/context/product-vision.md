# Moments Product Vision

This document locks in the product architecture and roadmap for Moments.
It exists to prevent engineering-first drift. Read it before starting any phase.

---

## What Moments Is

Moments is a community information platform with three surfaces:

```
Sanity CMS                    Supabase
Editorial Workspace           Operational Database
        │                           │
        │ publishes                 │ broadcasts
        ▼                           ▼
┌───────────────────────────────────────────┐
│              apps/web (PWA)               │
│         Public community experience       │
└───────────────────────────────────────────┘
                    │
                    │ subscribes via WhatsApp
                    ▼
             WhatsApp delivery
             (final channel)
```

And one operational surface:

```
apps/admin
Moments Admin Dashboard
(manages broadcasts, subscribers, moderation, campaigns, sponsors)
```

---

## Responsibility Split

### Sanity CMS owns
- Homepage composition (hero, featured stories, layout)
- Editorial content (long-form stories, announcements, help articles)
- Sponsor pages and campaign landing pages
- About, Privacy, Help, Authority pages
- SEO metadata, Open Graph, structured data
- Media assets for editorial content
- Navigation structure and featured categories

### Supabase owns
- Broadcasts and delivery pipeline
- Subscriber management and preferences
- Moderation queue and advisory signals
- Authority profiles and audit logs
- Analytics and engagement data
- Compliance and rate limiting
- WhatsApp message processing

### apps/web (PWA) consumes both
- Editorial content from Sanity via GROQ queries
- Operational moments from Supabase via `packages/api` → Edge Functions
- These are two separate data sources. Neither replaces the other.

### apps/admin manages
- Moments creation, scheduling, broadcasting
- Subscriber and moderation workflows
- Sponsor and campaign management
- System settings and feature flags

### WhatsApp is the delivery channel
- Not the product. Not the next milestone.
- Subscribers opt in via WhatsApp deep link on the PWA
- Broadcasts are delivered via WhatsApp Cloud API
- Reply handlers (HELP/STATUS/MYAUTHORITY) are built last — after the public product exists

---

## Architecture Rules for This Vision

1. Sanity is added to `apps/web` only. It never touches `packages/`, `apps/admin`, or Edge Functions.
2. Supabase remains the operational store. Sanity does not replace it.
3. `apps/web` queries Sanity directly via `@sanity/client` — no Edge Function proxy needed for public read.
4. The Sanity dataset is read-only from `apps/web`. All writes happen in Sanity Studio.
5. Sanity Studio is a separate deployment — not inside this monorepo.
6. The PWA data flow becomes:
   - Editorial pages → Sanity GROQ
   - Moment feed, detail, region, category → Supabase via `packages/api`
   - Both sources render in the same Next.js app, same layout, same design system.

---

## Roadmap

### ✅ Platform v1.0 — Complete
- `@unami/ui`, `@unami/shared`, `@unami/api` — application-agnostic
- 15 Edge Functions, 26 tables
- `apps/admin` — all modules, full CRUD
- `apps/web` — scaffold with Supabase-driven feed, detail, regions, categories, search, subscribe

---

### Phase 17A — Public PWA Completion
**Goal:** `apps/web` becomes the actual Moments community experience, not a scaffold.

What this means:
- Homepage with hero, featured moments, category navigation — editorial layout
- Moment feed with proper card design, urgency indicators, sponsor attribution
- Moment detail with full content, media, share, related moments
- Category and region pages with editorial headers
- Search with real-time results
- Subscribe page with clear WhatsApp opt-in flow
- About, Help, Privacy static pages
- Sponsor directory page
- Authority profile public pages
- PWA install prompt, offline page, manifest

**Data source:** Supabase via existing `packages/api` public client.
No Sanity yet. Get the experience right first.

---

### Phase 17B — Sanity CMS Setup
**Goal:** Sanity project created, schema defined, Studio deployed.

What this means:
- Sanity project created (separate from this monorepo)
- Schema defined for: `homePage`, `featuredStory`, `sponsorPage`, `authorityPage`, `helpArticle`, `aboutPage`, `privacyPage`
- Sanity Studio deployed (Sanity-hosted or Vercel)
- `@sanity/client` added to `apps/web` only
- Environment variables: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`
- No content yet — schema and connection only

---

### Phase 17C — Connect PWA to Sanity
**Goal:** Editorial pages in `apps/web` are driven by Sanity. Operational pages remain Supabase.

What this means:
- Homepage hero and featured stories → Sanity
- About, Help, Privacy pages → Sanity
- Sponsor pages → Sanity
- Authority public profiles → Sanity (or hybrid: Sanity for bio/editorial, Supabase for stats)
- Moment feed, detail, region, category → still Supabase (unchanged)
- ISR (Incremental Static Regeneration) for Sanity-driven pages
- On-demand revalidation webhook from Sanity → Next.js `/api/revalidate`

---

### Phase 17D — WhatsApp Production
**Goal:** End-to-end broadcast delivery working in production.

What this means:
- WhatsApp Cloud API credentials configured in Supabase secrets
- HELP reply handler (Edge Function)
- STATUS reply handler (Edge Function)
- MYAUTHORITY reply handler (Edge Function)
- Live webhook end-to-end test with real subscriber
- Broadcast delivery confirmed

**This phase is intentionally last.** Testing WhatsApp against a complete product
is more valuable than testing it against a scaffold.

---

### Phase 18 — Moments Launch
**Goal:** Moments is publicly available and production-ready.

- Domain configured
- Vercel deployments for `apps/web` and `apps/admin`
- Supabase project on paid plan
- Sanity project on appropriate plan
- WhatsApp Business Account verified
- First real broadcast sent

---

## What Does Not Change

- Platform packages (`packages/ui`, `packages/shared`, `packages/api`) — frozen
- Edge Functions — no changes unless Phase 17D requires them
- `apps/admin` — no changes unless a bug is found
- Database schema — no changes unless Phase 17D requires a new table
- Domain ownership rules (D-027) — Moments domain stays in `apps/`

---

## The Test for Every Decision

Before adding anything to `apps/web`, ask:

1. Is this editorial content? → Sanity
2. Is this operational data? → Supabase via `packages/api`
3. Is this a platform capability? → It already exists in `packages/`
4. Is this Moments-specific UI? → `apps/web/src/components/` or `apps/web/src/domain/`

If the answer is "I'm not sure," stop and ask before writing.
