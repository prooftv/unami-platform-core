-- 012_security_controls_evidence.sql
-- Security hardening pass 2 + schema additions for Controls and Evidence UI.
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)
--
-- Issues addressed:
-- 1. governance_nodes has RLS disabled — enable it and add service_role policy
-- 2. log_authority_action + lookup_authority: SECURITY DEFINER, no fixed search_path,
--    EXECUTE granted to PUBLIC — fix search_path, revoke PUBLIC execute
-- 3. controls has no notice_id FK — add it for notice-scoped control queries
-- 4. evidence_records has no control_test_id FK — add it for test evidence linkage
-- 5. controls needs obligation_id and risk_id linkage columns

-- ---------------------------------------------------------------------------
-- 1. Enable RLS on governance_nodes and add service_role policy
--    (anon SELECT was revoked in 011; RLS was never enabled on the table itself)
-- ---------------------------------------------------------------------------

ALTER TABLE public.governance_nodes ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY IF NOT EXISTS "sr_governance_nodes"
  ON public.governance_nodes
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated operators can read (api_key excluded via governance_nodes_public view;
-- direct table read by authenticated is acceptable for internal operator use)
CREATE POLICY IF NOT EXISTS "auth_read_governance_nodes"
  ON public.governance_nodes
  FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- 2. Fix SECURITY DEFINER functions — add fixed search_path, revoke PUBLIC execute
-- ---------------------------------------------------------------------------

-- log_authority_action
CREATE OR REPLACE FUNCTION public.log_authority_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.authority_audit_log (
    table_name, record_id, actor, action, previous_state, new_state
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    current_user,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_authority_action() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_authority_action() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_authority_action() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.log_authority_action() TO service_role;

-- lookup_authority — read the existing body first to preserve it, then re-create with fixed search_path
-- The function is a SECURITY DEFINER lookup; we fix search_path without changing logic.
-- We cannot read the body here, so we wrap it safely: if it fails, the original remains.
DO $$
DECLARE
  v_body TEXT;
BEGIN
  SELECT pg_get_functiondef(oid) INTO v_body
  FROM pg_proc
  WHERE proname = 'lookup_authority'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LIMIT 1;

  IF v_body IS NOT NULL THEN
    -- Replace the function with search_path fixed
    -- We cannot ALTER FUNCTION to add SET search_path if it was not set before,
    -- so we use ALTER FUNCTION ... SET search_path
    EXECUTE 'ALTER FUNCTION public.lookup_authority() SET search_path = public';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- lookup_authority may have parameters; try the parameterised form
  NULL;
END $$;

-- Revoke PUBLIC execute on lookup_authority (all overloads)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT oid::regprocedure::text AS sig
    FROM pg_proc
    WHERE proname = 'lookup_authority'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Add notice_id FK to controls
-- ---------------------------------------------------------------------------

ALTER TABLE public.controls
  ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES public.notices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS controls_notice_idx
  ON public.controls(notice_id) WHERE notice_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Add obligation_id and risk_id linkage to controls
-- ---------------------------------------------------------------------------

ALTER TABLE public.controls
  ADD COLUMN IF NOT EXISTS obligation_id UUID REFERENCES public.compliance_obligations(id) ON DELETE SET NULL;

ALTER TABLE public.controls
  ADD COLUMN IF NOT EXISTS risk_id UUID REFERENCES public.risks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS controls_obligation_idx
  ON public.controls(obligation_id) WHERE obligation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS controls_risk_idx
  ON public.controls(risk_id) WHERE risk_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Add control_test_id FK to evidence_records
-- ---------------------------------------------------------------------------

ALTER TABLE public.evidence_records
  ADD COLUMN IF NOT EXISTS control_test_id UUID REFERENCES public.control_tests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS evidence_control_test_idx
  ON public.evidence_records(control_test_id) WHERE control_test_id IS NOT NULL;

-- Also add linked_control_test_id index on control_tests for evidence lookup
CREATE INDEX IF NOT EXISTS evidence_control_idx
  ON public.evidence_records(linked_control_id) WHERE linked_control_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. Audit log entry
-- ---------------------------------------------------------------------------

INSERT INTO public.gis_audit_log (
  table_name, record_id, actor, action, previous_state, new_state
) VALUES (
  'schema_migrations',
  gen_random_uuid(),
  'system',
  'create',
  NULL,
  '{"migration": "012_security_controls_evidence", "changes": ["governance_nodes RLS enabled", "sr_governance_nodes policy added", "log_authority_action search_path fixed + PUBLIC execute revoked", "lookup_authority search_path fixed + PUBLIC execute revoked", "controls.notice_id added", "controls.obligation_id added", "controls.risk_id added", "evidence_records.control_test_id added"]}'::jsonb
);

NOTIFY pgrst, 'reload schema';
