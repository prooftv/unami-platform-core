-- 004_governance_nodes_node_id.sql
-- Add canonical node_id to governance_nodes.
-- This is the text identifier used in participation_signals.node_id.
-- Distinct from governance_nodes.id (UUID).
-- Phase 20 will enforce NOT NULL once all nodes are seeded.

ALTER TABLE public.governance_nodes
  ADD COLUMN IF NOT EXISTS node_id text UNIQUE;

-- Seed the existing Umkhandlu governance node
UPDATE public.governance_nodes
SET node_id = 'umkhandlu-khathide-001'
WHERE url = 'https://umkhandlu.unamifoundation.org';
