# UNCIP Notification Contract

**Status:** FROZEN — implementation may proceed only from this document.
**Date:** 2026-08-13
**Governs:** `uncip_notifications` table, `uncip-timeline` dispatch logic, notification UI surface.
**Prerequisite reading:** `UNCIP_INFORMATION_ARCHITECTURE.md`, `DASHBOARD_ARCHITECTURE.md`

---

## Governing Principle

**The timeline event is the event. The notification is the operational projection of that event.**

A notification does not describe what happened. It points to what happened.
The canonical institutional record is always the timeline entry.
If a notification is lost, undelivered, or unread, the institutional record is unaffected.

The workflow is not:

```
Alert → people check dashboard → maybe act
```

It is:

```
Alert → responsible actor is notified → actor performs action → immutable timeline entry → next responsible actor is notified
```

Notifications are the mechanism that moves the case from one responsible actor to the next.

---

## Conceptual Position

```
                 CHILD IDENTITY
                      │
                      ▼
                    ALERT
               (institutional case)
                      │
                      ▼
                  TIMELINE
              (immutable events)
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
    NOTIFICATION               MAP
    operational            spatial view
    projection             of incidents
```

Notifications and the map are both projections of the same institutional record.
Neither is a separate source of truth.

---

## The Canonical Notification Chain

| Timeline action | Creates entry | Notifies | Purpose |
|---|---|---|---|
| `alert_raised` | `alert_raised` | School (enrolled child) + Authority (station) | Action required |
| `school_confirmed_last_seen` | `school_confirmed_last_seen` | Parent (guardian) + Authority | State changed, case continues |
| `authority_assigned_case` | `authority_assigned_case` | Parent (guardian) | Case institutionalised |
| `community_sighting_reported` | `community_sighting_reported` | Authority (station) + Parent (guardian) | Immediate operational response required |
| `status_changed` (resolved) | `status_changed` | Parent (guardian) + School (enrolled child) | Case closed |

---

## Recipient Resolution

Recipient resolution is institutional logic. It is not notification plumbing.
It lives in the Edge Function layer — not in the frontend, not in a separate service.

```
alert_raised
  ├── child.school_id → school user(s) at that school
  └── alert station jurisdiction → authority user(s) at that station

school_confirmed_last_seen
  ├── alert.guardian_links → parent(s)
  └── alert station jurisdiction → authority

authority_assigned_case
  └── alert.guardian_links → parent(s)

community_sighting_reported
  ├── alert.guardian_links → parent(s)
  └── alert station jurisdiction → authority

status_changed (resolved / cancelled / false_alarm)
  ├── alert.guardian_links → parent(s)
  └── child.school_id → school user(s)
```

Resolution method per recipient type:

| Recipient | Resolution query |
|---|---|
| Parent / guardian | `uncip_guardian_links WHERE child_id = alert.child_id` → `user_id` |
| School | `uncip_user_profiles WHERE school_id = child.school_id AND role = 'school'` |
| Authority | `uncip_user_profiles WHERE station_id = alert_station AND role = 'authority'` |

Alert station jurisdiction: derived from the child's school → school's `station_id`.
If `school_id` is null on the child record, authority notification is skipped (no jurisdiction to resolve).

---

## Community Privacy Boundary

Community is an **input actor**. It submits sightings. It is never a notification recipient.

```
Community submits sighting
  │
  ├── timeline record (community_sighting_reported)
  │
  └── notifications dispatched to:
        ├── authority (station)
        └── parent (guardian)

Community receives: nothing
```

Community must never receive:
- `authority_assigned_case` notifications (contains case number)
- `status_changed` notifications (contains resolution detail)
- Any notification containing child identity, guardian contact, or case number

This is enforced at recipient resolution — community is never added to the recipient list.
It is not a UI concern. It is not a display filter. It is a dispatch exclusion.

---

## Schema

