# UNCIP Platform Engineering Lessons

**Status:** Reference — do not implement from this document without a separate architecture decision.
**Source:** Patterns discovered during UNCIP D1–D5 + frontend audit F1–F9 (2026-08-13).
**Purpose:** Extraction candidates for the broader Unami Platform engineering standard.

---

## 1. Wire format and domain format are separate contracts

**What happened:** The `uncip-children` Edge Function returned snake_case database fields
(`first_name`, `last_name`, `date_of_birth`). The `UNCIPChild` TypeScript type declared
camelCase fields (`firstName`, `lastName`, `dateOfBirth`). `apiFetch` did a raw `res.json()`
with no transformation. TypeScript was satisfied because the type annotation was applied
to the raw response — but at runtime, `child.firstName` was `undefined`.

`ChildSummaryCard` did `child.firstName[0]` — a mandatory string index on an undefined value.
This produced a Server Component exception with digest `2257899953`. Every other page worked
because no other component did mandatory string indexing on a camelCase field.

**The fix:** `fromWire()` mapper in `packages/api/src/clients/uncip-children.ts`.

**The rule:**

```
Supabase / Edge Function
        ↓
     wire data (snake_case)
        ↓
    fromWire()   ← explicit, tested, required
        ↓
 domain object (camelCase)
        ↓
     React UI
```

Outbound:

```
domain object
        ↓
     toWire()   ← already existed; fromWire() was missing
        ↓
 API / Edge Function
```

Every API client that transforms snake_case responses into camelCase domain objects
must have an explicit inbound mapper. TypeScript type annotations on raw `res.json()`
responses are not sufficient — they describe intent, not transformation.

---

## 2. Database privacy ≠ UI disclosure

**What happened:** The community role's RLS policy on `uncip_alert_timeline` correctly
restricts which *rows* the community can read (station-scoped, active alerts only).
But it does not restrict which *columns* are returned. The `case_number` column was
present in every timeline row the community could read.

`AlertTimeline` rendered `entry.caseNumber` unconditionally. Community users on
`/alerts/[id]` could see SAPS case numbers — institutional authority information
that should not be disclosed to the public.

This was caught during the F9 verification pass, not during implementation.

**The fix:** `currentRole !== 'community'` guard in `AlertTimeline.tsx` (`cedffd5`).

**The rule:** Two privacy boundaries are required:

```
DATABASE PRIVACY
    ↓
Who can retrieve the record / row?
(enforced by RLS)

APPLICATION PRIVACY
    ↓
What information from a visible record does this role actually see?
(enforced by component rendering logic)
```

RLS visibility does not imply UI disclosure. Every field that carries institutional,
identity, or sensitive information must be audited at the rendering layer, not just
at the data access layer.

---

## 3. Role completeness spans the entire stack

**What happened:** UNCIP started with five roles defined as permission sets.
The dashboard exercise revealed that roles require a complete *experience*, not
merely a permission boundary.

**The full role matrix:**

| Layer | Must be role-aware |
|---|---|
| Authentication | ✓ |
| Registration | ✓ |
| Navigation/sidebar | ✓ |
| Route access | ✓ |
| API access (Edge Function) | ✓ |
| Database RLS | ✓ |
| Record creation | ✓ |
| Record editing | ✓ |
| Record visibility | ✓ |
| Timeline actions | ✓ |
| Media access | ✓ |
| Maps | ✓ |
| Dashboard | ✓ |
| Detail pages | ✓ |
| Empty states | ✓ |
| Privacy presentation | ✓ |
| Actions/CTAs | ✓ |

A `role` column is not sufficient. Each layer requires its own role-aware implementation.

---

## 4. Metric vs work queue in role-specific dashboards

**What happened:** The pre-F9 dashboard showed the same four KPI cards to all roles:
"Registered Children", "Active Alerts", "Resolved This Month", "Stations Configured".
These are metrics — they describe what exists. They do not tell a role what requires
their attention.

**The rule:** Role-specific dashboards should lean toward work queues, not raw metrics.

| Avoid | Prefer |
|---|---|
| "4 active alerts" | "2 alerts awaiting authority action" |
| "1 child registered" | "Sipho Dlamini — active alert" |
| "3 sightings" | "Sighting reported 2h ago — Vilakazi St" |

Work queues are derived from canonical record state at render time. No new tables,
columns, or Edge Functions are required. Example:

```ts
// "Awaiting authority action" = active alerts with no authority_assigned_case entry
const needCase = active.filter(a =>
  !a.uncipAlertTimeline?.some(e => e.action === 'authority_assigned_case')
);
```

Every queue item must be traceable to an actual record/timeline condition.
Dashboards must not invent state.

---

## 5. Community is a contribution surface, not a reduced admin view

