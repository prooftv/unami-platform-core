# Key Decisions

Decisions that must not be reversed without explicit instruction.

---

## D-001: Single baseline migration
`supabase/migrations/000_initial_schema.sql` is the baseline.
Never modify it. All changes go in new numbered migration files (`001_`, `002_`, etc.).

## D-002: No custom auth tables
Supabase Auth handles all sessions. No custom auth tables.
`admin_roles` maps Supabase Auth user IDs to application roles only.

## D-003: Edge Functions are the only DB layer
No direct Supabase calls from Next.js server components or API routes.
All data access flows through `supabase/functions/*` → `packages/api` → apps.

## D-004: packages/ui has no application knowledge
No Moments-specific terminology, no Supabase imports, no auth logic.
Must be equally usable by Moments, Spree Operations, BeatsChain, Umkhandlu.

## D-005: Fail-open authority system
Authority lookup errors never block WhatsApp message processing.
All authority callers handle null gracefully.

## D-006: Broadcasted moments are immutable
Once status = 'broadcasted', no edits and no deletes.
Enforced in Edge Functions, not just the database.

## D-007: Platform foundation is feature-frozen
No restructuring of `packages/`, no new abstraction layers, no new packages
unless a concrete product requirement demands it.
Infrastructure work is complete. All new work is product workflow completion.

## D-008: Workspace and remote
All work in `/workspaces/unami-platform-core`.
All pushes to `origin` → `https://github.com/prooftv/unami-platform-core`.
The `moments-v2` directory is reference only — never edit it.

## D-009: Package scope rename — complete
Package scope renamed from `@moments/*` to `@unami/*` in Phase 16.
All packages, apps, and imports updated. pnpm-lock.yaml regenerated.

## D-010: WhatsApp always returns 200
The webhook Edge Function always returns HTTP 200 to Meta.
Errors are logged to `error_logs` internally. Never surfaced to Meta.

## D-011: Admin shell is the permanent shell
The shadcn/ui dashboard (arhamkhnz/next-shadcn-admin-dashboard) is the canonical admin shell.
No further shell redesigns. Moments adapts to the shell — the shell does not adapt to Moments.
`(admin)/layout.tsx` is the single auth gate and shell owner for all admin routes.

## D-012: Component policy — shared primitives are the standard
Admin modules use `@unami/ui` shared primitives for all structural patterns:
`PageHeader`, `KPIGrid`, `MetricCard`, `TableToolbar`, `TablePagination`, `BulkActionBar`,
`DataTable`, `EmptyState`, `ErrorState`, `PageSkeleton`, `TableSkeleton`, `StatusBadge`,
`AnalyticsCard`, `LineChart`, `BarChart`, `PieChart`, `AreaChart`, `ActivityFeed`, `QuickActions`.
Shadcn primitives from `src/components/ui/` are used for low-level elements only:
`Input`, `Select`, `Label`, `Textarea`, `Dialog`, `Button`, `Badge`, `Card`, etc.
Do NOT use from `@unami/ui` in admin: `AppShell`, `Sidebar`, `Header`, `MobileNav` —
the admin shell owns those directly.

## D-013: Product phases over technical fixes
From Phase 10 onward, work is organised by product workflow, not by technical component.
Each phase must answer: "Which user workflow becomes fully usable?"
Phases: 10 Moments Workflow ✅ → 11 Community ✅ → 12 Commercial ✅ → 13 Hardening (partial) → 14 Public PWA ✅ → 15 Automation & Production → 16 Expansion.

## D-014: Badge variants — shadcn only
shadcn `Badge` accepts only: `default | secondary | destructive | outline | ghost | link`.
Custom variants `warning`, `success`, `info` from `@unami/ui` do not exist.
Map: `warning` → `secondary`, `success` → `default`, `info` → `outline`.

## D-015: Sidebar active state — attribute not boolean
`data-active={isActive || undefined}` — never `data-active={isActive}`.
When false, the attribute must be omitted entirely. Tailwind v4 `data-active:` matches
any element with the attribute present regardless of value, causing all items to appear active.