```sql
CREATE TABLE uncip_notifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_entry_id uuid NOT NULL REFERENCES uncip_alert_timeline(id),
  recipient_id      uuid NOT NULL REFERENCES auth.users(id),
  recipient_role    text NOT NULL,
  read_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE uncip_notifications ENABLE ROW LEVEL SECURITY;

-- Recipients read their own notifications only
CREATE POLICY "recipient reads own notifications"
  ON uncip_notifications FOR SELECT
  USING (recipient_id = auth.uid());

-- Service role inserts (Edge Function only — no direct client insert)
-- No UPDATE policy for recipients — read_at is set via a dedicated RPC
```

A notification carries no content of its own.
The UI fetches the referenced timeline entry to render the notification text.
This ensures the notification surface always reflects the canonical record.

---

## Dispatch Trigger

Notifications are dispatched inside `uncip-timeline` Edge Function, after the timeline entry
INSERT is committed and before the response is returned.

```
uncip-timeline POST handler
  1. Validate input + permissions (existing)
  2. INSERT into uncip_alert_timeline (existing)
  3. Resolve recipients for this action type (new)
  4. INSERT into uncip_notifications for each recipient (new)
  5. Return timeline entry (existing)
```

Steps 3–4 must not fail the request if notification dispatch fails.
Wrap in try/catch — log the error, return the timeline entry regardless.
The timeline entry is the authoritative record. Notification failure is non-fatal.

---

## Content Model

Notifications carry no content. The UI derives display text from the timeline entry.

```
Notification row
  └── timeline_entry_id
        └── fetch uncip_alert_timeline entry
              ├── action          → determines notification title
              ├── actor_name      → "Thabo Mokoena confirmed last seen"
              ├── actor_role      → context
              ├── alert_id        → link to alert
              └── case_number     → shown only to non-community recipients
```

Notification display text is derived client-side from the timeline entry.
It is never stored in the notification row.

---

## Read State

`read_at` is set via a dedicated Supabase RPC or a PATCH to a thin Edge Function endpoint.
It is not set by the client writing directly to the table.

```sql
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE uncip_notifications
  SET read_at = now()
  WHERE id = notification_id
    AND recipient_id = auth.uid()
    AND read_at IS NULL;
END;
$$;
```

---

## UI Surface

Notifications surface in two places:

1. **Notification bell** (shell header) — unread count badge, dropdown of recent unread items
2. **Dashboard work queue** — "awaiting your action" items are derived from unread notifications
   for action types that require a response from the current role

The notification bell is a shell-level concern. It is not page-specific.
It subscribes to `uncip_notifications` via Supabase Realtime for the current user.

The dashboard work queue is already built from timeline state. Notifications reinforce it —
they do not replace it. An actor who missed a notification can still see the pending action
on their dashboard work queue.

---

## Priority

Notifications are **P2 — post-pilot**.

The pilot demonstration does not require real-time notifications.
The dashboard work queue (already built, F9) provides the operational surface for the pilot.

Notifications are the next major capability after the pilot is demonstrated.

---

## What Must Not Happen

- Notification logic must not live in page components or UI event handlers
- Notifications must not carry content — they reference the timeline entry
- Community must never appear in a recipient list
- Notification dispatch failure must never block timeline entry creation
- A separate notification service or queue must not be introduced — dispatch is a post-write
  side effect inside the existing `uncip-timeline` Edge Function
- The `uncip_notifications` table must not be queried directly by the frontend —
  only via RLS-enforced Supabase client or the mark-read RPC

---

## Implementation Sequence (when authorised)

```
N1  Migration: CREATE TABLE uncip_notifications + RLS + mark_notification_read RPC
N2  uncip-timeline: add recipient resolution + notification INSERT (post-commit, non-fatal)
N3  packages/api: add uncip-notifications client (list unread, mark read)
N4  Shell: NotificationBell component (unread count + dropdown, Realtime subscription)
N5  Dashboard: wire work queue to unread notifications (reinforce existing work queue)
```

Each step is independently deployable. N1 and N2 are backend-only.
N3–N5 are frontend-only and depend on N1–N2 being live.

---

## What This Document Is Not

This document does not authorise implementation.
Implementation requires an explicit instruction referencing this document.
This document does not replace the UNCIP constitution or schema decisions.
It does not define the full Edge Function implementation — that follows N1 authorisation.
