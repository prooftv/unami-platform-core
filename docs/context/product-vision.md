# Platform Product Vision

This document locks in the product architecture, data ownership model, and roadmap.
It exists to prevent engineering-first drift.
Read it before starting any phase. Do not contradict it.

---

## What Unami Platform Core Is

Unami Platform Core is the shared engineering foundation for a family of digital products.
The platform is complete at v1.0.0. All future work is application validation.

```
                    Unami Platform Core v1.0
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       Moments          Umkhandlu        Future Apps
    (Phase 17)         (Phase 18)      (Phase 19–21)
   Community           Intelligence    ITPMS · Schools
   Communication       Dashboard       BeatsChain · Spree
```

The platform serves applications. Applications do not reshape the platform.

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
                  (activated in Phase 17I)

┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
│                  Operational Database                       │
│  Moments · Broadcasts · Subscribers · Moderation            │
│  Analytics · Campaigns · Sponsors · Authority               │
│  Participation · Evidence · Institutional Memory            │
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

## The Two-Source Model

`apps/web` queries two separate data sources in one Next.js application.

```
              SANITY CMS                        SUPABASE
                  │                                │
    Editorial Content                    Operational Content
    ─────────────────                    ───────────────────
    Homepage composition                 Moments feed + detail
    Featured stories                     Region + category pages
    Sponsor pages                        Search
    Campaign landing pages               Participation
    About · Help · Privacy · Terms       Evidence
    Authority editorial profiles         Broadcasts
    SEO · Open Graph · media             Subscribers
    Navigation structure                 Analytics
                  │                                │
                  └──────────────┬─────────────────┘
                                 │
                          apps/web (PWA)
                    Same layout. Same design system.
                    Two sources. One experience.
```

Neither source replaces the other. The boundary is defined in `CONTENT_OWNERSHIP.md`.

---

## Responsibility Split

### Sanity CMS owns — editorial, curated, presentation
- Homepage composition — hero, featured stories, layout
- Editorial content — long-form stories, announcements
- Sponsor pages and campaign landing pages
- About, Help, Privacy, Terms pages
- Authority editorial profiles
- SEO metadata, Open Graph, structured data
- Media assets for editorial content
- Navigation structure and featured categories

### Supabase owns — operational, records, evidence, intelligence
- Moments — creation, scheduling, broadcasting
- Broadcasts and delivery pipeline
- Subscriber management and preferences
- Moderation queue and advisory signals
- Authority profiles and audit logs
- Analytics and engagement data
- Compliance and rate limiting
- WhatsApp message processing
- Campaigns and sponsor commercial data
- Participation submissions and logs
- Evidence attachments and environmental context
- Institutional memory and record lineage
- Commercial intelligence and project tracking

### Edge Functions own — orchestration and business rules
- All database access — no application code touches the database directly
- Business rule enforcement (immutability, rate limiting, auth)
- Webhook processing and delivery
- Participation webhook routing
- Evidence capture and verification

### apps/web composes both
- Editorial content from Sanity via GROQ queries
- Operational moments from Supabase via `packages/api` → Edge Functions
- Same Next.js application. Same layout. Same design system.

### apps/admin manages
- Moments creation, scheduling, broadcasting
- Subscriber and moderation workflows
- Sponsor and campaign management
- System settings and feature flags
- Authority profile management

### WhatsApp is the delivery channel — not the product
- Subscribers opt in via WhatsApp deep link on the PWA
- Broadcasts are delivered via WhatsApp Cloud API
- Reply handlers (HELP/STATUS/MYAUTHORITY) are built in Phase 17I — last
- WhatsApp is tested against the finished experience, not before it exists

---

## Architecture Rules

1. Sanity is added to `apps/web` only. Never `packages/`, `apps/admin`, or Edge Functions.
2. Supabase remains the operational store. Sanity does not replace it.
3. `apps/web` queries Sanity directly via `@sanity/client` — no Edge Function proxy.
4. The Sanity dataset is read-only from `apps/web`. All writes happen in Sanity Studio.
5. Sanity Studio is a separate deployment — not inside this monorepo.
6. Moment feed, detail, region, and category pages remain Supabase-driven — always.
7. ISR + on-demand revalidation for all Sanity-driven pages.
8. The content ownership boundary is defined in `CONTENT_OWNERSHIP.md` — frozen before any CMS code.

---

## Why This Order

The wrong order:
```
WhatsApp → PWA → CMS
```
Testing a broadcast against a product that doesn't exist.

The right order:
```
Content Ownership → Sanity → Governance Adaptation → Participation
→ Evidence → Commercial → Intelligence Foundation → WhatsApp → Launch
```
Every broadcast has somewhere meaningful to go.
Every subscriber lands on a complete product.
WhatsApp is tested against the finished experience.
The intelligence layer exists before the dashboard is built.

---

## Phase 17 — Moments Product Completion

Ten sub-phases. Each builds on the last.

| Phase | Name | What it delivers |
|---|---|---|
| 17A | Public PWA Foundation | ✅ The real public product |
| 17B | Content Ownership Constitution | Frozen boundary — Sanity vs Supabase |
| 17C | Sanity Editorial Layer | CMS integration — only after ownership frozen |
| 17D | Governance Adaptation | Participation, evidence, development moments |
| 17E | Public Participation Engine | Consent-gated, webhook-delivered, never stored |
| 17F | Evidence Layer | Media evidence, weather context, verification |
| 17G | Commercial Layer | Full project tracking, certified deliverables |
| 17H | Intelligence Foundation | Aggregations, KPIs, derived metrics — no dashboard yet |
| 17I | WhatsApp Integration | End-to-end delivery — last |
| 17J | Production Validation and Launch | Moments v2 is shipped |

---

## Phase 18 — Umkhandlu Intelligence Dashboard

The first application built on top of the mature platform.
Not another CMS. Not another admin. The control centre.

Begins only after Phase 17J is complete.

Consumes:
- Multiple Umkhandlu governance nodes
- Moments operational data
- Future application nodes
- Commercial intelligence
- Evidence and participation
- Institutional memory

Produces:
- Regional intelligence view
- Cross-node aggregation
- Infrastructure health
- Participation trends
- Commercial projections
- Predictive analytics

---

## Platform Roadmap

```
Phase 16  Platform Independence          ✅ Complete
Phase 17  Moments Product Completion     ⏳ Active
Phase 18  Umkhandlu Intelligence Dashboard
Phase 19  Multi-node Federation
Phase 20  Commercial Intelligence
Phase 21  National Institutional Memory
```

Future applications (Umkhandlu governance app, ITPMS, Schools Portal, BeatsChain, Spree)
are scaffolded as concrete product requirements emerge — not on a fixed schedule.
Each consumes `@unami/ui`, `@unami/shared`, `@unami/api`. None modify `packages/`.

---

## The Test for Every Decision

Before adding anything to `apps/web`, ask:

1. Is this editorial content? → Sanity (Phase 17C+) — confirm against `CONTENT_OWNERSHIP.md`
2. Is this operational data? → Supabase via `packages/api`
3. Is this a platform capability? → It already exists in `packages/`
4. Is this Moments-specific UI? → `apps/web/src/components/`

Before adding anything to the platform, ask:

1. Does it appear in more than one application?
2. Is it free of domain vocabulary?
3. Can it be described without referencing any specific application?

If any answer is no — it belongs in the application domain, not the platform.

If the answer is "I'm not sure" — stop and ask before writing.