## D-016: Public data access — separate endpoint path, no auth bypass
Public read routes live at `/moments/public` and `/moments/public/:id` in the moments Edge Function.
They do not call `requireAuth()`. They enforce `status = 'broadcasted' AND publish_to_pwa = true` at the DB query level.
The service role key is used server-side in the Edge Function — the anon key is only used as a bearer token
to reach the Edge Function, not to query the database directly.
This preserves the architectural rule: no application code calls Supabase directly.

## D-017: `createPublicApiClient` — separate factory, same package
Public API access uses `createPublicApiClient({ baseUrl, token: anonKey })` from `packages/api`.
This is a separate factory from `createApiClient` — it returns only `{ moments }` (public client).
`apps/web` never imports `createApiClient`. The distinction is enforced at the import level.

## D-018: `apps/web` has no Supabase client
`apps/web` does not depend on `@supabase/supabase-js` or `@supabase/ssr`.
All data flows through `packages/api` → Edge Functions. The anon key is an env var used
only as a bearer token in the API client config. No direct DB access from the public app.

## D-019: Rate limiting — enforced at Edge Function layer
Rate limiting is enforced via the `rate_limits` table in `_shared/auth.ts` `checkRateLimit()`.
Limits: webhook 1000/min (keyed by IP, always returns 200 to Meta), moments POST 60/min (by IP),
broadcast 10/min (by user ID). The `rate_limits` table already existed in the schema — this
completes the enforcement that was previously absent.

## D-020: Broadcast retry — separate function, MAX_ATTEMPTS=3
Failed broadcast batches are retried via `POST /retry-batches` (new Edge Function).
Max 3 attempts tracked via `moment_intents.attempts`. Only partial failures are retried —
batches where all recipients failed are skipped (likely invalid numbers).

## D-021: Media storage — Supabase Storage bucket `moments-media`
Media uploads go through `POST /media` Edge Function → Supabase Storage bucket `moments-media`.
Allowed types: image/jpeg, png, webp, gif, audio/mpeg, ogg, wav, video/mp4, webm, application/pdf.
Max 16 MB. Returns public URL. Records in `media` table. Superadmin-only delete.

## D-022: Service worker — cache-first static, network-first navigation
`apps/web/public/sw.js` registered via Next.js Script (afterInteractive).
Strategy: cache-first for static assets (.js/.css/images), network-first for navigation
with offline fallback to `/offline` page. API calls and cross-origin requests bypass the cache.

## D-023: n8n is deferred, not eliminated
n8n is the eventual automation layer for scheduled broadcast triggers, intent execution,
HELP/STATUS/STOP auto-replies, and weekly digest generation.
It is deferred to the final phase — not removed from the roadmap.
When HELP/STATUS/MYAUTHORITY reply handlers are built, they will be Supabase-native Edge Functions
first, with n8n as the orchestration layer when it is connected.

## D-024: Bulk actions — client-side fan-out over existing endpoints
Bulk operations (approve, reject, cancel, delete) are implemented as client-side `Promise.allSettled`
fan-out over existing single-ID Edge Function endpoints.
No new bulk endpoints are added to Edge Functions.
The `BulkActionBar` component in `packages/ui` surfaces results — partial failures are shown,
not silently swallowed. Audit logs are written per-operation by the existing endpoint handlers.

## D-027: Domain extraction — Moments domain lives in apps/admin, not packages/shared
`packages/shared` contains only platform-generic primitives: `Language`, `ModerationStatus`,
`MessageType`, `AdminRole`, `Pagination`, `PaginatedResponse`, `AdminUser`, `SystemSetting`,
`Message`, auth validators, settings validators, phone/formatting/failOpen helpers.

