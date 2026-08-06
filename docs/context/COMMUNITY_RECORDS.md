# Community Records

Constitutional document for Phase 17D.
Read before touching any admin UI, Edge Function, or public PWA code related to records.
Read alongside `docs/context/MOMENTS_EVOLUTION.md` and `docs/abstractions/umkhandlu/02_RECORD_ARCHITECTURE.md`.

---

## What a Community Record Is

A Community Record is a formal outcome produced by a community moment.

It is the answer to: *what happened as a result of this moment?*

A moment broadcasts. A Community Record documents.

```
Community Moment (broadcast)
  → something happens in the community
    → operator creates a Community Record
      → record is linked to the originating moment
        → record becomes part of the Community Timeline
```

Community Records are not a replacement for moments. They are what moments can produce.
A moment without a record is still a complete moment. A record without a moment is an orphan —
it should be rare and intentional.

---

## What a Community Record Is Not

- **Not a governance record.** No traditional authority vocabulary. No statutory instruments.
  No SPLUMA, NEMA, or Ingonyama Trust references. Those belong to Umkhandlu.

- **Not a CMS post.** Records are operational data. They live in Supabase, not Sanity.
  The boundary is frozen in `docs/context/CONTENT_OWNERSHIP.md`.

- **Not a moment.** Records are not broadcast. They are not delivered via WhatsApp.
  They are discoverable context on the PWA — not outbound communications.

- **Not editable after adoption.** Once a record reaches a terminal status
  (`adopted`, `approved`, `resolved`, `rejected`), it is immutable.
  New records reference old ones. Old records are never overwritten.

- **Not a form submission.** Records are operator-created outputs, not community inputs.
  Community inputs are Community Responses (Phase 17E).

---

## Community Record Types

These are the Moments vocabulary for the platform `records.type` column.
They are community-appropriate translations of the governance record types.

| Type value | Display label | When to use |
|---|---|---|
| `community-meeting` | Community Meeting | Minutes or outcome of a community gathering |
| `community-decision` | Community Decision | A formal community resolution or agreement |
| `community-report` | Community Report | A status update or progress report on a community matter |
| `community-concern` | Community Concern | An ongoing issue that needs tracking — has a life |
| `community-outcome` | Community Outcome | A completed initiative or resolved matter |
| `infrastructure-update` | Infrastructure Update | Progress on a development or infrastructure project |
| `infrastructure-completion` | Infrastructure Completion | A project milestone or completion record |
| `community-policy` | Community Policy | A community rule, guideline, or agreement |

**Rules:**
- These 8 types are the complete Moments vocabulary. Do not add types without updating this document.
- The `type` column in the `records` table is a plain string — no DB enum. Validation is in the Edge Function.
- Governance types (`minutes`, `resolution`, `land-allocation`, `dispute-resolution`) are never used in Moments.

---

## Record Status Lifecycle

```
pending
  │
  ├──► adopted     (community-meeting, community-policy — formally accepted)
  ├──► approved    (community-decision — authority sign-off)
  ├──► resolved    (community-concern, community-outcome — matter closed)
  └──► rejected    (community-decision — declined)
```

**Rules:**
- Status transitions are one-directional. No reverting.
- `pending` is the only mutable state — all fields can be edited.
- Once a terminal status is reached, the record is immutable. No edits. No deletes.
- Status transitions are enforced in the Edge Function, not the database.
- The `open` status from the governance model is not used in Moments — use `pending` for ongoing concerns.

---

## Who Creates a Community Record

Only operators (authenticated admin users with `content_admin` or `superadmin` role).

Community members do not create records. They create Community Responses (Phase 17E).

The operator creates a record after a real-world event has occurred:
- After a community meeting has taken place
- After a community decision has been made
- After an infrastructure milestone has been reached
- After a community concern has been resolved

Records document what happened. They are not created speculatively.

---

## How a Record Links to a Moment

Every Community Record should be linked to an originating moment via `origin_notice_id`.

In the platform schema, moments are the Moments equivalent of notices.
The `origin_notice_id` FK on the `records` table references the `notices` table —
but in Moments, the originating event is a moment, not a notice.

**Implementation decision:** The `records` table has `origin_notice_id UUID REFERENCES notices(id)`.
Moments does not use the `notices` table directly — moments are the notice equivalent.
Therefore, `origin_notice_id` is left null for Moments records, and a separate
`moment_id UUID REFERENCES moments(id)` column is added via migration 008.

