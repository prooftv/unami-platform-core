-- Migration 008: Community Records — Phase 17D
-- Extends the platform `records` table for Moments use.
-- Adds moment_id FK so Moments records link to originating moments.
-- Adds anon RLS policy so public PWA can read records on broadcasted moments.
-- No new tables. No existing columns modified.

-- ============================================================
-- moment_id column
-- Optional. Used by Moments only.
-- origin_notice_id remains for Umkhandlu and governance nodes.
-- ============================================================

ALTER TABLE records
  ADD COLUMN IF NOT EXISTS moment_id UUID REFERENCES moments(id) ON DELETE SET NULL;

COMMENT ON COLUMN records.moment_id IS
  'Originating moment — used by Moments only. Optional. '
  'origin_notice_id is used by Umkhandlu and governance nodes.';

CREATE INDEX IF NOT EXISTS records_moment_id_idx ON records (moment_id);

-- ============================================================
-- RLS — anon read for records linked to broadcasted moments
-- ============================================================

-- The existing records_auth_read policy covers authenticated users.
-- This policy adds public read for records whose linked moment is
-- broadcasted and published to the PWA.

CREATE POLICY records_anon_read ON records
  FOR SELECT TO anon
  USING (
    moment_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM moments m
      WHERE m.id = records.moment_id
        AND m.status = 'broadcasted'
        AND m.publish_to_pwa = true
    )
  );
