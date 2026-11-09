import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(message: string, status: number) {
  return json({ error: message }, status);
}

function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

async function requireOperator(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const sb = serviceClient();
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;
  return { user, sb };
}

// ---------------------------------------------------------------------------
// Permission enforcement
// ---------------------------------------------------------------------------

type PermissionClassification =
  | 'reference' | 'display' | 'internal' | 'download'
  | 'redistribute' | 'restricted' | 'prohibited' | 'pending';

const PERMITTED_OPS: Record<PermissionClassification, string[]> = {
  reference:    [],
  display:      ['display'],
  internal:     ['display', 'ingest', 'process'],
  download:     ['display', 'ingest', 'process', 'download'],
  redistribute: ['display', 'ingest', 'process', 'download', 'publish', 'redistribute'],
  restricted:   [],
  prohibited:   [],
  pending:      [],
};

function canPerform(cls: PermissionClassification, op: string): boolean {
  return PERMITTED_OPS[cls]?.includes(op) ?? false;
}

async function checkIngestionPermission(
  sb: ReturnType<typeof serviceClient>,
  datasetId: string,
): Promise<string | null> {
  const { data: dataset } = await sb
    .from('spatial_datasets')
    .select('id, name, permission_classification, source_id')
    .eq('id', datasetId)
    .single();

  if (!dataset) return 'Dataset not found.';

  const datasetClass = (dataset.permission_classification ?? 'pending') as PermissionClassification;

  const { data: source } = await sb
    .from('spatial_sources')
    .select('id, name, permission_classification, restriction_authority, restriction_basis')
    .eq('id', dataset.source_id)
    .single();

  if (!source) return 'Source not found for dataset.';

  const sourceClass = (source.permission_classification ?? 'pending') as PermissionClassification;

  if (sourceClass === 'restricted') {
    return `Ingestion blocked: source "${source.name}" is restricted. Authority: ${source.restriction_authority ?? 'not recorded'}.`;
  }
  if (sourceClass === 'prohibited') {
    return `Ingestion blocked: source "${source.name}" is prohibited.`;
  }
  if (!canPerform(datasetClass, 'ingest')) {
    return `Ingestion blocked: dataset permission classification is "${datasetClass}".`;
  }
  if (!canPerform(sourceClass, 'ingest')) {
    return `Ingestion blocked: source permission classification is "${sourceClass}".`;
  }

  return null;
}