This keeps the platform table clean while giving Moments its own FK.

The `moment_id` column:
- Is nullable — orphan records are allowed but discouraged
- Is set on creation and never changed
- Is indexed for timeline queries
- Is not exposed to the public API — only the moment's public data is surfaced

---

## Lineage — When Records Reference Other Records

A Community Record can reference a parent record via `parent_record_id`.

This is used when:
- A community concern (`community-concern`) produces a resolution (`community-decision`)
- An infrastructure update (`infrastructure-update`) produces a completion record (`infrastructure-completion`)
- A community decision is superseded by a new decision

```
Community Concern (pending → open matter)
  └── Community Decision (resolved the concern)
        └── Community Outcome (documents the result)
```

**Rules:**
- `parent_record_id` is set on creation and never changed.
- The lineage chain is always forward in time — a record never references a newer record as parent.
- The chain is reconstructed by query, not by stored arrays.
- Maximum practical chain depth in Moments: 3–4 records. Deep chains indicate a governance process, not a community one.

---

## What Is Public

The public PWA surfaces Community Records as discoverable context on moment detail pages
and in the Community Timeline.

| Field | Public? | Notes |
|---|---|---|
| `type` | ✅ | Displayed as label using the type table above |
| `title` | ✅ | |
| `content` | ✅ | Full content — records are public documents |
| `status` | ✅ | Displayed as a badge |
| `created_at` | ✅ | Displayed as date |
| `approved_by` | ✅ | Displayed as "Recorded by" — operator name or role |
| `parent_record_id` | ✅ | Used to render lineage chain — not the raw UUID |
| `moment_id` | ❌ | Internal FK — not exposed |
| `authority_id` | ❌ | Internal — not used in Moments |
| `weather_context` | ✅ | Displayed if present — same as moment weather display |
| `created_by` | ❌ | Internal admin user ID — never exposed |

**RLS:** The `records` table currently has `authenticated` read only. For Moments, records linked
to broadcasted moments must be readable by `anon`. Migration 008 adds this policy.

---

## What Remains Operator-Only

- Creating records
- Transitioning record status
- Linking records to moments
- Linking records to parent records
- Uploading evidence to records (Phase 17F)

The public can read records. They cannot create, edit, or transition them.

---

## The Community Timeline

The Community Timeline is the assembled chain of activity on a community matter.

It is not a new table. It is a server-side query that assembles from existing data:

```
moment (the originating broadcast)
  ├── community_records[]     (records where moment_id = this moment)
  │     └── child_records[]   (records where parent_record_id = above)
  ├── participation_count     (from moment_stats)
  ├── evidence[]              (from evidence table)
  └── campaign                (if moment is linked to a campaign)
```

**Public PWA surface:**
- On moment detail pages for `community`, `infrastructure`, and `consultation` type moments
- A "Community Timeline" section below the moment content
- Ordered chronologically — oldest first
- Each record shows: type label, title, status badge, date, brief content excerpt

**Admin surface:**
- On moment detail pages — same timeline, with status transition controls
- A "Create Record" action button on eligible moment types

---

## Edge Function Design

Records are served by a new `records` Edge Function (or a new route group on the existing `moments` function).

Recommended: new `supabase/functions/records/index.ts` — keeps concerns separated.

Routes:
```
GET  /records?moment_id=:id          List records for a moment (public — anon)
GET  /records/:id                    Get single record (public — anon)
POST /records                        Create record (auth — content_admin+)
PUT  /records/:id/status             Transition status (auth — content_admin+)
```

No DELETE route. Records are immutable once created.
No PUT route for content — only status transitions after creation.

**Validation (in Edge Function, not DB):**
- `type` must be one of the 8 Moments types
- `moment_id` must reference a moment that exists and is `broadcasted`
- `parent_record_id` must reference a record with the same `moment_id` (same lineage)
- Status transitions must follow the defined lifecycle
- `content` minimum 10 chars, maximum 5000 chars
- `title` minimum 3 chars, maximum 200 chars

---

## API Client (`packages/api`)

A new `createRecordsClient` factory in `packages/api/src/clients/records.ts`.

