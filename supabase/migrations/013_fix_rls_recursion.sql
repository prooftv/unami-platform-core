-- Fix RLS infinite recursion across UNCIP tables.
--
-- Root cause: cross-table RLS policies created cycles:
--   uncip_children → uncip_guardian_links → uncip_children (infinite loop)
--   uncip_alerts → uncip_children → uncip_guardian_links → uncip_children (loop)
--   uncip_alert_timeline → uncip_alerts → uncip_children → ... (loop)
--
-- Fix: introduce SECURITY DEFINER helper functions that bypass RLS for
-- relationship lookups, breaking all cycles.
--
-- Also grants table-level SELECT/INSERT/UPDATE privileges to the authenticated
-- role (required for RLS policies to be evaluated at all).

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER — bypass RLS for relationship lookups)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION uncip_child_school_id(p_child_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT school_id FROM uncip_children WHERE id = p_child_id
$$;

CREATE OR REPLACE FUNCTION uncip_child_station_id(p_child_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT s.station_id
  FROM uncip_children c
  JOIN uncip_schools s ON s.id = c.school_id
  WHERE c.id = p_child_id
$$;

CREATE OR REPLACE FUNCTION uncip_alert_school_id(p_alert_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT uncip_child_school_id(child_id) FROM uncip_alerts WHERE id = p_alert_id
$$;

CREATE OR REPLACE FUNCTION uncip_alert_station_id(p_alert_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT uncip_child_station_id(child_id) FROM uncip_alerts WHERE id = p_alert_id
$$;

-- ---------------------------------------------------------------------------
-- Table-level grants (required for RLS to be evaluated)
-- ---------------------------------------------------------------------------

GRANT SELECT ON uncip_children TO authenticated;
GRANT SELECT ON uncip_child_medical TO authenticated;
GRANT SELECT ON uncip_guardian_links TO authenticated;
GRANT SELECT ON uncip_alerts TO authenticated;
GRANT SELECT ON uncip_alert_timeline TO authenticated;
GRANT SELECT ON uncip_schools TO authenticated;
GRANT SELECT ON uncip_saps_stations TO authenticated;
GRANT INSERT ON uncip_children TO authenticated;
GRANT INSERT ON uncip_guardian_links TO authenticated;
GRANT INSERT ON uncip_alerts TO authenticated;
GRANT INSERT ON uncip_alert_timeline TO authenticated;
GRANT UPDATE ON uncip_children TO authenticated;
GRANT UPDATE ON uncip_alerts TO authenticated;

-- ---------------------------------------------------------------------------
-- Fix uncip_children — authority policy (recursive EXISTS removed)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "uncip_children_authority_read" ON uncip_children;
CREATE POLICY "uncip_children_authority_read" ON uncip_children
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'authority'
    AND school_id IN (
      SELECT id FROM uncip_schools
      WHERE station_id = (uncip_current_profile()).station_id
    )
  );

-- ---------------------------------------------------------------------------
-- Fix uncip_guardian_links — use security definer functions
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "uncip_guardian_links_school_read" ON uncip_guardian_links;
CREATE POLICY "uncip_guardian_links_school_read" ON uncip_guardian_links
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'school'
    AND uncip_child_school_id(child_id) = (uncip_current_profile()).school_id
  );

DROP POLICY IF EXISTS "uncip_guardian_links_authority_read" ON uncip_guardian_links;
CREATE POLICY "uncip_guardian_links_authority_read" ON uncip_guardian_links
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'authority'
    AND uncip_child_station_id(child_id) = (uncip_current_profile()).station_id
  );

-- ---------------------------------------------------------------------------
-- Fix uncip_child_medical — use security definer functions
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "uncip_child_medical_school_read" ON uncip_child_medical;
CREATE POLICY "uncip_child_medical_school_read" ON uncip_child_medical
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'school'
    AND uncip_child_school_id(child_id) = (uncip_current_profile()).school_id
  );

-- ---------------------------------------------------------------------------
-- Fix uncip_alerts — use security definer functions
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "uncip_alerts_school_read" ON uncip_alerts;
CREATE POLICY "uncip_alerts_school_read" ON uncip_alerts
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'school'
    AND uncip_child_school_id(child_id) = (uncip_current_profile()).school_id
  );

DROP POLICY IF EXISTS "uncip_alerts_school_insert" ON uncip_alerts;
CREATE POLICY "uncip_alerts_school_insert" ON uncip_alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    (uncip_current_profile()).role = 'school'
    AND created_by = auth.uid()
    AND uncip_child_school_id(child_id) = (uncip_current_profile()).school_id
  );

