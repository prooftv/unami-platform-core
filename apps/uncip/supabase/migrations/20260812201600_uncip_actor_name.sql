-- Frontend Audit F3: actor_name on uncip_alert_timeline
-- Denormalises the actor's display name at write time, consistent with actor_role.
-- Historical provenance: records who performed the action at the time it occurred.

ALTER TABLE uncip_alert_timeline
  ADD COLUMN IF NOT EXISTS actor_name TEXT;
