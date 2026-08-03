# Moments Product Vision

This document locks in the product architecture, data ownership model, and roadmap.
It exists to prevent engineering-first drift.
Read it before starting any phase. Do not contradict it.

---

## What Moments Is

Moments is a community information platform with three surfaces and one operational backend.

```
┌─────────────────────────────────────────────────────────────┐
│                      SANITY CMS                             │
│                   Editorial Workspace                       │
│  Homepage · Stories · Sponsors · Help · About · Privacy     │
└──────────────────────────┬──────────────────────────────────┘
                           │ editorial content
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     apps/web (PWA)                          │
│              Public community experience                    │
│         Two data sources. One Next.js application.          │
└──────────────────────────┬──────────────────────────────────┘
                           │ subscribes via WhatsApp
                           ▼
                  WhatsApp delivery channel
                  (activated in Phase 17D)

┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
│                  Operational Database                       │
│  Moments · Broadcasts · Subscribers · Moderation            │
│  Analytics · Campaigns · Sponsors · Authority               │
└──────────────────────────┬──────────────────────────────────┘
                           │ operational data
                           ▼
                     Edge Functions
                           │
                     packages/api
                           │
                      apps/admin
                  (Moments admin dashboard)
```

---

## Responsibility Split

### Sanity CMS owns
- Homepage composition — hero, featured stories, layout
- Editorial content — long-form stories, announcements
- Sponsor pages and campaign landing pages
- About, Help, Privacy, Terms pages
- Authority editorial profiles
- SEO metadata, Open Graph, structured data
- Media assets for editorial content
- Navigation structure and featured categories

### Supabase owns
- Moments — creation, scheduling, broadcasting
- Broadcasts and delivery pipeline
- Subscriber management and preferences
- Moderation queue and advisory signals
- Authority profiles and audit logs
- Analytics and engagement data
- Compliance and rate limiting
- WhatsApp message processing
- Campaigns and sponsor commercial data

### apps/web (PWA) consumes both
- Editorial content from Sanity via GROQ queries
- Operational moments from Supabase via `packages/api` → Edge Functions
- These are two separate data sources. Neither replaces the other.
- Same Next.js application. Same layout. Same design system.

### apps/admin manages
- Moments creation, scheduling, broadcasting
- Subscriber and moderation workflows
- Sponsor and campaign management
- System settings and feature flags
- Authority profile management

### WhatsApp is the delivery channel
- Not the product. Not the first milestone.
- Subscribers opt in via WhatsApp deep link on the PWA
- Broadcasts are delivered via WhatsApp Cloud API
- Reply handlers (HELP/STATUS/MYAUTHORITY) are built in Phase 17D — after the public product exists

---

## Architecture Rules

1. Sanity is added to `apps/web` only. Never `packages/`, `apps/admin`, or Edge Functions.
2. Supabase remains the operational store. Sanity does not replace it.
3. `apps/web` queries Sanity directly via `@sanity/client` — no Edge Function proxy.
4. The Sanity dataset is read-only from `apps/web`. All writes happen in Sanity Studio.
5. Sanity Studio is a separate deployment — not inside this monorepo.
6. Moment feed, detail, region, and category pages remain Supabase-driven — unchanged.
7. ISR + on-demand revalidation for all Sanity-driven pages.
8. The PWA data flow:
   - Editorial pages → Sanity GROQ
   - Moment feed, detail, region, category → Supabase via `packages/api`

---

## Why This Order

The wrong order:
```
WhatsApp → PWA → CMS
```
Testing a broadcast against a product that doesn't exist.

The right order:
```
PWA → CMS → UX Polish → WhatsApp → Analytics → Hardening → Launch
```
Every broadcast has somewhere meaningful to go.
Every subscriber lands on a complete product.
WhatsApp is tested against the finished experience.

---

## Phase 17 — Moments Product Completion

### 17A — Public Experience (PWA) ✅
Build the actual public product. Not a placeholder. The real Moments experience.
Homepage, feed, story pages, categories, search, regional browsing, PWA, offline, install prompt, SEO.

### 17B — Sanity CMS Integration ⏳
Introduce Sanity as the editorial layer.
Schema, Studio, GROQ queries, `@sanity/client` in `apps/web`. No content yet — connection only.

### 17C — Public UX Polish ⏳
Connect editorial pages to Sanity. Make the product feel premium.
Animations, loading states, transitions, accessibility, typography, responsive behaviour,
empty states, error states, image optimisation, Open Graph, Lighthouse.

### 17D — WhatsApp Production ⏳
Activate the delivery channel. Production credentials, reply handlers, end-to-end testing.
HELP · STATUS · MYAUTHORITY · opt-in · opt-out · broadcast verification · compliance.

### 17E — Analytics ⏳
Understand how people use the product. Only meaningful once users exist.
Page analytics, subscriber funnels, broadcast funnels, regional analytics, sponsor analytics.

### 17F — Production Hardening ⏳
Harden everything before launch.
Caching, rate limits, monitoring, security headers, performance budget, load testing, Lighthouse ≥ 90.

---

## Phase 18 — Moments Launch

Domain, Vercel deployments, Supabase paid plan, Sanity plan, WhatsApp Business Account verified,
first real broadcast sent.

---

## Ecosystem Roadmap (Post-Moments)

Only after Moments is genuinely production-ready does the next application begin.
Each application builds its own shell, navigation, and domain on top of the shared platform.
None of them modify `packages/`.

| Phase | Application | Description |
|---|---|---|
| 19 | Umkhandlu | Traditional authority and community governance platform |
| 20 | ITPMS | Municipal ICT project management |
| 21 | Schools Portal | Educational institution administration and communication |
| 22 | BeatsChain | Music creator ecosystem — profiles, ISRC, marketplace |
| 23 | Spree Operations | Commercial storefronts and merchant operations |

---

## The Test for Every Decision

Before adding anything to `apps/web`, ask:

1. Is this editorial content? → Sanity (Phase 17B+)
2. Is this operational data? → Supabase via `packages/api`
3. Is this a platform capability? → It already exists in `packages/`
4. Is this Moments-specific UI? → `apps/web/src/components/`

If the answer is "I'm not sure" — stop and ask before writing.
