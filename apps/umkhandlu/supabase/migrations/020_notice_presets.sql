-- Migration 020: Notice Presets
-- Coordinates the four-stage notice workflow across CC, GratisGIS, GeoLibre and GN.
-- Each preset defines the spatial datasets, GeoLibre tools, validation rules,
-- provenance requirements and publication rules for a notice type.

create table if not exists notice_presets (
  id                        uuid primary key default gen_random_uuid(),
  notice_type               text not null,
  version                   integer not null default 1,
  label                     text not null,
  description               text,

  -- Stage 1: Draft & Contextualise
  required_dataset_ids      uuid[] not null default '{}',
  optional_dataset_ids      uuid[] not null default '{}',
  proximity_radius_metres   integer,
  subject_geometry_required boolean not null default true,

  -- Stage 2: Workbench Analysis
  geolibre_tools            text[] not null default '{}',
  geolibre_plugins          text[] not null default '{}',
  processing_parameters     jsonb not null default '{}',
  ai_prompt_context         text,
  ai_permitted_actions      text[] not null default '{}',

  -- Stage 3: Review & Provenance
  validation_rules          jsonb not null default '[]',
  required_provenance_fields text[] not null default '{}',
  reviewer_role             text not null default 'operator',

  -- Stage 4: Approve, Transfer & Publish
  gn_publication_required   boolean not null default false,
  public_layer_ids          uuid[] not null default '{}',
  internal_layer_ids        uuid[] not null default '{}',
  transfer_webhook_url      text,

  active                    boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  unique (notice_type, version)
);

-- Tracks each notice through its four workflow stages
create table if not exists notice_workflow_runs (
  id                  uuid primary key default gen_random_uuid(),
  notice_id           text not null,
  notice_type         text not null,
  preset_id           uuid references notice_presets(id),
  preset_version      integer,

  -- Current stage: draft | workbench | review | approved | transferred | published | rejected
  stage               text not null default 'draft'
                        check (stage in ('draft','workbench','review','approved','transferred','published','rejected')),

  -- Stage 1 outputs
  subject_lat         double precision,
  subject_lng         double precision,
  subject_geometry_source text,
  screening_status    text,
  dataset_snapshot    jsonb,

  -- Stage 2 outputs
  geolibre_project_id text,
  geolibre_project_url text,
  analysis_outputs    jsonb,
  provenance_manifest jsonb,

  -- Stage 3 outputs
  review_notes        text,
  reviewed_by         text,
  reviewed_at         timestamptz,
  validation_result   jsonb,

  -- Stage 4 outputs
  approved_by         text,
  approved_at         timestamptz,
  gn_notice_ref       text,
  transferred_at      timestamptz,
  published_at        timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists notice_workflow_runs_notice_id_idx on notice_workflow_runs(notice_id);
create index if not exists notice_workflow_runs_stage_idx on notice_workflow_runs(stage);

-- Audit log for stage transitions
create table if not exists notice_workflow_events (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null references notice_workflow_runs(id) on delete cascade,
  from_stage      text,
  to_stage        text not null,
  actor_type      text not null default 'operator' check (actor_type in ('operator','system','ai')),
  actor_id        text,
  notes           text,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists notice_workflow_events_run_id_idx on notice_workflow_events(run_id);

-- RLS: service role only (operator access via CC server actions)
alter table notice_presets enable row level security;
alter table notice_workflow_runs enable row level security;
alter table notice_workflow_events enable row level security;

create policy "service_role_all" on notice_presets for all to service_role using (true) with check (true);
create policy "service_role_all" on notice_workflow_runs for all to service_role using (true) with check (true);
create policy "service_role_all" on notice_workflow_events for all to service_role using (true) with check (true);

-- Seed the four standard notice type presets
insert into notice_presets (notice_type, version, label, description, proximity_radius_metres, geolibre_tools, validation_rules, gn_publication_required, subject_geometry_required)
values
  ('liquor', 1, 'Liquor Licence Application', 'KZN Liquor Licensing Act s.43 — 500m proximity screening required.', 500,
   array['proximity-analysis','buffer-tool','feature-inspector','pdf-export'],
   '[{"rule":"proximity_radius_complete","description":"500m proximity screening must be complete"},{"rule":"subject_geometry_verified","description":"Site coordinates must be operator-verified"}]'::jsonb,
   true, true),

  ('eia', 1, 'Environmental Impact Assessment', 'NEMA EIA Regulations — waterways, populated places, infrastructure proximity.', null,
   array['proximity-analysis','feature-inspector','pdf-export','terrain-analysis'],
   '[{"rule":"subject_geometry_verified","description":"Site coordinates must be operator-verified"},{"rule":"waterways_screened","description":"Waterway proximity must be assessed"}]'::jsonb,
   true, true),

  ('mining', 1, 'Mining Rights Application', 'MPRDA s.5 — 500m proximity screening, waterways, populated places.', 500,
   array['proximity-analysis','buffer-tool','feature-inspector','pdf-export','terrain-analysis'],
   '[{"rule":"proximity_radius_complete","description":"500m proximity screening must be complete"},{"rule":"subject_geometry_verified","description":"Site coordinates must be operator-verified"}]'::jsonb,
   true, true),

  ('rezoning', 1, 'Rezoning Application', 'SPLUMA — roads, populated places, ward boundary context.', null,
   array['feature-inspector','pdf-export'],
   '[{"rule":"subject_geometry_verified","description":"Site coordinates must be operator-verified"}]'::jsonb,
   true, true)

on conflict (notice_type, version) do nothing;
