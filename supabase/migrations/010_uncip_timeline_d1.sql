-- D1: Add first-class operational fields to uncip_alert_timeline
--
-- case_number       — populated for authority_assigned_case entries
-- sighting_location — populated for community_sighting_reported entries
--
-- Both are nullable TEXT. Existing RLS policies are unaffected (table-level,
-- not column-level). The timeline remains append-only and immutable.

ALTER TABLE uncip_alert_timeline
  ADD COLUMN IF NOT EXISTS case_number       TEXT,
  ADD COLUMN IF NOT EXISTS sighting_location TEXT;

-- Index case_number for authority case lookups
CREATE INDEX IF NOT EXISTS idx_uncip_timeline_case_number
  ON uncip_alert_timeline(case_number)
  WHERE case_number IS NOT NULL;
