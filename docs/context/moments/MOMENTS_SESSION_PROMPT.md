# Moments — Session Prompt

Use this at the start of every new thread working on the Moments product.

---

## Repository

`/workspaces/unami-platform-core` — pushed to `origin` → `https://github.com/prooftv/unami-platform-core`

This is a Turborepo + pnpm monorepo. Three packages, two apps, Supabase backend.

```
apps/admin          Moments admin dashboard (Next.js 16, React 19, TypeScript)
apps/web            Moments public PWA (Next.js 16, React 19, TypeScript)
apps/umkhandlu      Unami Control Centre (Phase 18 — complete, frozen)
packages/ui         @unami/ui — design system (frozen)
packages/shared     @unami/shared — platform primitives (frozen)
packages/api        @unami/api — typed API clients (frozen)
supabase/functions  Edge Functions — only layer that touches the database
```

---

## Before Writing Any Code

Read these files in order:

1. `PROJECT_STATUS.md` — current phase, what is done, what is next
2. `docs/context/product-vision.md` — what Moments is and why the build order matters
3. `docs/context/architecture.md` — layer boundaries, data flow, frozen vs active
4. `docs/context/decisions.md` — decisions that must not be reversed
5. `docs/context/CONTENT_OWNERSHIP.md` — Sanity vs Supabase boundary (frozen)
6. `docs/DATABASE_SCHEMA.md` — before any schema change
7. `docs/context/MOMENTS_WHATSAPP.md` — before any WhatsApp or broadcast work

---

## Current State

Phase 17 — Moments Product Completion. Engineering complete. Ops gates remaining.

All ten sub-phases (17A–17J) are engineering-complete.
The remaining work before launch is:

**Engineering tasks (in order):**
1. `docs/DATABASE_SCHEMA.md` — add `whatsapp_templates`, `template_messages`, `messaging_windows` specs ✅
2. Migration 007 — write `007_whatsapp_tables.sql`
3. Fix `broadcast/index.ts` — replace `buildTemplatePayload` with `buildMomentBroadcastPayload` (header + 4 body params)
4. Fix `broadcast/index.ts` — add `buildSponsoredTemplatePayload` for sponsored moments (load sponsor, header + 5 body params + URL button)
5. Fix `broadcast/index.ts` — remove `buildFreeTextPayload`, `formatMessage`, and freeform fallback fetch block
6. Fix `broadcast/index.ts` — fix National subscriber filter (no-op ternary → explicit branch: National = all subscribers, province = region match)
7. Update `LAUNCH_CHECKLIST.md` as items complete

**Ops gates (not engineering — do not block on these):**
- Supabase Pro plan, migrations applied, storage buckets created
- WhatsApp Business Account verified, all 6 secrets set in Supabase
- All 5 templates submitted to Meta and approved
- Vercel deployments with custom domains
- Sanity Studio deployed, seed documents verified
- End-to-end functional validation

---

## Architecture Rules — Non-Negotiable

**Layer boundaries:**
- `packages/ui` — no Supabase, no auth, no domain knowledge
- `packages/shared` — no React, no Next.js, no Supabase, no domain logic
- `packages/api` — typed HTTP clients only, domain types as string literal unions
- `supabase/functions/` — only layer that touches the database
- `apps/admin` — owns Moments domain (`src/domain/moments/`), shell, all admin modules
- `apps/web` — owns public routing, no auth, no Supabase client, Sanity client for editorial

**Data flow:**
```
apps/admin or apps/web
  → packages/api (typed client)
    → supabase/functions/* (Edge Function, Deno)
      → Supabase DB (service role key)
```

**No exceptions:**
- No direct Supabase calls from Next.js application code
- No business logic in React components — components render, they do not decide
- No domain logic in `packages/shared` or `packages/ui`
- No freeform WhatsApp broadcasts — MARKETING templates only (D-028 + MOMENTS_WHATSAPP.md)
- Broadcasted moments are immutable — no edit, no delete (D-006)
- Webhook always returns HTTP 200 to Meta (D-010)

---

## Component Rules

**In `apps/admin`:**
- `@unami/ui` shared primitives for all structural patterns:
  `PageHeader`, `KPIGrid`, `MetricCard`, `TableToolbar`, `TablePagination`, `BulkActionBar`,
  `DataTable`, `EmptyState`, `ErrorState`, `PageSkeleton`, `TableSkeleton`, `StatusBadge`,
  `AnalyticsCard`, `LineChart`, `BarChart`, `PieChart`, `AreaChart`, `ActivityFeed`, `QuickActions`