async function checkPublicationPermission(
  sb: ReturnType<typeof serviceClient>,
  datasetId: string,
): Promise<string | null> {
  const { data: dataset } = await sb
    .from('spatial_datasets')
    .select('id, name, permission_classification, source_id')
    .eq('id', datasetId)
    .single();

  if (!dataset) return 'Dataset not found.';

  const datasetClass = (dataset.permission_classification ?? 'pending') as PermissionClassification;

  const { data: source } = await sb
    .from('spatial_sources')
    .select('id, name, permission_classification, restriction_authority')
    .eq('id', dataset.source_id)
    .single();

  if (!source) return 'Source not found for dataset.';

  const sourceClass = (source.permission_classification ?? 'pending') as PermissionClassification;

  if (sourceClass === 'restricted') {
    return `Publication blocked: source "${source.name}" is restricted. Authority: ${source.restriction_authority ?? 'not recorded'}.`;
  }
  if (sourceClass === 'prohibited') {
    return `Publication blocked: source "${source.name}" is prohibited.`;
  }
  if (!canPerform(sourceClass, 'publish')) {
    return `Publication blocked: source permission classification is "${sourceClass}".`;
  }
  if (!canPerform(datasetClass, 'publish')) {
    return `Publication blocked: dataset permission classification is "${datasetClass}".`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Source CRUD
// ---------------------------------------------------------------------------

async function handleSourceCreate(req: Request) {
  const auth = await requireOperator(req);
  if (!auth) return err('Unauthorized', 401);
  const body = await req.json();
  const { name, institution, source_type } = body;
  if (!name || !institution || !source_type) return err('name, institution, source_type required', 400);

  const permClass = body.permission_classification ?? 'pending';

  const { data, error } = await auth.sb.from('spatial_sources').insert({
    name, institution, source_type,
    base_url:                  body.base_url ?? null,
    source_url:                body.source_url ?? null,
    dataset_identifier:        body.dataset_identifier ?? null,
    layer_id:                  body.layer_id ?? null,
    description:               body.description ?? null,
    geographic_coverage:       body.geographic_coverage ?? 'amajuba',
    coordinate_system:         body.coordinate_system ?? 'EPSG:4326',
    requires_auth:             body.requires_auth ?? false,
    permission_status:         permClass,
    permission_classification: permClass,
    permission_notes:          body.permission_notes ?? null,
    attribution:               body.attribution ?? null,
    licence_terms:             body.licence_terms ?? null,
    restriction_authority:     body.restriction_authority ?? null,
    restriction_basis:         body.restriction_basis ?? null,
    custodian_name:            body.custodian_name ?? null,
    custodian_email:           body.custodian_email ?? null,
    dataset_date:              body.dataset_date ?? null,
    availability_status:       body.availability_status ?? 'unknown',
    technical_usability:       body.technical_usability ?? 'unknown',
    authority_status:          body.authority_status ?? 'unknown',
    assessment_notes:          body.assessment_notes ?? null,
    notes:                     body.notes ?? null,
  }).select().single();

  if (error) return err(error.message, 500);
  await writeAudit(auth.sb, 'spatial_sources', data.id, auth.user.id, 'create', null, data);
  return json(data, 201);
}

async function handleSourceUpdate(req: Request, id: string) {
  const auth = await requireOperator(req);
  if (!auth) return err('Unauthorized', 401);
  const body = await req.json();

  const { data: prev } = await auth.sb.from('spatial_sources').select('*').eq('id', id).single();

  const newClass = body.permission_classification ?? prev?.permission_classification ?? 'pending';
  const updatePayload = { ...body, permission_status: newClass, permission_classification: newClass, updated_at: new Date().toISOString() };

  const { data, error } = await auth.sb.from('spatial_sources')
    .update(updatePayload)
    .eq('id', id).select().single();
  if (error) return err(error.message, 500);

  await writeAudit(auth.sb, 'spatial_sources', id, auth.user.id, 'update', prev, data);

  // Audit permission classification changes separately
  if (prev && prev.permission_classification !== newClass) {
    await auth.sb.from('spatial_permission_changes').insert({
      table_name: 'spatial_sources',
      record_id: id,
      actor: auth.user.id,
      previous_classification: prev.permission_classification,
      new_classification: newClass,
      previous_restriction_authority: prev.restriction_authority ?? null,
      new_restriction_authority: body.restriction_authority ?? null,
      reason: body.permission_change_reason ?? 'operator update via API',
    });
  }

  return json(data);
}

async function handleSourceDeactivate(req: Request, id: string) {
  const auth = await requireOperator(req);
  if (!auth) return err('Unauthorized', 401);
  const { data: prev } = await auth.sb.from('spatial_sources').select('*').eq('id', id).single();
  const { data, error } = await auth.sb.from('spatial_sources')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) return err(error.message, 500);
  await writeAudit(auth.sb, 'spatial_sources', id, auth.user.id, 'archive', prev, data);
  return json(data);
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

async function handleHealthCheck(sourceId?: string) {
  const sb = serviceClient();
  let query = sb.from('spatial_sources').select('id, name, base_url, source_type').eq('active', true);
  if (sourceId) query = query.eq('id', sourceId);
  const { data: sources, error } = await query;
  if (error || !sources) return err('Failed to fetch sources', 500);

  const results = await Promise.all(sources.map(async (source) => {
    const runId = crypto.randomUUID();
    const started = new Date().toISOString();

    if (!source.base_url) {
      await sb.from('spatial_pipeline_runs').insert({
        id: runId, pipeline_type: 'health-check', source_id: source.id,
        status: 'failed', started_at: started, completed_at: new Date().toISOString(),
        error_message: 'No base_url configured', triggered_by: 'system',
        log: [{ ts: started, msg: 'Skipped — no base_url' }],
      });
      return { source_id: source.id, reachable: false, error: 'No base_url' };
    }

    const start = Date.now();
    let reachable = false;
    let responseMs = 0;
    let errorMsg: string | null = null;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const url = `${source.base_url.replace(/\/$/, '')}?f=json`;
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timer);
      reachable = res.ok;
      responseMs = Date.now() - start;
    } catch (e) {
      responseMs = Date.now() - start;
      errorMsg = e instanceof Error ? e.message : String(e);
    }

    const completed = new Date().toISOString();
    await sb.from('spatial_pipeline_runs').insert({
      id: runId, pipeline_type: 'health-check', source_id: source.id,
      status: reachable ? 'success' : 'failed',
      started_at: started, completed_at: completed,
      error_message: errorMsg, triggered_by: 'system',
      log: [{ ts: completed, msg: reachable ? `Reachable — ${responseMs}ms` : `Unreachable — ${errorMsg}` }],
    });

    await sb.from('spatial_sources')
      .update({ last_checked_at: completed, updated_at: completed })
      .eq('id', source.id);

    return { source_id: source.id, name: source.name, reachable, responseMs, error: errorMsg };
  }));

  return json({ checked: results.length, results });
}

