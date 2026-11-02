-- 003_node_snapshots.sql
-- Snapshot persistence for governance node intelligence polling
-- Run in Supabase SQL editor for project ufsmpqxniswdnsywjzje

CREATE TABLE IF NOT EXISTS public.node_snapshots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id       uuid        NOT NULL REFERENCES public.governance_nodes(id) ON DELETE CASCADE,
  captured_at   timestamptz NOT NULL DEFAULT now(),
  health        jsonb,
  records       jsonb,
  notices       jsonb,
  commercial    jsonb,
  participation jsonb,
  evidence      jsonb,
  tcrs          jsonb,
  lineage       jsonb
);

-- Index for efficient per-node time-series queries
CREATE INDEX IF NOT EXISTS node_snapshots_node_id_captured_at_idx
  ON public.node_snapshots (node_id, captured_at DESC);

-- RLS: authenticated users can read; only service role can write
ALTER TABLE public.node_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read snapshots"
  ON public.node_snapshots FOR SELECT
  TO authenticated
  USING (true);

-- Retention: snapshots older than 90 days are deleted automatically.
-- Run this as a scheduled job (Supabase cron or pg_cron):
--   DELETE FROM public.node_snapshots WHERE captured_at < now() - interval '90 days';