- shadcn primitives from `src/components/ui/` for low-level elements:
  `Input`, `Select`, `Label`, `Textarea`, `Dialog`, `Button`, `Badge`, `Card`, `Separator`, etc.
- Check shadcn/ui component list before assembling any new component
- Do NOT use from `@unami/ui`: `AppShell`, `Sidebar`, `Header`, `MobileNav` — Phase 3 stubs
- Badge variants: `default | secondary | destructive | outline` only
- `data-active={isActive || undefined}` — never `data-active={isActive}` (D-015)

**Page layout patterns (apps/admin):**

List pages:
```
<PageHeader title description actions={<primary button>} />
<KPIGrid items={...} />          ← if module has metrics
<TableToolbar />                  ← search + filters
<table body>
<TablePagination />
<BulkActionBar />                 ← if bulk actions exist
```

Form pages (create/edit):
```
<PageHeader title description actions={<back button>} />
<div className="max-w-2xl space-y-6">
  <Card><CardHeader /><CardContent>...fields</CardContent></Card>
  <div className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</div>
```

Detail pages (view):
```
<PageHeader title description actions={<Edit/Broadcast/Approve buttons>} />
<div className="max-w-3xl space-y-6">
  <div className="grid grid-cols-2 gap-4">
    <Card>status + metadata</Card>
    <Card>secondary metadata</Card>
  </div>
  <Card>main content</Card>
  <Card>tables, history, audit log</Card>
</div>
```

---

## WhatsApp Integration Summary

Full reference: `docs/context/MOMENTS_WHATSAPP.md`

Key points:
- MARKETING templates only for broadcasts — no freeform fallback
- Freeform is valid only for inbound command responses (user messaged us first)
- 5 templates needed: `welcome_confirmation`, `unsubscribe_confirmation`, `moment_broadcast`, `sponsored_moment`, `subscription_preferences`
- `moment_broadcast` needs: header component (emoji + region short code) + 4 body params (title, content, category, region full name)
- `sponsored_moment` needs: header + 4 body params + sponsor display name + URL button
- Current `buildTemplatePayload` in `broadcast/index.ts` is wrong — sends 3 body params, no header
- National broadcast = all opted-in subscribers (no region filter); province broadcast = `.contains('regions', [region])`
- n8n is deferred (D-023) — broadcast Edge Function handles execution directly for now
- Supabase MCP is available for development introspection — not a runtime dependency

---

## n8n Status

Deferred to post-launch (D-023). Not needed for Phase 17J.

When connected, n8n will:
- Poll `moment_intents` every 1 min (Intent Executor)
- Process scheduled campaigns (Campaign Processor)
- Handle soft moderation queue
- Retry failed messages

Hosting: Hetzner CX11 + Docker or n8n Cloud. Not Railway. Not Render free tier.

---

## Supabase MCP

Available as a development tool for:
- Schema inspection before writing migrations
- Query testing against live data
- RLS policy verification
- Migration validation

Does not change the architecture. Edge Functions remain the only write layer.

---

## Database

26 tables across migrations 000–005. All applied in production (ops gate).

Next migration: `006_whatsapp_tables.sql`
- `whatsapp_templates` — local record of template definitions + approval status
- `template_messages` — audit log of every template message sent
- `messaging_windows` — 24h window tracking per phone number

Rule: update `docs/DATABASE_SCHEMA.md` first, then write the migration.

---

## Key Files

```
supabase/functions/webhook/index.ts         Inbound WhatsApp processing
supabase/functions/broadcast/index.ts       Outbound broadcast execution
supabase/functions/_shared/auth.ts          requireAuth, checkRateLimit, logError, logAudit
apps/admin/src/domain/moments/              All Moments domain: enums, types, validators, helpers
apps/admin/src/lib/api/client.ts            Admin API client factory
apps/web/src/lib/api/client.ts              Public API client factory
apps/web/src/lib/sanity/                    Sanity client, queries, types
packages/api/src/                           Typed clients for all Edge Functions
docs/context/MOMENTS_WHATSAPP.md            WhatsApp reference (this session's primary doc)
docs/LAUNCH_CHECKLIST.md                    Phase 17J acceptance checklist
```

---

## What NOT to Do

- Do not modify `packages/` — frozen at v1.0
- Do not modify `apps/umkhandlu` — Phase 18 complete, frozen
- Do not add domain logic to `packages/shared`
- Do not add Supabase imports to `packages/ui`
- Do not add business logic to React components
- Do not add freeform fallback to broadcast path
- Do not modify `supabase/migrations/000_initial_schema.sql`
- Do not start a new phase until the current phase is complete and documented
- Do not invent new components — check shadcn/ui first, then `@unami/ui`, then build