All Moments-specific domain lives in `apps/admin/src/domain/moments/`:
enums (MomentStatus, Region, Category, UrgencyLevel, SponsorTier, CampaignStatus, etc.),
constants (LIMITS, COMMANDS, BLAST_RADIUS_BY_LEVEL, MCP, BUDGET, PROHIBITED_TERMS, etc.),
types (Moment, Sponsor, Campaign, Broadcast, AuthorityProfile, etc.),
validators (CreateMomentSchema, CreateCampaignSchema, etc.),
helpers (isBroadcastable, isEditable, formatMomentForWhatsApp, etc.).

`packages/api` inlines Moments domain types as string literal unions — it has no dependency
on the domain package. This keeps the API client usable by any future application.

`apps/web` has its own `src/domain/moments.ts` with only the const objects it needs
for public routing (Region, Category). It does not import from `apps/admin`.

The rule: if deleting Moments entirely, `packages/shared`, `packages/ui`, and `packages/api`
must still compile without modification. As of Phase 16, this is true.

## D-028: Product-first ordering — PWA before WhatsApp
The correct build order for Moments is: PWA → CMS → UX Polish → WhatsApp → Analytics → Hardening → Launch.
WhatsApp is the delivery channel, not the product. Testing a broadcast against a product that doesn't
exist produces no useful signal. WhatsApp production integration (Phase 17D) is intentionally deferred
until the public product is complete and polished.

The wrong order (WhatsApp → PWA → CMS) was engineering-first drift. D-028 locks in the correct order.

## D-029: Two-source model — Sanity and Supabase are complementary
`apps/web` queries two separate data sources in one Next.js application:
- Sanity (via `@sanity/client` GROQ) — editorial content: homepage, stories, sponsors, help, about, privacy
- Supabase (via `packages/api` → Edge Functions) — operational content: moments, feed, detail, region, category

Sanity does not replace Supabase. Supabase does not replace Sanity.
The moment feed, detail, region, and category pages are always Supabase-driven.
The homepage hero, featured stories, and static pages are always Sanity-driven (from Phase 17B).
Neither source crosses into the other's domain.

## D-037: Node registry — registration is not ownership

The Control Centre's Supabase database stores registration metadata only:
node URL, API key, capabilities, and polling status (`governance_nodes`).
It stores aggregated intelligence snapshots (`node_snapshots` — Phase 18C).
It never stores governance content: records, notices, evidence, participation, or people.

Registering a node means: the Control Centre knows where to find it and how to authenticate.
It does not mean: the Control Centre owns or hosts any of its data.

The constitutional reference is `docs/context/GOVERNANCE_NODE_REGISTRY.md`.

The test: if the Control Centre's Supabase database were deleted entirely, every governance
node would continue operating without interruption. The asymmetry is intentional and permanent.

---

## D-036: Node sovereignty — the Control Centre observes, it does not govern

Every deployed application node is sovereign over its own operational data.

The Control Centre (`apps/umkhandlu`) never edits, mutates, creates, or administers
content that belongs to a node. All write operations remain within the originating node.

The Control Centre consumes read-only authenticated APIs to derive institutional intelligence.
It asks questions. It does not issue commands.

This applies permanently and without exception:
- No create/edit/delete screens for records, notices, evidence, or participation in `apps/umkhandlu`
- No write operations in `packages/api` intelligence clients
- No mutations proxied through the platform to a node
- No administrative actions on node content from the Control Centre

The separation of concerns:
- **Umkhandlu node** (`umkhandlu.unamifoundation.org`) — owns governance, writes data
- **Moments** — owns community communication, writes data
- **Platform Core** (`packages/`, Supabase, Edge Functions) — owns shared infrastructure
- **Control Centre** (`apps/umkhandlu`) — owns intelligence, reads only

This decision protects the federated sovereignty model. When a second node is onboarded,
it connects to the same read-only contract. The Control Centre requires no changes.
The node retains full authority over its own data.

---

## D-035: Phase 18 is the Unami Control Centre — not a governance editor

The production Umkhandlu governance application exists at `umkhandlu.unamifoundation.org`.
It owns governance editing, records, notices, evidence, participation, public website, and Sanity Studio.
Platform Core does not duplicate it.

