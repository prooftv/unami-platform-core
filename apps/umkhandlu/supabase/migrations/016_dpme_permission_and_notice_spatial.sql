-- 016_dpme_permission_and_notice_spatial.sql
-- Applied to: ufsmpqxniswdnsywjzje (Umkhandlu Control Centre)
--
-- 1. Correct DPME Amajuba District Boundary permission from 'reference' to 'redistribute'.
--    This dataset is part of the Amajuba baseline. DPME publishes boundary data under
--    open government data terms permitting redistribution with attribution.
--    The 'reference' classification was incorrect and blocked the dataset from all
--    public API responses. This correction restores it to the baseline.
--
-- 2. Add site_feature_id to notices — links a CC notice to an approved spatial feature
--    (spatial_staged_features.id) representing the verified site or property boundary.
--    This replaces the manual UUID-copy workflow with a backend-managed association.
--
-- 3. Add spatial_layer_config table — operator-managed layer display configuration.
--    Stores display name, category, visibility, ordering, styling and attribution
--    for each published dataset. Replaces hardcoded frontend layer catalogues.

-- ── 1. DPME permission correction ────────────────────────────────────────────

UPDATE public.spatial_datasets
SET
  permission_classification = 'redistribute',
  permission_status         = 'confirmed',
  permission_notes          = 'DPME publishes South African administrative boundary data under open government data terms. Redistribution with attribution is permitted. Corrected from ''reference'' — the previous classification was incorrect and blocked this baseline dataset from public API responses.',
  updated_at                = NOW()
WHERE
  id = '7dba30ca-0000-0000-0000-000000000000'::uuid
  OR (
    name ILIKE '%Amajuba%District%Boundary%'
    AND permission_classification = 'reference'
  );

-- Also correct the source-level permission if the DPME source is 'reference'
UPDATE public.spatial_sources
SET
  permission_classification = 'redistribute',
  permission_status         = 'confirmed',
  permission_notes          = 'DPME publishes South African administrative boundary data under open government data terms. Redistribution with attribution is permitted.',
  updated_at                = NOW()
WHERE
  institution ILIKE '%DPME%'
  OR institution ILIKE '%Department of Planning%'
  OR name ILIKE '%DPME%'
  AND permission_classification = 'reference';

-- Record the permission change in the audit log
INSERT INTO public.spatial_permission_changes (
  table_name,
  record_id,
  actor,
  previous_classification,
  new_classification,
  previous_restriction_authority,
  new_restriction_authority,
  reason
)
SELECT
  'spatial_datasets',
  id,
  'migration:016',
  'reference',
  'redistribute',
  NULL,
  NULL,
  'Baseline dataset correction: DPME Amajuba District Boundary redistributable under open government data terms. Previous ''reference'' classification was incorrect.'
FROM public.spatial_datasets
WHERE
  name ILIKE '%Amajuba%District%Boundary%'
  AND permission_classification = 'redistribute'
  AND updated_at > NOW() - INTERVAL '1 minute';

-- ── 2. Notice site_feature_id ─────────────────────────────────────────────────

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS site_feature_id UUID
    REFERENCES public.spatial_staged_features(id) ON DELETE SET NULL;

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS site_feature_associated_at TIMESTAMPTZ;

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS site_feature_associated_by TEXT;

CREATE INDEX IF NOT EXISTS notices_site_feature_idx
  ON public.notices(site_feature_id)
  WHERE site_feature_id IS NOT NULL;

