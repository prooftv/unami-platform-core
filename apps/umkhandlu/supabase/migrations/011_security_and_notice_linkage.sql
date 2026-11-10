-- 011_security_and_notice_linkage.sql
-- Consolidates migration 010 (never applied to live DB) and fixes all
-- security issues identified in the RLS/schema audit.
--
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)
--
-- Issues addressed:
-- 1. governance_nodes.api_key exposed to anon role (CRITICAL)
-- 2. spatial_permission_changes has no service_role grant
-- 3. migration 010 columns never applied (notice_id on 4 tables, node_notice_ref on notices)
-- 4. notices has no node_id FK — multi-node records not isolated
-- 5. No idempotent integration anchor function
-- 6. No server-side notice registration endpoint support

-- ---------------------------------------------------------------------------
-- 1. CRITICAL: Fix governance_nodes anon exposure
--    The table has RLS enabled but anon can read all columns including api_key.
--    Root cause: Supabase grants SELECT to anon by default on public schema
--    unless explicitly revoked. The existing policy only covers authenticated.
--    Fix: revoke anon SELECT, create a safe public view without api_key.
-- ---------------------------------------------------------------------------

-- Revoke direct table access from anon
REVOKE SELECT ON public.governance_nodes FROM anon;

-- Create a safe public view that excludes api_key and internal fields
CREATE OR REPLACE VIEW public.governance_nodes_public AS
  SELECT
    id,
    name,
    authority,
    location,
    url,
    active,
    contract_version,
    capabilities,
    node_id,
    created_at
  FROM public.governance_nodes
  WHERE active = true;

-- Grant anon read on the safe view only
GRANT SELECT ON public.governance_nodes_public TO anon;
GRANT SELECT ON public.governance_nodes_public TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Fix spatial_permission_changes — missing service_role grant
-- ---------------------------------------------------------------------------

GRANT ALL ON TABLE public.spatial_permission_changes TO service_role;

CREATE POLICY IF NOT EXISTS "sr_spatial_permission_changes"
  ON public.spatial_permission_changes
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. Add node_id to notices for multi-node isolation
--    References governance_nodes.id (UUID PK), not node_id (text).
--    Nullable for now — existing notices have no node association.
-- ---------------------------------------------------------------------------

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS governance_node_id UUID
    REFERENCES public.governance_nodes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS notices_governance_node_idx
  ON public.notices(governance_node_id)
  WHERE governance_node_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Apply migration 010: node_notice_ref on notices
--    The Sanity _id of the corresponding Governance Node document.
--    Scoped to governance_node_id — same Sanity _id can exist on different nodes.
-- ---------------------------------------------------------------------------

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS node_notice_ref TEXT;

-- Unique per node: same Sanity _id cannot appear twice for the same node
CREATE UNIQUE INDEX IF NOT EXISTS notices_node_ref_unique_idx
  ON public.notices(governance_node_id, node_notice_ref)
  WHERE governance_node_id IS NOT NULL AND node_notice_ref IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Apply migration 010: notice_id FK on risk/compliance/findings/evidence
-- ---------------------------------------------------------------------------

ALTER TABLE public.risks
  ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES public.notices(id) ON DELETE SET NULL;

ALTER TABLE public.compliance_obligations
  ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES public.notices(id) ON DELETE SET NULL;

ALTER TABLE public.findings
  ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES public.notices(id) ON DELETE SET NULL;

ALTER TABLE public.evidence_records
  ADD COLUMN IF NOT EXISTS notice_id UUID REFERENCES public.notices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS risks_notice_idx
  ON public.risks(notice_id) WHERE notice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS compliance_notice_idx
  ON public.compliance_obligations(notice_id) WHERE notice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS findings_notice_idx
  ON public.findings(notice_id) WHERE notice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS evidence_notice_idx
  ON public.evidence_records(notice_id) WHERE notice_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. Integration anchor function
