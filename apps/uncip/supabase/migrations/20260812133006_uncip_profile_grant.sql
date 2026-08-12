-- Fix SQLSTATE 42501: grant the minimum table-level privilege required for
-- the existing RLS policy "uncip_profiles_own" (SELECT WHERE id = auth.uid())
-- to be evaluated by the authenticated role.
-- RLS remains enabled; this does not widen access beyond what the policy allows.
GRANT SELECT ON uncip_user_profiles TO authenticated;
