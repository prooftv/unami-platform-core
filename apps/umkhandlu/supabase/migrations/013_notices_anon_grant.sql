-- 013_notices_anon_grant.sql
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)
--
-- Issues addressed:
-- 1. notices table has RLS enabled and anon policy (from 009) but no GRANT SELECT TO anon.
--    PostgREST returns 42501 for anon REST access even when the RLS policy permits it,
--    because the table-level grant is absent. Fix: grant SELECT to anon.
--    The RLS policy (anon_notices) already restricts rows to status IN ('published','open').
-- 2. Dataset attributions were NULL for two published datasets — corrected via PATCH above.
--    This migration records the audit entry only; the data fix was applied directly.

-- Fix: grant anon SELECT on notices (RLS policy already restricts to published/open rows)
GRANT SELECT ON public.notices TO anon;

-- Audit log
INSERT INTO public.gis_audit_log (table_name, record_id, actor, action, previous_state, new_state)
VALUES (
  'schema_migrations',
  gen_random_uuid(),
  'system',
  'create',
  NULL,
  '{"migration": "013_notices_anon_grant", "changes": ["GRANT SELECT ON notices TO anon (RLS policy anon_notices already restricts to published/open)", "dataset attributions patched for Amajuba District Municipality Boundary and Amajuba Local Municipalities"]}'::jsonb
);

NOTIFY pgrst, 'reload schema';
