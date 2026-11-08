-- 008: risk_registers unique constraint + Amajuba seed
-- Adds a unique constraint on (title) so ON CONFLICT DO NOTHING works correctly.
-- Seeds the initial Amajuba District GIS & Spatial Intelligence register.

ALTER TABLE risk_registers
  ADD CONSTRAINT risk_registers_title_unique UNIQUE (title);

INSERT INTO risk_registers (title, description, owner, status)
VALUES (
  'Amajuba District — GIS & Spatial Intelligence',
  'Risks related to spatial data quality, source availability, integration reliability and geographic intelligence for Amajuba District.',
  'Unami Foundation',
  'active'
)
ON CONFLICT (title) DO NOTHING;