-- SECURITY DEFINER function: associate a spatial feature with a notice.
-- Validates that the feature is approved and belongs to a published dataset.
-- Records the association in the audit log.
-- Only callable by service_role (operator actions).
CREATE OR REPLACE FUNCTION public.associate_notice_site_feature(
  p_notice_id     UUID,
  p_feature_id    UUID,
  p_operator_id   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feature   RECORD;
  v_dataset   RECORD;
  v_prev_id   UUID;
BEGIN
  -- Validate notice exists
  IF NOT EXISTS (SELECT 1 FROM public.notices WHERE id = p_notice_id) THEN
    RAISE EXCEPTION 'Notice % not found', p_notice_id;
  END IF;

  -- Validate feature exists and is approved
  SELECT ssf.id, ssf.dataset_id, ssf.operator_status, ssf.feature_properties
  INTO v_feature
  FROM public.spatial_staged_features ssf
  WHERE ssf.id = p_feature_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Spatial feature % not found', p_feature_id;
  END IF;

  IF v_feature.operator_status != 'approved' THEN
    RAISE EXCEPTION 'Spatial feature % is not approved (status: %)', p_feature_id, v_feature.operator_status;
  END IF;

  -- Validate dataset is published
  SELECT sd.id, sd.name, sd.status, sd.permission_classification
  INTO v_dataset
  FROM public.spatial_datasets sd
  WHERE sd.id = v_feature.dataset_id;

  IF NOT FOUND OR v_dataset.status != 'published' THEN
    RAISE EXCEPTION 'Dataset for feature % is not published', p_feature_id;
  END IF;

  -- Record previous association for audit
  SELECT site_feature_id INTO v_prev_id
  FROM public.notices WHERE id = p_notice_id;

  -- Update the notice
  UPDATE public.notices
  SET
    site_feature_id              = p_feature_id,
    site_feature_associated_at   = NOW(),
    site_feature_associated_by   = p_operator_id,
    updated_at                   = NOW()
  WHERE id = p_notice_id;

  -- Audit log
  INSERT INTO public.gis_audit_log (
    table_name, record_id, actor, action, previous_state, new_state, reason
  ) VALUES (
    'notices',
    p_notice_id,
    p_operator_id,
    'update',
    jsonb_build_object('site_feature_id', v_prev_id),
    jsonb_build_object(
      'site_feature_id', p_feature_id,
      'dataset_id', v_feature.dataset_id,
      'dataset_name', v_dataset.name
    ),
    'Operator associated spatial feature with notice'
  );

  RETURN jsonb_build_object(
    'notice_id',    p_notice_id,
    'feature_id',   p_feature_id,
    'dataset_id',   v_feature.dataset_id,
    'dataset_name', v_dataset.name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.associate_notice_site_feature FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.associate_notice_site_feature TO service_role;

-- ── 3. Spatial layer configuration table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.spatial_layer_config (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id      UUID NOT NULL REFERENCES public.spatial_datasets(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
                    'administrative', 'infrastructure', 'education', 'health',
                    'cultural', 'environment', 'land-use', 'transport', 'general'
                  )),
  visible_default BOOLEAN NOT NULL DEFAULT true,
  display_order   INTEGER NOT NULL DEFAULT 100,
  -- Styling
  colour          TEXT NOT NULL DEFAULT '#3b82f6',
  fill_opacity    NUMERIC(3,2) NOT NULL DEFAULT 0.2 CHECK (fill_opacity BETWEEN 0 AND 1),
  stroke_weight   NUMERIC(4,1) NOT NULL DEFAULT 2.0,
  stroke_opacity  NUMERIC(3,2) NOT NULL DEFAULT 1.0 CHECK (stroke_opacity BETWEEN 0 AND 1),
  point_radius    INTEGER NOT NULL DEFAULT 6,
  -- Zoom visibility
  min_zoom        INTEGER DEFAULT NULL,
  max_zoom        INTEGER DEFAULT NULL,
  -- Attribution override (falls back to dataset/source attribution)
  attribution_override TEXT,
  -- Legend label
  legend_label    TEXT,
  -- Active flag — allows hiding a layer without deleting config
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dataset_id)
);

CREATE INDEX IF NOT EXISTS spatial_layer_config_dataset_idx ON public.spatial_layer_config(dataset_id);
CREATE INDEX IF NOT EXISTS spatial_layer_config_category_idx ON public.spatial_layer_config(category);
CREATE INDEX IF NOT EXISTS spatial_layer_config_order_idx ON public.spatial_layer_config(display_order);

ALTER TABLE public.spatial_layer_config ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.spatial_layer_config TO service_role;
GRANT SELECT ON TABLE public.spatial_layer_config TO authenticated;

CREATE POLICY "sr_spatial_layer_config"
  ON public.spatial_layer_config FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "auth_read_spatial_layer_config"
  ON public.spatial_layer_config FOR SELECT TO authenticated USING (true);

-- Seed default layer config from existing published datasets
INSERT INTO public.spatial_layer_config (
  dataset_id, display_name, category, colour, fill_opacity, stroke_weight, display_order
)
SELECT
  sd.id,
  sd.name,
  CASE
    WHEN sd.name ILIKE '%ward%'          THEN 'administrative'
    WHEN sd.name ILIKE '%municipal%'     THEN 'administrative'
    WHEN sd.name ILIKE '%district%'      THEN 'administrative'
    WHEN sd.name ILIKE '%school%'        THEN 'education'
    WHEN sd.name ILIKE '%education%'     THEN 'education'
    WHEN sd.name ILIKE '%health%'        THEN 'health'
    WHEN sd.name ILIKE '%hospital%'      THEN 'health'
    WHEN sd.name ILIKE '%road%'          THEN 'transport'
    WHEN sd.name ILIKE '%railway%'       THEN 'transport'
    WHEN sd.name ILIKE '%waterway%'      THEN 'environment'
    WHEN sd.name ILIKE '%cultural%'      THEN 'cultural'
    WHEN sd.name ILIKE '%populated%'     THEN 'general'
    WHEN sd.name ILIKE '%financial%'     THEN 'general'
    ELSE 'general'
  END,
  CASE
    WHEN sd.name ILIKE '%ward%'          THEN '#facc15'
    WHEN sd.name ILIKE '%municipal%'     THEN '#f97316'
    WHEN sd.name ILIKE '%district%'      THEN '#22c55e'
    WHEN sd.name ILIKE '%school%'        THEN '#3b82f6'
    WHEN sd.name ILIKE '%education%'     THEN '#3b82f6'
    WHEN sd.name ILIKE '%health%'        THEN '#ef4444'
    WHEN sd.name ILIKE '%road%'          THEN '#6b7280'
    WHEN sd.name ILIKE '%railway%'       THEN '#78716c'
    WHEN sd.name ILIKE '%waterway%'      THEN '#06b6d4'
    WHEN sd.name ILIKE '%cultural%'      THEN '#a855f7'
    ELSE '#3b82f6'
  END,
  0.2,
  2.0,
  ROW_NUMBER() OVER (ORDER BY sd.name) * 10
FROM public.spatial_datasets sd
WHERE sd.status = 'published' AND sd.active = true
ON CONFLICT (dataset_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
