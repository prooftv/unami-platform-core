-- Preserve the upstream OGC feature ID independently of the staging row ID.
ALTER TABLE public.spatial_staged_features
  ADD COLUMN IF NOT EXISTS source_feature_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS spatial_staged_dataset_source_feature_idx
  ON public.spatial_staged_features (dataset_id, source_feature_id)
  WHERE source_feature_id IS NOT NULL;

-- Record GratisGIS OGC retrievals distinctly without changing existing pipeline types.
ALTER TABLE public.spatial_pipeline_runs
  DROP CONSTRAINT IF EXISTS spatial_pipeline_runs_pipeline_type_check;

ALTER TABLE public.spatial_pipeline_runs
  ADD CONSTRAINT spatial_pipeline_runs_pipeline_type_check CHECK (pipeline_type IN (
    'health-check',
    'arcgis-fetch',
    'wfs-fetch',
    'download-fetch',
    'gdal-process',
    'geometry-validate',
    'publication',
    'reconciliation',
    'freshness-check',
    'risk-reminder',
    'compliance-alert',
    'gratisgis-fetch'
  ));