// ---------------------------------------------------------------------------
// Dataset CRUD
// ---------------------------------------------------------------------------

async function handleDatasetCreate(req: Request) {
  const auth = await requireOperator(req);
  if (!auth) return err('Unauthorized', 401);
  const body = await req.json();
  if (!body.source_id || !body.name) return err('source_id and name required', 400);

  const permClass = body.permission_classification ?? 'pending';

  const { data, error } = await auth.sb.from('spatial_datasets').insert({
    source_id:              body.source_id,
    name:                   body.name,
    layer_id:               body.layer_id ?? null,
    description:            body.description ?? null,
    geographic_coverage:    body.geographic_coverage ?? 'amajuba',
    crs:                    body.crs ?? 'EPSG:4326',
    dataset_date:           body.dataset_date ?? null,
    permission_status:      permClass,
    permission_classification: permClass,
    permission_notes:       body.permission_notes ?? null,
    attribution:            body.attribution ?? null,
    licence_terms:          body.licence_terms ?? null,
    restriction_authority:  body.restriction_authority ?? null,
    restriction_basis:      body.restriction_basis ?? null,
    custodian_name:         body.custodian_name ?? null,
    custodian_email:        body.custodian_email ?? null,
    provenance:             body.provenance ?? null,
    authority_status:       body.authority_status ?? 'unknown',
    assessment_notes:       body.assessment_notes ?? null,
  }).select().single();

  if (error) return err(error.message, 500);
  await writeAudit(auth.sb, 'spatial_datasets', data.id, auth.user.id, 'create', null, data);
  return json(data, 201);
}

async function handleDatasetUpdate(req: Request, id: string) {
  const auth = await requireOperator(req);
  if (!auth) return err('Unauthorized', 401);
  const body = await req.json();
  const { data: prev } = await auth.sb.from('spatial_datasets').select('*').eq('id', id).single();

  const newClass = body.permission_classification ?? prev?.permission_classification ?? 'pending';
  const updatePayload = { ...body, permission_status: newClass, permission_classification: newClass, updated_at: new Date().toISOString() };

  const { data, error } = await auth.sb.from('spatial_datasets')
    .update(updatePayload)
    .eq('id', id).select().single();
  if (error) return err(error.message, 500);

  await writeAudit(auth.sb, 'spatial_datasets', id, auth.user.id, 'update', prev, data);

  if (prev && prev.permission_classification !== newClass) {
    await auth.sb.from('spatial_permission_changes').insert({
      table_name: 'spatial_datasets',
      record_id: id,
      actor: auth.user.id,
      previous_classification: prev.permission_classification,
      new_classification: newClass,
      previous_restriction_authority: prev.restriction_authority ?? null,
      new_restriction_authority: body.restriction_authority ?? null,
      reason: body.permission_change_reason ?? 'operator update via API',
    });
  }

  return json(data);
}

// ---------------------------------------------------------------------------
// Staging review — rechecks permission before publication
// ---------------------------------------------------------------------------