Types (inlined as string literals — no domain dependency):
```ts
type CommunityRecordType =
  | 'community-meeting' | 'community-decision' | 'community-report'
  | 'community-concern' | 'community-outcome' | 'infrastructure-update'
  | 'infrastructure-completion' | 'community-policy';

type CommunityRecordStatus = 'pending' | 'adopted' | 'approved' | 'resolved' | 'rejected';

interface CommunityRecord {
  id: string;
  type: CommunityRecordType;
  title: string;
  content: string;
  status: CommunityRecordStatus;
  approvedBy: string | null;
  parentRecordId: string | null;
  momentId: string | null;
  weatherContext: WeatherSnapshot | null;
  createdAt: string;
  updatedAt: string;
}
```

Two clients:
- `createRecordsClient` — authenticated, used by `apps/admin`
- `createPublicRecordsClient` — anon key, used by `apps/web` (read-only)

---

## Database Impact

One migration needed: `008_community_records.sql`

Changes:
1. Add `moment_id UUID REFERENCES moments(id) ON DELETE SET NULL` to `records` table
2. Add index on `records(moment_id)`
3. Add RLS policy: `anon` can SELECT records where the linked moment is `broadcasted` and `publish_to_pwa = true`

No new tables. The `records` table already exists (migration 006).

Update `docs/DATABASE_SCHEMA.md` before writing the migration.

---

## Admin UI Scope (Phase 17D)

**On moment detail page** (for `community`, `infrastructure`, `consultation` types):
- "Community Records" section below the existing detail cards
- List of existing records with type, title, status badge, date
- "Add Record" button → opens a drawer or navigates to create form

**Create Record form** (`/moments/[id]/records/new`):
- `type` — select from 8 types
- `title` — text input
- `content` — textarea
- `approved_by` — text input (name or role of the person who approved)
- `parent_record_id` — optional select from existing records on this moment
- Submit → creates record with `status = 'pending'`, `moment_id` set automatically

**Record detail** (`/moments/[id]/records/[recordId]`):
- Read-only view of all fields
- Status transition buttons: "Mark as Adopted", "Mark as Approved", "Mark as Resolved", "Mark as Rejected"
- Status transition is only available when record is `pending`

**Component rules:**
- `PageHeader` on all pages
- `Card` per section
- `StatusBadge` for record status
- `EmptyState` when no records exist
- `PageSkeleton` / `TableSkeleton` for loading states
- Form follows the standard form page layout from workspace rules

---

## Public PWA Scope (Phase 17D)

**On moment detail page** (for `community`, `infrastructure`, `consultation` types):
- "Community Timeline" section — only rendered if records exist
- Each record: type label, title, status badge, date, first 200 chars of content
- "View full record" link → `/moments/[id]/records/[recordId]`

**Record detail page** (`/moments/[id]/records/[recordId]`):
- Full record content
- Status badge
- Date
- Approved by (if set)
- Weather context (if present)
- Lineage: "This record follows from: [parent record title]" (if parent exists)
- No edit controls — read-only

---

## What Phase 17D Does NOT Include

These are explicitly deferred to later phases:

- Evidence on records (Phase 17F — evidence layer)
- Participation linked to records (Phase 17E — community responses)
- Community Timeline as a standalone route (Phase 17H — community intelligence)
- Record search or filtering (Phase 17H)
- Record analytics (Phase 17H)
- Proof of publication (not applicable to Moments)
- Statutory records (not applicable to Moments)
- Weather context auto-capture on records (Phase 17F — deferred with evidence)

---

## Relationship to Existing Documents

| Document | Relationship |
|---|---|
| `docs/context/MOMENTS_EVOLUTION.md` | Defines Community Record as a concept — this document operationalises it |
| `docs/abstractions/umkhandlu/02_RECORD_ARCHITECTURE.md` | Platform record architecture — this document applies it with Moments vocabulary |
| `docs/abstractions/umkhandlu/03_NOTICE_ARCHITECTURE.md` | Notice architecture — moments are the Moments equivalent of notices |
| `docs/DATABASE_SCHEMA.md` | Schema source of truth — update before writing migration 008 |
| `docs/context/CONTENT_OWNERSHIP.md` | Records are Supabase operational data — not Sanity editorial content |
| `supabase/migrations/006_platform_records.sql` | Existing `records` and `notices` tables — migration 008 extends `records` only |
