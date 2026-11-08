/**
 * spatial-scheduler — scheduled pipeline orchestrator
 *
 * Invoked by Supabase pg_cron or a Vercel cron route.
 * Runs: daily health checks, data freshness monitoring,
 *       compliance deadline alerts, risk treatment deadline alerts.
 *
 * All pipelines are idempotent. Job locking prevents duplicate concurrent runs.
 * Every execution is recorded in spatial_pipeline_runs.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

// ---------------------------------------------------------------------------
// Job lock — prevents duplicate concurrent runs of the same pipeline type
// ---------------------------------------------------------------------------

async function acquireLock(
  sb: ReturnType<typeof serviceClient>,
  pipelineType: string,
): Promise<string | null> {
  const { data, error } = await sb.from('spatial_pipeline_runs').insert({
    pipeline_type: pipelineType,
    status: 'running',
    triggered_by: 'system',
    log: [{ ts: new Date().toISOString(), msg: 'Job started' }],
  }).select('id').single();
  if (error || !data) return null;
  return data.id as string;
}

async function releaseLock(
  sb: ReturnType<typeof serviceClient>,
  runId: string,
  status: 'success' | 'failed' | 'partial',
  log: unknown[],
  errorMessage?: string,
) {
  await sb.from('spatial_pipeline_runs').update({
    status,
    completed_at: new Date().toISOString(),
    log,
    error_message: errorMessage ?? null,
  }).eq('id', runId);
}

// ---------------------------------------------------------------------------
// Pipeline: daily health check on all active sources
// ---------------------------------------------------------------------------

async function runHealthCheck(sb: ReturnType<typeof serviceClient>) {
  const runId = await acquireLock(sb, 'health-check');
  if (!runId) return { skipped: true, reason: 'lock_failed' };

  const log: { ts: string; msg: string }[] = [];
  let failed = 0;

  const { data: sources } = await sb
    .from('spatial_sources')
    .select('id, name, base_url')
    .eq('active', true);

  for (const source of sources ?? []) {
    const start = Date.now();
    let reachable = false;
    let errorMsg: string | null = null;

    if (source.base_url) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);
        const res = await fetch(`${source.base_url.replace(/\/$/, '')}?f=json`, {
          signal: controller.signal, cache: 'no-store',
        });
        clearTimeout(timer);
        reachable = res.ok;
      } catch (e) {
        errorMsg = e instanceof Error ? e.message : String(e);
      }
    } else {
      errorMsg = 'No base_url';
    }

    const ms = Date.now() - start;
    const ts = new Date().toISOString();
    log.push({ ts, msg: `${source.name}: ${reachable ? `OK ${ms}ms` : `FAIL ${errorMsg}`}` });
    if (!reachable) failed++;

    await sb.from('spatial_sources')
      .update({ last_checked_at: ts, updated_at: ts })
      .eq('id', source.id);
  }

  const status = failed === 0 ? 'success' : failed === (sources?.length ?? 0) ? 'failed' : 'partial';
  await releaseLock(sb, runId, status, log, failed > 0 ? `${failed} source(s) unreachable` : undefined);
  return { checked: sources?.length ?? 0, failed };
}

// ---------------------------------------------------------------------------
// Pipeline: data freshness check — flag sources not checked in 7+ days
// ---------------------------------------------------------------------------

async function runFreshnessCheck(sb: ReturnType<typeof serviceClient>) {
  const runId = await acquireLock(sb, 'freshness-check');
  if (!runId) return { skipped: true };

  const log: { ts: string; msg: string }[] = [];
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: stale } = await sb
    .from('spatial_sources')
    .select('id, name, last_checked_at')
    .eq('active', true)
    .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff}`);

  for (const source of stale ?? []) {
    const ts = new Date().toISOString();
    const msg = source.last_checked_at
      ? `Stale: last checked ${source.last_checked_at}`
      : 'Never checked';
    log.push({ ts, msg: `${source.name}: ${msg}` });

    // Write a finding if not already open for this source
    const { data: existing } = await sb
      .from('findings')
      .select('id')
      .eq('finding_type', 'gap')
      .ilike('title', `%${source.name}%`)
      .eq('status', 'open')
      .limit(1);

    if (!existing?.length) {
      await sb.from('findings').insert({
        finding_type: 'gap',
        title: `Data freshness: ${source.name} not checked in 7+ days`,
        description: msg,
        severity: 'medium',
        owner: 'system',
        identified_at: ts.split('T')[0],
      });
    }
  }

  await releaseLock(sb, runId, 'success', log);
  return { stale: stale?.length ?? 0 };
}

// ---------------------------------------------------------------------------
// Pipeline: compliance deadline alerts — obligations due within 14 days
// ---------------------------------------------------------------------------

async function runComplianceAlerts(sb: ReturnType<typeof serviceClient>) {
  const runId = await acquireLock(sb, 'compliance-alert');
  if (!runId) return { skipped: true };

  const log: { ts: string; msg: string }[] = [];
  const today = new Date().toISOString().split('T')[0];
  const in14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: due } = await sb
    .from('compliance_obligations')
    .select('id, identifier, title, due_date, status')
    .in('status', ['under-review', 'non-compliant'])
    .gte('due_date', today)
    .lte('due_date', in14);

  for (const ob of due ?? []) {
    const ts = new Date().toISOString();
    log.push({ ts, msg: `${ob.identifier} — ${ob.title} due ${ob.due_date}` });

    const { data: existing } = await sb
      .from('findings')
      .select('id')
      .eq('finding_type', 'gap')
      .ilike('title', `%${ob.identifier}%`)
      .eq('status', 'open')
      .limit(1);

    if (!existing?.length) {
      await sb.from('findings').insert({
        finding_type: 'gap',
        title: `Compliance deadline approaching: ${ob.identifier} — ${ob.title}`,
        description: `Due ${ob.due_date}. Current status: ${ob.status}.`,
        severity: 'high',
        owner: 'system',
        identified_at: ts.split('T')[0],
      });
    }
  }

  await releaseLock(sb, runId, 'success', log);
  return { alertsGenerated: due?.length ?? 0 };
}

// ---------------------------------------------------------------------------
// Pipeline: risk treatment deadline alerts — overdue treatment plans
// ---------------------------------------------------------------------------

async function runRiskAlerts(sb: ReturnType<typeof serviceClient>) {
  const runId = await acquireLock(sb, 'risk-reminder');
  if (!runId) return { skipped: true };

  const log: { ts: string; msg: string }[] = [];
  const today = new Date().toISOString().split('T')[0];

  const { data: overdue } = await sb
    .from('risks')
    .select('id, identifier, title, treatment_deadline, treatment')
    .in('status', ['open', 'under-treatment'])
    .not('treatment_deadline', 'is', null)
    .lt('treatment_deadline', today)
    .neq('treatment', 'accept');

  for (const risk of overdue ?? []) {
    const ts = new Date().toISOString();
    log.push({ ts, msg: `${risk.identifier} — treatment deadline ${risk.treatment_deadline} overdue` });

    const { data: existing } = await sb
      .from('findings')
      .select('id')
      .eq('finding_type', 'gap')
      .ilike('title', `%${risk.identifier}%`)
      .eq('status', 'open')
      .limit(1);

    if (!existing?.length) {
      await sb.from('findings').insert({
        finding_type: 'gap',
        title: `Risk treatment overdue: ${risk.identifier} — ${risk.title}`,
        description: `Treatment deadline ${risk.treatment_deadline} has passed. Treatment: ${risk.treatment}.`,
        severity: 'high',
        owner: 'system',
        identified_at: ts.split('T')[0],
      });
    }
  }

  await releaseLock(sb, runId, 'success', log);
  return { overdueRisks: overdue?.length ?? 0 };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  // Verify scheduler secret
  const secret = req.headers.get('x-scheduler-secret');
  const expected = Deno.env.get('SCHEDULER_SECRET');
  if (expected && secret !== expected) return json({ error: 'Unauthorized' }, 401);

  const sb = serviceClient();
  const url = new URL(req.url);
  const pipeline = url.searchParams.get('pipeline') ?? 'all';

  const results: Record<string, unknown> = {};

  if (pipeline === 'all' || pipeline === 'health-check') {
    results['health-check'] = await runHealthCheck(sb);
  }
  if (pipeline === 'all' || pipeline === 'freshness-check') {
    results['freshness-check'] = await runFreshnessCheck(sb);
  }
  if (pipeline === 'all' || pipeline === 'compliance-alert') {
    results['compliance-alert'] = await runComplianceAlerts(sb);
  }
  if (pipeline === 'all' || pipeline === 'risk-reminder') {
    results['risk-reminder'] = await runRiskAlerts(sb);
  }

  return json({ ran: Object.keys(results), results, ts: new Date().toISOString() });
});
