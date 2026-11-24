-- Migration 021: Grant REST API access to notice preset tables
-- The RLS policies in 020 use service_role but PostgREST also needs
-- explicit GRANT to expose the tables through the REST API.

grant all on notice_presets to service_role;
grant all on notice_workflow_runs to service_role;
grant all on notice_workflow_events to service_role;

-- Also grant sequence usage for any serial/identity columns
grant usage on all sequences in schema public to service_role;
