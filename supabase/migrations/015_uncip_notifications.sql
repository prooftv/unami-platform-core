-- UNCIP Notification Contract — N1
-- Notifications are operational projections of timeline events.
-- A notification carries no content — it references a timeline entry.
-- Recipients read their own notifications only (RLS).
-- Service role inserts only (Edge Function dispatch).

CREATE TABLE IF NOT EXISTS uncip_notifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_entry_id uuid NOT NULL REFERENCES uncip_alert_timeline(id),
  recipient_id      uuid NOT NULL REFERENCES auth.users(id),
  recipient_role    text NOT NULL,
  read_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uncip_notifications ENABLE ROW LEVEL SECURITY;

-- Recipients read their own notifications only
CREATE POLICY "uncip_notifications_recipient_select"
  ON uncip_notifications FOR SELECT
  USING (recipient_id = auth.uid());

-- Mark read via RPC only — no direct UPDATE from client
CREATE OR REPLACE FUNCTION uncip_mark_notification_read(notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE uncip_notifications
  SET read_at = now()
  WHERE id = notification_id
    AND recipient_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

-- Index for unread count query (recipient + read_at IS NULL)
CREATE INDEX IF NOT EXISTS uncip_notifications_recipient_unread
  ON uncip_notifications (recipient_id, created_at DESC)
  WHERE read_at IS NULL;

-- Grants
GRANT SELECT ON uncip_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION uncip_mark_notification_read(uuid) TO authenticated;
