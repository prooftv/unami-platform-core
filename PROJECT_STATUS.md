# Project Status

Living engineering snapshot. Updated at every phase transition.
Read this first when resuming work or starting a new session.

---

## Current State

| Field | Value |
|---|---|
| Version | `v1.0.0-unami-platform` |
| Phase | Phase 17B — Sanity CMS Integration |
| Branch | `main` |
| Workspace | `/workspaces/unami-platform-core` |
| Remote | `origin` → `https://github.com/prooftv/unami-platform-core` |
| Last commit | `5354607` |
| Build | ✅ Passing |
| Typecheck | ✅ Passing |

---

## What This Repository Is Now

The platform infrastructure is complete. This is no longer platform engineering.

This is **product work** — shipping the complete Moments experience.

The public product defines everything. Build from the outside inward.

---

## Platform Foundation — Complete

| Layer | Status |
|---|---|
| Database — 26 tables | ✅ Complete |
| Edge Functions — 15 functions | ✅ Complete |
| `packages/shared` — platform primitives | ✅ Complete |
| `packages/ui` — design system | ✅ Complete |
| `packages/api` — typed clients | ✅ Complete |
| `apps/admin` — all modules, full CRUD | ✅ Complete |

---

## Phase 17 — Moments Product Completion

This is the complete Moments product. Six sub-phases. Each one builds on the last.
Do not begin a sub-phase until the previous one is complete and documented.

---

### Phase 17A — Public Experience (PWA) ✅

**Goal:** Build the actual public product. Not a placeholder. The real Moments experience.

| Task | Status |
|---|---|
| Full responsive navigation — desktop, mobile drawer, theme toggle | ✅ |
| Homepage — 9 sections: urgent strip, hero, featured, latest, categories, sponsored, community notices, authority updates, subscribe CTA | ✅ |
| Dedicated /feed page | ✅ |
| Moment cards — urgency badges, sponsor attribution, region/category metadata | ✅ |
| Moment detail — full content, media, WhatsApp share | ✅ |
| Category pages | ✅ |
| Region pages | ✅ |
| Search | ✅ |
| Subscribe page — WhatsApp opt-in flow with commands reference | ✅ |
| About / Help / Privacy / Terms — static pages | ✅ |
| Sponsors / Campaigns / Authority — shell pages | ✅ |
| Global 404 | ✅ |
| Theme toggle — localStorage persistence, FOUC prevention | ✅ |
| PWA manifest | ✅ |
| Service worker — offline support | ✅ |
| Build: 16 routes, TypeScript clean | ✅ |

---

### Phase 17B — Sanity CMS Integration ⏳

**Goal:** Introduce Sanity as the editorial layer. Supabase remains the operational database.
Sanity does not replace Supabase. It complements it.

**Sanity owns:** homepage composition, hero, featured stories, sponsor pages, campaign landing pages,
about, help, privacy, authority editorial profiles, SEO metadata, Open Graph, media assets.

**Supabase owns:** moments, broadcasts, subscribers, moderation, analytics, campaigns, sponsors, authority data.

| Task | Status |
|---|---|
| Sanity project created | ⏳ |
| Schema: `homePage`, `featuredStory`, `sponsorPage`, `helpArticle`, `aboutPage`, `privacyPage`, `authorityPage` | ⏳ |
| GROQ queries defined for all schemas | ⏳ |
| Sanity Studio deployed (Sanity-hosted) | ⏳ |
| `@sanity/client` added to `apps/web` only | ⏳ |
| `apps/web/src/lib/sanity/client.ts` — typed Sanity client | ⏳ |
| `apps/web/src/lib/sanity/queries.ts` — all GROQ queries | ⏳ |
| Environment variables: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | ⏳ |
| `.env.example` updated | ⏳ |

---

### Phase 17C — Public UX Polish ⏳

**Goal:** Once content exists, make the product feel premium.

| Task | Status |
|---|---|
| Connect homepage hero + featured stories → Sanity | ⏳ |
| Connect About / Help / Privacy / Terms → Sanity | ⏳ |
| Connect Sponsor pages → Sanity | ⏳ |
| Connect Authority editorial profiles → Sanity | ⏳ |
| ISR for all Sanity-driven pages | ⏳ |
| On-demand revalidation webhook (`/api/revalidate`) | ⏳ |
| Loading skeletons for all data-fetching pages | ⏳ |
| Empty states — feed, search, category, region | ⏳ |
| Error states — API failure, offline | ⏳ |
| Image optimisation — Next.js `<Image>` throughout | ⏳ |
| Responsive behaviour audit — all breakpoints | ⏳ |
| Accessibility audit — keyboard nav, ARIA, contrast | ⏳ |
| Typography polish — line height, spacing, reading width | ⏳ |
| Open Graph metadata on all pages | ⏳ |
| Structured data (JSON-LD) on moment detail pages | ⏳ |
| PWA install prompt | ⏳ |
| Lighthouse score baseline | ⏳ |

---

### Phase 17D — WhatsApp Production ⏳

**Goal:** End-to-end broadcast delivery working in production.
Only now — because now broadcasts land on a complete product.

| Task | Status |
|---|---|
| WhatsApp Cloud API credentials configured in Supabase secrets | ⏳ Ops |
| HELP reply handler (Edge Function) | ⏳ |
| STATUS reply handler (Edge Function) | ⏳ |
| MYAUTHORITY reply handler (Edge Function) | ⏳ |
| Opt-in confirmation message | ⏳ |
| Opt-out confirmation message | ⏳ |
| Broadcast template testing | ⏳ |
| Live webhook end-to-end test with real subscriber | ⏳ |
| Delivery verification | ⏳ |
| Retry testing | ⏳ |
| Compliance verification (POPIA) | ⏳ |
| Full flow: Admin → Broadcast → WhatsApp → Subscriber → PWA | ⏳ |

