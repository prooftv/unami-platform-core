-- Staged spatial features are operator-review data, not general authenticated data.
-- Server-side operator actions use the service role and remain available.
DROP POLICY IF EXISTS "authenticated_read_spatial_staged_features"
  ON public.spatial_staged_features;

REVOKE SELECT ON TABLE public.spatial_staged_features FROM anon, authenticated;
GRANT ALL ON TABLE public.spatial_staged_features TO service_role;
