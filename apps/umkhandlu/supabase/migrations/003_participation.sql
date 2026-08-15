-- 003_participation.sql
-- Umkhandlu Control Centre — participation intelligence persistence layer
-- Target project: ufsmpqxniswdnsywjzje
-- DO NOT alter governance_nodes.
-- NO PII columns. Anonymised metadata only.

-- ============================================================
-- participation_log
-- Anonymised event log of public governance participation.
-- ============================================================

CREATE TABLE public.participation_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id       text        NOT NULL,
  sanity_id     text        NOT NULL,
  sanity_type   text        NOT NULL,
  response_type text        NOT NULL,
  relationship  text        NOT NULL,
  popia_consent boolean     NOT NULL,
  submitted_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT participation_log_response_type_check
    CHECK (response_type IN ('comment', 'support', 'objection', 'question')),

  CONSTRAINT participation_log_relationship_check
    CHECK (relationship IN ('resident', 'landowner', 'business', 'community', 'organisation', 'other'))
);

-- RLS: enabled. Only service role may insert/read. No public or authenticated client access.
ALTER TABLE public.participation_log ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for anon or authenticated — service role bypasses RLS by default.
-- Explicit deny-by-omission: no policies = no access for non-service-role.

-- ============================================================
-- participation_signals
-- Derived aggregate governance participation intelligence.
-- Keyed by node_id + sanity_id.
-- ============================================================

CREATE TABLE public.participation_signals (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id         text        NOT NULL,
  sanity_id       text        NOT NULL,
  sanity_type     text        NOT NULL,
  response_count  integer     NOT NULL DEFAULT 0,
  by_type         jsonb       NOT NULL DEFAULT '{"comment":0,"support":0,"objection":0,"question":0}'::jsonb,
  by_relationship jsonb       NOT NULL DEFAULT '{"resident":0,"landowner":0,"business":0,"community":0,"organisation":0,"other":0}'::jsonb,
  last_submission timestamptz,
  computed_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT participation_signals_node_sanity_unique UNIQUE (node_id, sanity_id)
);

-- RLS: enabled. Authenticated Control Centre operators may read. Service role may read/write.
-- No write access for ordinary authenticated clients.
ALTER TABLE public.participation_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated operators can read signals"
  ON public.participation_signals FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policy for authenticated — only service role may write.

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX participation_log_node_sanity_idx
  ON public.participation_log (node_id, sanity_id);

CREATE INDEX participation_log_submitted_at_idx
  ON public.participation_log (submitted_at DESC);

CREATE INDEX participation_signals_node_sanity_idx
  ON public.participation_signals (node_id, sanity_id);

-- ============================================================
-- Grants
-- ============================================================

-- service_role needs SELECT on governance_nodes to validate node_id in Edge Functions
GRANT SELECT ON public.governance_nodes TO service_role;

-- service_role needs full write access to participation tables (Edge Function path)
GRANT SELECT, INSERT, UPDATE ON public.participation_log TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.participation_signals TO service_role;
