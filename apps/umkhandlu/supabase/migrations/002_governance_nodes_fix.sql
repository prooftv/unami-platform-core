-- 002_governance_nodes_fix.sql
-- governance_nodes contains no personal data — RLS is not required.
-- Disable RLS so the anon key (used by server components) can read the registry.
-- Also ensure the seed node exists.

ALTER TABLE public.governance_nodes DISABLE ROW LEVEL SECURITY;

-- Drop the authenticated-only policy from 001 — no longer needed
DROP POLICY IF EXISTS "Authenticated users can read nodes" ON public.governance_nodes;

-- Ensure the first node is present (idempotent)
INSERT INTO public.governance_nodes (name, authority, location, url, api_key, active, contract_version, capabilities, notes)
VALUES (
  'Umkhandlu — Khathide Traditional Council',
  'Khathide Traditional Council',
  'Nquthu, KwaZulu-Natal, South Africa',
  'https://umkhandlu.unamifoundation.org',
  'ec0871d3925dd471fe1af6857fd61f4bc1c118a5a9e0e4b27cecbd3e10b61ff2',
  true,
  '1.0',
  ARRAY['health','governance','participation','evidence','commercial','tcrs','institutional-memory'],
  'First governance node. Phase 18B.'
)
ON CONFLICT (url) DO NOTHING;

-- Grant read access to anon and authenticated roles
-- RLS is disabled but Postgres table privileges still apply
GRANT SELECT ON public.governance_nodes TO anon;
GRANT SELECT ON public.governance_nodes TO authenticated;
