-- D5: Incident + Timeline Evidence Media
-- Two tables: alert-level and timeline-level media.
-- alert_id is denormalised on uncip_timeline_media to avoid cross-table RLS joins.
-- Both tables are insert-only for non-admin roles (no UPDATE/DELETE).

-- ─── SECURITY DEFINER helper ─────────────────────────────────────────────────
-- Returns child_id for an alert. Used in RLS to check guardian links
-- without triggering cross-table recursion.

CREATE OR REPLACE FUNCTION uncip_alert_child_id(p_alert_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT child_id FROM uncip_alerts WHERE id = p_alert_id LIMIT 1;
$$;

CREATE TABLE IF NOT EXISTS uncip_alert_media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id        UUID NOT NULL REFERENCES uncip_alerts(id) ON DELETE CASCADE,
  uploaded_by     UUID NOT NULL REFERENCES uncip_user_profiles(id),
  uploader_role   TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  file_size       INTEGER NOT NULL,
  label           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uncip_timeline_media (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_entry_id UUID NOT NULL REFERENCES uncip_alert_timeline(id) ON DELETE CASCADE,
  alert_id          UUID NOT NULL REFERENCES uncip_alerts(id) ON DELETE CASCADE,
  uploaded_by       UUID NOT NULL REFERENCES uncip_user_profiles(id),
  uploader_role     TEXT NOT NULL,
  storage_path      TEXT NOT NULL,
  mime_type         TEXT NOT NULL,
  file_size         INTEGER NOT NULL,
  label             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS uncip_alert_media_alert_id_idx    ON uncip_alert_media(alert_id);
CREATE INDEX IF NOT EXISTS uncip_timeline_media_alert_id_idx ON uncip_timeline_media(alert_id);
CREATE INDEX IF NOT EXISTS uncip_timeline_media_entry_id_idx ON uncip_timeline_media(timeline_entry_id);

-- Grants
GRANT SELECT, INSERT ON uncip_alert_media    TO authenticated;
GRANT SELECT, INSERT ON uncip_timeline_media TO authenticated;
GRANT ALL             ON uncip_alert_media    TO service_role;
GRANT ALL             ON uncip_timeline_media TO service_role;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE uncip_alert_media    ENABLE ROW LEVEL SECURITY;
ALTER TABLE uncip_timeline_media ENABLE ROW LEVEL SECURITY;

-- Helper: get role for current user (avoids repeated profile lookups)
-- Reuses the pattern established in migration 013.

-- uncip_alert_media: SELECT
-- Mirrors uncip_alerts visibility: admin sees all; others see via existing helpers.
CREATE POLICY "uncip_alert_media_select" ON uncip_alert_media
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uncip_user_profiles p
      WHERE p.id = auth.uid() AND p.is_active
      AND (
        p.role = 'admin'
        OR (p.role = 'parent'    AND EXISTS (SELECT 1 FROM uncip_guardian_links gl WHERE gl.child_id = uncip_alert_child_id(alert_id) AND gl.user_id = auth.uid()))
        OR (p.role = 'school'    AND uncip_alert_school_id(alert_id) = p.school_id)
        OR (p.role = 'authority' AND uncip_alert_station_id(alert_id) = p.station_id)
        OR (p.role = 'community' AND uncip_alert_station_id(alert_id) = p.station_id)
      )
    )
  );

-- uncip_alert_media: INSERT
-- admin, parent (own alert), authority only
CREATE POLICY "uncip_alert_media_insert" ON uncip_alert_media
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM uncip_user_profiles p
      WHERE p.id = auth.uid() AND p.is_active
      AND p.role IN ('admin', 'parent', 'authority')
    )
  );

-- uncip_timeline_media: SELECT
-- Same visibility as parent alert; community restricted to sighting entries only.
CREATE POLICY "uncip_timeline_media_select" ON uncip_timeline_media
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uncip_user_profiles p
      WHERE p.id = auth.uid() AND p.is_active
      AND (
        p.role = 'admin'
        OR (p.role = 'parent'    AND EXISTS (SELECT 1 FROM uncip_guardian_links gl WHERE gl.child_id = uncip_alert_child_id(alert_id) AND gl.user_id = auth.uid()))
        OR (p.role = 'school'    AND uncip_alert_school_id(alert_id) = p.school_id)
        OR (p.role = 'authority' AND uncip_alert_station_id(alert_id) = p.station_id)
        OR (p.role = 'community' AND uncip_alert_station_id(alert_id) = p.station_id
            AND uploader_role = 'community')
      )
    )
  );

-- uncip_timeline_media: INSERT
-- Role must match the action they're permitted to perform (enforced in Edge Function).
CREATE POLICY "uncip_timeline_media_insert" ON uncip_timeline_media
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM uncip_user_profiles p
      WHERE p.id = auth.uid() AND p.is_active
      AND p.role IN ('admin', 'school', 'authority', 'community', 'parent')
    )
  );
