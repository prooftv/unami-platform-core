-- 001_governance_nodes.sql
-- Governance node registry for the Unami Control Centre
-- Run once in Supabase SQL editor for project ufsmpqxniswdnsywjzje

CREATE TABLE IF NOT EXISTS public.governance_nodes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  authority        text        NOT NULL,
  location         text,
  url              text        NOT NULL UNIQUE,
  api_key          text        NOT NULL,
  active           boolean     NOT NULL DEFAULT true,
  contract_version text        NOT NULL DEFAULT '1.0',
  capabilities     text[]      NOT NULL DEFAULT ARRAY[]::text[],
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS: only authenticated users can read; only service role can write
ALTER TABLE public.governance_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read nodes"
  ON public.governance_nodes FOR SELECT
  TO authenticated
  USING (true);

-- Seed: first node
INSERT INTO public.governance_nodes (name, authority, location, url, api_key, active, contract_version, capabilities)
VALUES (
  'Umkhandlu — Khathide Traditional Council',
  'Khathide Traditional Council',
  'Nquthu, KwaZulu-Natal, South Africa',
  'https://umkhandlu.unamifoundation.org',
  'ec0871d3925dd471fe1af6857fd61f4bc1c118a5a9e0e4b27cecbd3e10b61ff2',
  true,
  '1.0',
  ARRAY['health','governance','participation','evidence','commercial','tcrs','institutional-memory']
)
ON CONFLICT (url) DO NOTHING;
