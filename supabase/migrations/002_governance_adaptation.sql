-- Migration 002 — Governance Adaptation (Phase 17D)
-- Adds moment_type, participation_enabled, participation_deadline to moments.
-- Additive only. No existing columns modified. No data migrated.

ALTER TABLE moments
  ADD COLUMN IF NOT EXISTS moment_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (moment_type IN ('standard','community','opportunity','infrastructure','consultation')),
  ADD COLUMN IF NOT EXISTS participation_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS participation_deadline TIMESTAMPTZ;

-- Index for filtering by moment_type
CREATE INDEX IF NOT EXISTS idx_moments_moment_type ON moments (moment_type);

-- Comment documentation
COMMENT ON COLUMN moments.moment_type IS
  'Governance-adapted moment classification: standard | community | opportunity | infrastructure | consultation';
COMMENT ON COLUMN moments.participation_enabled IS
  'Whether community responses are open for this moment (Phase 17E engine)';
COMMENT ON COLUMN moments.participation_deadline IS
  'Response window close time — null means no deadline set';