--    Called server-side from the Governance Node to establish or retrieve
--    the CC notice record corresponding to a Sanity developmentNotice.
--    Idempotent: safe to call multiple times.
--    Returns the CC notice UUID so the Node can store it in Sanity.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_notice_anchor(
  p_governance_node_id  UUID,
  p_node_notice_ref     TEXT,
  p_type                TEXT,
  p_title               TEXT,
  p_content             TEXT DEFAULT '',
  p_is_statutory        BOOLEAN DEFAULT true,
  p_comment_deadline    TIMESTAMPTZ DEFAULT NULL,
  p_ward_ref            TEXT DEFAULT NULL,
  p_latitude            DOUBLE PRECISION DEFAULT NULL,
  p_longitude           DOUBLE PRECISION DEFAULT NULL,
  p_created_by          TEXT DEFAULT 'node-integration'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notice_id UUID;
BEGIN
  -- Validate node exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.governance_nodes
    WHERE id = p_governance_node_id AND active = true
  ) THEN
    RAISE EXCEPTION 'governance_node_id % not found or inactive', p_governance_node_id;
  END IF;

  -- Upsert: insert if not exists, update metadata if exists
  INSERT INTO public.notices (
    governance_node_id,
    node_notice_ref,
    type,
    title,
    content,
    status,
    is_statutory,
    comment_deadline,
    ward_ref,
    latitude,
    longitude,
    created_by
  )
  VALUES (
    p_governance_node_id,
    p_node_notice_ref,
    p_type,
    p_title,
    COALESCE(NULLIF(p_content, ''), p_title),
    'open',
    p_is_statutory,
    p_comment_deadline,
    p_ward_ref,
    p_latitude,
    p_longitude,
    p_created_by
  )
  ON CONFLICT (governance_node_id, node_notice_ref)
    WHERE governance_node_id IS NOT NULL AND node_notice_ref IS NOT NULL
  DO UPDATE SET
    title             = EXCLUDED.title,
    type              = EXCLUDED.type,
    is_statutory      = EXCLUDED.is_statutory,
    comment_deadline  = COALESCE(EXCLUDED.comment_deadline, notices.comment_deadline),
    ward_ref          = COALESCE(EXCLUDED.ward_ref, notices.ward_ref),
    latitude          = COALESCE(EXCLUDED.latitude, notices.latitude),
    longitude         = COALESCE(EXCLUDED.longitude, notices.longitude),
    updated_at        = now()
  RETURNING id INTO v_notice_id;

  RETURN v_notice_id;
END;
$$;

-- Only service_role can call this function (Node calls via server-side API route)
REVOKE ALL ON FUNCTION public.upsert_notice_anchor FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_notice_anchor FROM anon;
REVOKE ALL ON FUNCTION public.upsert_notice_anchor FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_notice_anchor TO service_role;

-- ---------------------------------------------------------------------------
-- 7. Node API key validation function
--    Used by the CC integration endpoint to authenticate Node requests.
--    Returns the governance_nodes.id if the api_key is valid.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_node_api_key(p_api_key TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_node_id UUID;
BEGIN
  SELECT id INTO v_node_id
  FROM public.governance_nodes
  WHERE api_key = p_api_key AND active = true
  LIMIT 1;
  RETURN v_node_id; -- NULL if not found
END;
$$;

REVOKE ALL ON FUNCTION public.validate_node_api_key FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_node_api_key FROM anon;
REVOKE ALL ON FUNCTION public.validate_node_api_key FROM authenticated;
GRANT EXECUTE ON FUNCTION public.validate_node_api_key TO service_role;

-- ---------------------------------------------------------------------------
-- 8. RLS policy for notices — anon can read published/open notices
--    (needed for the public /api/notices/[id] endpoint via service role,
--     but anon direct REST access should be restricted to published only)
-- ---------------------------------------------------------------------------

-- notices already has RLS enabled from migration 009
-- Verify anon policy exists (009 added it) — add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notices' AND policyname = 'anon_notices'
  ) THEN
    CREATE POLICY "anon_notices" ON public.notices
      FOR SELECT TO anon
      USING (status IN ('published', 'open'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 9. Audit log entry for this migration
-- ---------------------------------------------------------------------------

INSERT INTO public.gis_audit_log (
  table_name, record_id, actor, action, previous_state, new_state
) VALUES (
  'schema_migrations',
  gen_random_uuid(),
  'system',
  'create',
  NULL,
  '{"migration": "011_security_and_notice_linkage", "changes": ["governance_nodes anon api_key exposure fixed", "spatial_permission_changes service_role grant added", "notice_id added to risks/compliance_obligations/findings/evidence_records", "node_notice_ref added to notices", "governance_node_id added to notices", "upsert_notice_anchor function created", "validate_node_api_key function created"]}'::jsonb
);

NOTIFY pgrst, 'reload schema';
