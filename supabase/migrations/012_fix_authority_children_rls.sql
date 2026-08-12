-- Fix infinite recursion in uncip_children_authority_read RLS policy.
--
-- The original policy had a self-referential subquery:
--   EXISTS (SELECT 1 FROM uncip_alerts a JOIN uncip_children c2 ...)
-- which caused "infinite recursion detected in policy for relation uncip_children"
-- when the authority role queried children.
--
-- Fix: remove the recursive EXISTS clause. The school_id IN (...) clause
-- correctly scopes authority users to children enrolled at schools in their
-- station area, which is the correct and sufficient scope for the pilot.

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