`apps/umkhandlu` inside Platform Core is the **Unami Control Centre** — a read-oriented
intelligence application that connects to deployed governance nodes and aggregates institutional
intelligence across them.

The abstraction pack (`docs/abstractions/umkhandlu/`) defines shared platform concepts so that
all nodes speak the same language when the Control Centre queries them. It does not require
Platform Core to build CRUD screens for those concepts.

The constitutional hierarchy when documents conflict:
1. `product-vision.md` — what the product exists to become
2. `architecture.md` — how that vision is realised
3. `decisions.md` — immutable architectural decisions
4. `PROJECT_STATUS.md` — current execution plan only

`PROJECT_STATUS.md` cannot redefine the product. It tracks implementation of the product
already defined in the documents above it. When phase descriptions in `PROJECT_STATUS.md`
contradict `product-vision.md` or `decisions.md`, the higher documents win.

Phase 18 sub-phases (corrected):
- **18A** — Foundation: scaffold `apps/umkhandlu` as Control Centre, node registry model, platform tables
- **18B** — Node Connection: connect to first governance node, read-only API, data model alignment
- **18C** — Node Health View: per-node health dashboard, record/notice/project counts, status distributions
- **18D** — Cross-Node Aggregation: multi-node view, regional intelligence, comparative performance
- **18E** — Commercial Intelligence: RAG distribution, deliverables, beneficiary tracking, projections
- **18F** — TCRS Escalation Surface: conflict logs, authority classification, escalation tracking
- **18G** — Institutional Memory: lineage views, provenance, Layer 5 derived outputs

The CRUD screens built in the previous 18A–18C implementation (records list, record detail,
create record, notices list, notice detail, create notice) are the wrong thing.
They duplicate the existing Umkhandlu repository and must not be deployed or extended.
They may be removed in a cleanup commit before 18B begins.

## D-032: Platform validation order
Unami Platform Core reached platform completeness at v1.0.0. All future work follows
a validation sequence:

1. Complete the first product (Moments — Phase 17A through 17J).
2. Validate the platform through a second application (Unami Control Centre — Phase 18).
3. Expand the platform only when validated application requirements reveal reusable capabilities
   that genuinely benefit more than one application.

This protects against speculative platform expansion. The platform grows from proven
application requirements — not from anticipated future needs.

The roadmap:
```
Phase 16  Platform Independence          ✅ Complete
Phase 17  Moments Product Completion     ⏳ Active
Phase 18  Unami Control Centre
Phase 19  Multi-node Federation
Phase 20  Commercial Intelligence
Phase 21  National Institutional Memory
```

## D-031: Umkhandlu abstraction pack — knowledge before implementation
The Umkhandlu governance domain has been distilled into a 13-document constitutional abstraction pack
in `docs/abstractions/umkhandlu/`. This pack is the canonical architectural reference for every future
implementation decision that touches governance, records, participation, evidence, or intelligence.

No implementation follows from this pack until Phase 18 (Moments Launch) is complete.
The pack does not modify `packages/`, does not scaffold applications, and does not change the database.

The critical bridge document is `09_PLATFORM_MAPPING.md` — it classifies every concept as
platform-generic or domain-specific and prevents architectural drift.

The implementation sequence is defined in `12_IMPLEMENTATION_ROADMAP.md`.
Phase 19 (Umkhandlu) begins only after Phase 18 is complete.

## D-034: Commercial domain frozen — COMMERCIAL_DOMAIN.md is the constitutional reference

The commercial domain has been distilled into a constitutional document:
`docs/context/COMMERCIAL_DOMAIN.md`.

This document defines the domain model, object hierarchy, platform boundaries, database
ownership, and evolution path for the commercial capability across all Unami applications.

Key decisions locked by this document:
- `project_updates` is a separate table — not JSONB. Phase 18 addition.
- `lessons_learned` is permanent institutional memory — written once at closure, never overwritten.
- `content` on a campaign is the permanent project overview — written once, never overwritten.
- `progress_log` is append-only — entries are never edited or deleted.
- Reporting is derived from underlying records — never manually assembled.
- Certification authority is domain-defined — the platform provides the model, applications define who certifies.
- Missing columns (`contract_number`, `consulting_engineer`, `total_deliverables`, `reported` status)
  are Phase 18 additions — not Phase 17 gaps.

