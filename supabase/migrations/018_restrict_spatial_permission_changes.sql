-- Limit the spatial permission audit table to the server-side service role.
-- RLS does not restrict TRUNCATE, REFERENCES, or TRIGGER privileges.

REVOKE ALL ON TABLE public.spatial_permission_changes FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.spatial_permission_changes TO service_role;

DROP POLICY IF EXISTS "service role full access" ON public.spatial_permission_changes;
CREATE POLICY "service role full access"
  ON public.spatial_permission_changes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