---

### Phase 17E — Analytics ⏳

**Goal:** Understand how people use the product. Only meaningful once users exist.

| Task | Status |
|---|---|
| Page view analytics | ⏳ |
| Subscriber funnel (visit → subscribe → first moment) | ⏳ |
| Broadcast funnel (sent → delivered → read) | ⏳ |
| Regional analytics dashboard | ⏳ |
| Referral analytics | ⏳ |
| Sponsor analytics | ⏳ |
| PWA install tracking | ⏳ |
| Search analytics | ⏳ |

---

### Phase 17F — Production Hardening ⏳

**Goal:** Harden everything before launch.

| Task | Status |
|---|---|
| Caching strategy — CDN, ISR, service worker | ⏳ |
| Rate limiting audit — all Edge Functions | ⏳ |
| Image optimisation — Supabase Storage + Next.js Image | ⏳ |
| Error monitoring — Sentry or equivalent | ⏳ |
| Performance budget — bundle size, LCP, CLS | ⏳ |
| Security headers — CSP, HSTS, X-Frame-Options | ⏳ |
| Edge Function optimisation — cold start, response time | ⏳ |
| Load testing — broadcast at scale | ⏳ |
| Lighthouse — all pages ≥ 90 | ⏳ |
| Accessibility — WCAG 2.1 AA | ⏳ |
| Deployment documentation | ⏳ |
| Rollback procedures | ⏳ |

---

## Phase 18 — Moments Launch

**Goal:** Moments is publicly available and production-ready.

| Task | Status |
|---|---|
| Domain configured | ⏳ |
| Vercel deployments — `apps/web` and `apps/admin` | ⏳ |
| Supabase project on paid plan | ⏳ |
| Sanity project on appropriate plan | ⏳ |
| WhatsApp Business Account verified | ⏳ |
| First real broadcast sent | ⏳ |

---

## Ecosystem Roadmap (Post-Moments)

Only after Moments is genuinely production-ready does the next application begin.
Each application builds its own shell, navigation, and domain on top of the shared platform.

| Phase | Application | Foundation |
|---|---|---|
| Phase 19 | Umkhandlu — traditional authority governance platform | `@unami/ui`, `@unami/shared`, `@unami/api` |
| Phase 20 | ITPMS — municipal ICT project management | `@unami/ui`, `@unami/shared`, `@unami/api` |
| Phase 21 | Schools Portal — educational institution tooling | `@unami/ui`, `@unami/shared`, `@unami/api` |
| Phase 22 | BeatsChain — music creator ecosystem | `@unami/ui`, `@unami/shared`, `@unami/api` |
| Phase 23 | Spree Operations Dashboard — commercial storefronts | `@unami/ui`, `@unami/shared`, `@unami/api` |

---

## Architecture Freeze

The platform foundation is **feature-frozen**. Do not:
- Add new packages
- Restructure `packages/`
- Add new tables without a concrete product requirement
- Redesign the admin shell
- Create new abstraction layers
- Add domain logic to `packages/shared`
- Add application-specific components to `packages/ui`

Fix bugs only. All new work is Moments product completion.

---

## Known Issues

| Issue | Severity | Phase |
|---|---|---|
| Advisory confidence hardcoded `0.5` — n8n not connected | P2 | Deferred (D-023) |
| WhatsApp secrets unset in Supabase | P0 Ops | Phase 17D |
| HELP/STATUS/MYAUTHORITY webhook reply handlers not built | P1 | Phase 17D |

---

## Known Technical Debt

| Item | Location | Resolution |
|---|---|---|
| Phase 3 shell placeholders | `packages/ui/src/shell/` | `AppShell`, `Sidebar`, `Header`, `MobileNav` are unfinished stubs. Do not consume. Future platform milestone. |

---

## Repository Layout

```
unami-platform-core/
├── apps/
│   ├── admin/          Next.js 16 — Moments admin (complete)
│   └── web/            Next.js 16 — Moments public PWA (Phase 17A complete)
├── packages/
│   ├── ui/             @unami/ui — design system (frozen)
│   ├── shared/         @unami/shared — platform primitives (frozen)
│   └── api/            @unami/api — typed clients (frozen)
├── supabase/
│   ├── functions/      15 Edge Functions (frozen)
│   └── migrations/
│       └── 000_initial_schema.sql   ← baseline, immutable
├── docs/
│   ├── DATABASE_SCHEMA.md
│   ├── SCHEMA_MAPPING.md
│   └── context/
│       ├── architecture.md
│       ├── decisions.md
│       ├── security-model.md
│       └── product-vision.md
```

---

## Rules — Do Not Violate

1. All work in `/workspaces/unami-platform-core`, pushed to `origin`.
2. `/workspaces/moments-v2` is reference only — never edit it.
3. `supabase/migrations/000_initial_schema.sql` is immutable — never modify it.
4. `docs/DATABASE_SCHEMA.md` is the schema source of truth — change here first, then write a migration.
5. `packages/ui` — no Supabase, no auth, no application-specific logic.
6. `packages/shared` — no React, no Next.js, no Supabase, no domain logic.
7. Edge Functions are the only layer that touches the database.
8. Frontend communicates through `packages/api` typed clients only.
9. Platform foundation is feature-frozen — no new abstractions, no restructuring.
10. Do not begin a new phase until the previous phase is complete and documented.
11. Each phase must answer: "Which user experience becomes fully usable?"