The commercial domain is platform-generic. Moments is the first implementation.
Umkhandlu is the first application to use the full `csr` project tracking capability.
No application owns the commercial domain. The platform owns it.

## D-033: Phase 17 engineering complete — ops gates remaining
All Phase 17 engineering deliverables are complete as of commit `phase-17j-complete`.
Moments v2 is feature-complete and production-ready from an engineering standpoint.

The remaining gates before launch are operational:
- Supabase Pro plan, migrations applied, storage buckets created
- WhatsApp Business Account verified, credentials set in Supabase secrets
- Vercel deployments with custom domains
- Sanity Studio deployed, seed documents verified
- End-to-end functional validation against production infrastructure
- Lighthouse scores verified, first real broadcast sent

The acceptance checklist is `docs/LAUNCH_CHECKLIST.md`.
Phase 18 (Unami Control Centre) begins only after the checklist is signed off.

---

**List pages:**
- `PageHeader` (title, description, primary action button)
- `KPIGrid` if the module has metrics
- `TableToolbar` for search + filters
- Table body
- `TablePagination` footer
- `BulkActionBar` if bulk actions exist

**Form pages (create / edit):**
- `PageHeader` (title, description, back button in actions)
- `<div className="max-w-2xl space-y-6">`
- One `Card` per logical field group (Content, Classification, Publishing, etc.)
- Submit row: `<div className="flex justify-end gap-2">` with Cancel + Save buttons
- `max-w-2xl` — never `max-w-xl` or unconstrained
- Back navigation in `PageHeader` actions — never an `<ArrowLeft>` button beside the `<h1>`
- Error: `<p className="text-sm text-destructive">` — never raw colour classes
- Success feedback: `<p className="text-sm text-muted-foreground">` — never `text-green-600`
- `getToken` imported from `@/lib/auth/token` — never copy-pasted

**Detail pages (view / read):**
- `PageHeader` (title, description, action buttons: Edit / Broadcast / Approve / Cancel)
- `<div className="max-w-3xl space-y-6">`
- `grid grid-cols-2 gap-4` for status + metadata cards
- `Card` for main content
- `Card` for tables (history, transactions, audit log)
- `max-w-3xl` — never `max-w-2xl` or unconstrained
- Action buttons in `PageHeader` actions — never inline beside the title
- Status badges inside the first Card — not in the header

This pattern applies to every page in `apps/admin` and every future application built on the platform.
`packages/ui/src/shell/` will become a generic shell framework providing infrastructure primitives:
`ShellProvider`, `ShellSidebar`, `ShellHeader`, `ShellContent`, `ShellFooter`,
`ShellBreadcrumbs`, `ShellSearch`, `ShellCommandPalette`, `ShellPreferences`,
`ShellUserMenu`, `ShellNotifications`, `ShellMobileNavigation`.

What the shell framework does NOT contain:
- Navigation items
- Logos or branding
- Product-specific modules
- Routing assumptions
- Any reference to Moments, Umkhandlu, Spree, or any application

Each application composes its own shell on top of these primitives:
- `apps/admin` → `AppSidebar`, `MomentsHeader`, `MomentsNavigation`
- `apps/umkhandlu` → `UmkhandluSidebar`, `UmkhandluHeader`
- `apps/spree` → `SpreeSidebar`

The current `packages/ui/src/shell/` components (`AppShell`, `Sidebar`, `Header`, `MobileNav`,
`ContentLayout`) are placeholders from Phase 3. They are NOT the shell framework.
They must not be consumed by any application until the shell framework milestone is complete.

This work is a dedicated platform milestone — not an unplanned refactor.
It is scheduled after Phase 16 (package rename) is complete.
`apps/admin` remains the reference implementation that the shell framework will be extracted from.
