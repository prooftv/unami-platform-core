-- D4: Spatial Foundation
-- Adds nullable lat/lng coordinate pairs to alerts, timeline sightings,
-- schools, and SAPS stations. Preserves all existing TEXT location fields.
-- No PostGIS dependency. Coordinates are user-supplied only.

ALTER TABLE uncip_alerts
  ADD COLUMN IF NOT EXISTS last_seen_lat  NUMERIC,
  ADD COLUMN IF NOT EXISTS last_seen_lng  NUMERIC;

ALTER TABLE uncip_alert_timeline
  ADD COLUMN IF NOT EXISTS sighting_lat  NUMERIC,
  ADD COLUMN IF NOT EXISTS sighting_lng  NUMERIC;

ALTER TABLE uncip_schools
  ADD COLUMN IF NOT EXISTS lat  NUMERIC,
  ADD COLUMN IF NOT EXISTS lng  NUMERIC;

ALTER TABLE uncip_saps_stations
  ADD COLUMN IF NOT EXISTS lat  NUMERIC,
  ADD COLUMN IF NOT EXISTS lng  NUMERIC;