async function handleStagingReview(req: Request, datasetId: string) {
  const auth = await requireOperator(req);
  if (!auth) return err('Unauthorized', 401);
  const { feature_ids, action, notes } = await req.json();
  if (!feature_ids?.length || !['approve', 'reject'].includes(action)) {
    return err('feature_ids and action (approve|reject) required', 400);
  }

  // Recheck permission before approving — permission may have changed since staging
  if (action === 'approve') {
    const permissionError = await checkPublicationPermission(auth.sb, datasetId);
    if (permissionError) {
      await auth.sb.from('spatial_permission_changes').insert({
        table_name: 'spatial_datasets',
        record_id: datasetId,
        actor: auth.user.id,
        previous_classification: null,
        new_classification: 'blocked_attempt',
        reason: `Publication blocked at staging review: ${permissionError}`,
      });
      return err(permissionError, 403);
    }
  }

  const now = new Date().toISOString();
  const { error } = await auth.sb.from('spatial_staged_features')
    .update({
      operator_status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: auth.user.id,
      reviewed_at: now,
      notes: notes ?? null,
    })
    .in('id', feature_ids)
    .eq('dataset_id', datasetId);
  if (error) return err(error.message, 500);

  if (action === 'approve') {
    const { data: remaining } = await auth.sb.from('spatial_staged_features')
      .select('id').eq('dataset_id', datasetId).eq('operator_status', 'pending');
    if (!remaining?.length) {
      await auth.sb.from('spatial_datasets')
        .update({ status: 'published', published_at: now, updated_at: now })
        .eq('id', datasetId);
    }
  }

  await writeAudit(auth.sb, 'spatial_staged_features', datasetId, auth.user.id,
    action === 'approve' ? 'approve' : 'reject', null, { feature_ids, notes });

  return json({ updated: feature_ids.length, action });
}

// ---------------------------------------------------------------------------
// Pipeline runs
// ---------------------------------------------------------------------------

async function handleListRuns(req: Request) {
  const sb = serviceClient();
  const url = new URL(req.url);
  const sourceId = url.searchParams.get('source_id');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200);
  let query = sb.from('spatial_pipeline_runs')
    .select('*, spatial_sources(name, institution)')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (sourceId) query = query.eq('source_id', sourceId);
  const { data, error } = await query;
  if (error) return err(error.message, 500);
  return json(data);
}

async function handleReplay(req: Request, runId: string) {
  const auth = await requireOperator(req);
  if (!auth) return err('Unauthorized', 401);
  const { data: run } = await auth.sb.from('spatial_pipeline_runs')
    .select('*').eq('id', runId).single();
  if (!run) return err('Run not found', 404);
  if (run.status !== 'failed') return err('Only failed runs can be replayed', 400);

  if (run.pipeline_type === 'health-check') {
    return handleHealthCheck(run.source_id ?? undefined);
  }
  return err(`Replay not yet implemented for pipeline type: ${run.pipeline_type}`, 501);
}

// ---------------------------------------------------------------------------
// Audit helpers
// ---------------------------------------------------------------------------

async function writeAudit(
  sb: ReturnType<typeof createClient>,
  tableName: string,
  recordId: string,
  actor: string,
  action: string,
  prev: unknown,
  next: unknown,
) {
  await sb.from('gis_audit_log').insert({
    table_name: tableName,
    record_id: recordId,
    actor,
    action,
    previous_state: prev ?? null,
    new_state: next ?? null,
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const url = new URL(req.url);
  const segments = url.pathname.replace(/^\/spatial-pipelines\/?/, '').split('/').filter(Boolean);
  const [seg0, seg1, seg2] = segments;
  const method = req.method;

  if (seg0 === 'sources') {
    if (method === 'POST' && !seg1)  return handleSourceCreate(req);
    if (method === 'PUT'  && seg1)   return handleSourceUpdate(req, seg1);
    if (method === 'DELETE' && seg1) return handleSourceDeactivate(req, seg1);
  }

  if (seg0 === 'health-check' && method === 'POST') {
    return handleHealthCheck(seg1 ?? undefined);
  }

  if (seg0 === 'datasets') {
    if (method === 'POST' && !seg1) return handleDatasetCreate(req);
    if (method === 'PUT'  && seg1)  return handleDatasetUpdate(req, seg1);
  }

  if (seg0 === 'stage' && seg1 && seg2 === 'review' && method === 'POST') {
    return handleStagingReview(req, seg1);
  }

  if (seg0 === 'runs') {
    if (method === 'GET'  && !seg1)                    return handleListRuns(req);
    if (method === 'POST' && seg1 && seg2 === 'replay') return handleReplay(req, seg1);
  }

  return err('Not found', 404);
});