**What happened:** It was initially tempting to implement the community dashboard as
a stripped-down version of the admin dashboard. This would have been wrong.

Community members are not administrators with fewer permissions. They are a distinct
operational actor with a distinct purpose: public contribution to child safety.

**The rule:** Community gets a deliberately different surface:
- Active public incidents (no child identity)
- Recent sightings (location + time only)
- Report a sighting (primary action)
- Map (public spatial view)

This is architecturally coherent with the F5 privacy boundary. The community experience
is not "less" — it is different.

---

## 6. RLS recursion and the SECURITY DEFINER helper pattern

**What happened:** Cross-table RLS policies created infinite recursion:
```
uncip_children → uncip_guardian_links → uncip_children (loop)
uncip_alerts → uncip_children → uncip_guardian_links → uncip_children (loop)
```

PostgreSQL detected the recursion and returned errors, causing all affected queries to fail.

**The fix:** SECURITY DEFINER helper functions that bypass RLS for relationship lookups,
breaking all cycles. See migration `013_fix_rls_recursion.sql`.

```sql
CREATE OR REPLACE FUNCTION uncip_child_school_id(p_child_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT school_id FROM uncip_children WHERE id = p_child_id
$$;
```

**The rule:** When RLS policies on table A need to query table B, and table B's RLS
policies query table A, use SECURITY DEFINER helper functions to break the cycle.
Never write cross-table RLS policies that create circular dependencies.

---

## 7. Table grants are required for RLS to be evaluated

**What happened:** RLS policies were defined but queries returned empty results or
permission errors. The cause was missing table-level grants to the `authenticated` role.
PostgreSQL requires `GRANT SELECT` (and INSERT/UPDATE as appropriate) before RLS
policies are even evaluated.

**The rule:** Every table with RLS must have explicit grants:

```sql
GRANT SELECT ON table_name TO authenticated;
GRANT INSERT ON table_name TO authenticated;  -- if inserts are permitted
GRANT UPDATE ON table_name TO authenticated;  -- if updates are permitted
```

RLS policies alone are not sufficient. The grant is the gate; RLS is the filter.

---

## 8. Edge Runtime requires `npm:` import specifiers

**What happened:** Supabase Edge Functions (Deno runtime) require `npm:` prefixes
on npm package imports. Standard Node.js-style bare imports (`import { z } from 'zod'`)
fail at runtime in the Edge Runtime.

**The rule:**

```ts
// ✗ Fails in Edge Runtime
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// ✓ Correct for Edge Runtime
import { z } from 'npm:zod@3';
import { createClient } from 'npm:@supabase/supabase-js@2';
```

Pin major versions in `npm:` specifiers to prevent unexpected breaking changes.

---

## 9. Verification is a separate engineering phase

**What happened:** F9 passed TypeScript checking and rendered correctly for all five roles.
The verification pass then found that `case_number` was being rendered to the community
role on the incident detail page — a real privacy exposure that would have shipped.

The verification tested:
```
role → data scope → queue derivation → UI disclosure → cross-role consistency
```

TypeScript and "it renders" are not sufficient verification for a role-based system.

**The rule:** The production lifecycle for a role-based system should include:

```
1. Architecture decision (locked before implementation)
2. Schema
3. Security (RLS + grants)
4. API contract (wire/domain mapping)
5. Implementation
6. TypeScript check
7. Role verification (each role sees correct data)
8. Privacy verification (each role does NOT see incorrect data)
9. Cross-role consistency (same record has same state across roles)
10. Production verification (live data, live Edge Functions)
11. Documentation closure
```

Steps 7–10 cannot be replaced by TypeScript.

---

## 10. The actor_name denormalisation pattern

**What happened:** The timeline needed to display who performed each action. The initial
implementation stored only `actor_id` and `actor_role`. Resolving the actor's name
required a separate user profile lookup — which would require either a JOIN (not available
in the Edge Function's RLS-scoped client) or a second API call per timeline entry.

**The fix:** Denormalise `actor_name` at write time. When a timeline entry is created,
the Edge Function writes `actor_name: profile.name` alongside `actor_id` and `actor_role`.
This is the actor's name at the moment of the action — historically accurate even if
the user later changes their name.

**The rule:** For audit/timeline records, denormalise display names at write time.
The timeline is an immutable record of what happened. It should be self-contained.

```ts
// In the Edge Function, at timeline entry creation:
await supabase.from('uncip_alert_timeline').insert({
  actor_id:   profile.id,
  actor_role: profile.role,
  actor_name: profile.name ?? null,  // ← denormalised at write time
  action:     'alert_raised',
  // ...
});
```

Historical entries (before F3) have `actor_name: null`. The UI falls back gracefully
to displaying the role label.