DROP POLICY IF EXISTS "uncip_alerts_authority_read" ON uncip_alerts;
CREATE POLICY "uncip_alerts_authority_read" ON uncip_alerts
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'authority'
    AND uncip_child_station_id(child_id) = (uncip_current_profile()).station_id
  );

DROP POLICY IF EXISTS "uncip_alerts_authority_update" ON uncip_alerts;
CREATE POLICY "uncip_alerts_authority_update" ON uncip_alerts
  FOR UPDATE TO authenticated
  USING (
    (uncip_current_profile()).role = 'authority'
    AND uncip_child_station_id(child_id) = (uncip_current_profile()).station_id
  );

DROP POLICY IF EXISTS "uncip_alerts_community_read" ON uncip_alerts;
CREATE POLICY "uncip_alerts_community_read" ON uncip_alerts
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'community'
    AND status = 'active'
    AND uncip_child_station_id(child_id) = (uncip_current_profile()).station_id
  );

-- ---------------------------------------------------------------------------
-- Fix uncip_alert_timeline — use security definer functions
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "uncip_timeline_parent_read" ON uncip_alert_timeline;
CREATE POLICY "uncip_timeline_parent_read" ON uncip_alert_timeline
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'parent'
    AND EXISTS (
      SELECT 1 FROM uncip_alerts a
      JOIN uncip_guardian_links gl ON gl.child_id = a.child_id
      WHERE a.id = uncip_alert_timeline.alert_id
        AND gl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "uncip_timeline_parent_insert" ON uncip_alert_timeline;
CREATE POLICY "uncip_timeline_parent_insert" ON uncip_alert_timeline
  FOR INSERT TO authenticated
  WITH CHECK (
    (uncip_current_profile()).role = 'parent'
    AND actor_id = auth.uid()
    AND action IN ('alert_raised','status_changed','note_added')
    AND EXISTS (
      SELECT 1 FROM uncip_alerts a
      JOIN uncip_guardian_links gl ON gl.child_id = a.child_id
      WHERE a.id = uncip_alert_timeline.alert_id
        AND gl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "uncip_timeline_school_read" ON uncip_alert_timeline;
CREATE POLICY "uncip_timeline_school_read" ON uncip_alert_timeline
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'school'
    AND uncip_alert_school_id(alert_id) = (uncip_current_profile()).school_id
  );

DROP POLICY IF EXISTS "uncip_timeline_school_insert" ON uncip_alert_timeline;
CREATE POLICY "uncip_timeline_school_insert" ON uncip_alert_timeline
  FOR INSERT TO authenticated
  WITH CHECK (
    (uncip_current_profile()).role = 'school'
    AND actor_id = auth.uid()
    AND action IN ('alert_raised','school_confirmed_last_seen','note_added')
    AND uncip_alert_school_id(alert_id) = (uncip_current_profile()).school_id
  );

DROP POLICY IF EXISTS "uncip_timeline_authority_read" ON uncip_alert_timeline;
CREATE POLICY "uncip_timeline_authority_read" ON uncip_alert_timeline
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'authority'
    AND uncip_alert_station_id(alert_id) = (uncip_current_profile()).station_id
  );

DROP POLICY IF EXISTS "uncip_timeline_authority_insert" ON uncip_alert_timeline;
CREATE POLICY "uncip_timeline_authority_insert" ON uncip_alert_timeline
  FOR INSERT TO authenticated
  WITH CHECK (
    (uncip_current_profile()).role = 'authority'
    AND actor_id = auth.uid()
    AND action IN ('authority_assigned_case','status_changed','note_added')
    AND uncip_alert_station_id(alert_id) = (uncip_current_profile()).station_id
  );

DROP POLICY IF EXISTS "uncip_timeline_community_read" ON uncip_alert_timeline;
CREATE POLICY "uncip_timeline_community_read" ON uncip_alert_timeline
  FOR SELECT TO authenticated
  USING (
    (uncip_current_profile()).role = 'community'
    AND uncip_alert_station_id(alert_id) = (uncip_current_profile()).station_id
  );

DROP POLICY IF EXISTS "uncip_timeline_community_insert" ON uncip_alert_timeline;
CREATE POLICY "uncip_timeline_community_insert" ON uncip_alert_timeline
  FOR INSERT TO authenticated
  WITH CHECK (
    (uncip_current_profile()).role = 'community'
    AND actor_id = auth.uid()
    AND action IN ('community_sighting_reported','note_added')
    AND uncip_alert_station_id(alert_id) = (uncip_current_profile()).station_id
  );
