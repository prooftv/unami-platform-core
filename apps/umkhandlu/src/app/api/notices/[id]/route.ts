import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/notices/[id]/transfer
// Server-side only. Transfers an approved CC notice to the Governance Node.
// Idempotent: if gn_notice_ref is already set, returns the existing ref.
// Never called from the browser — called from the workflow API on advance to 'transferred'.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createServiceClient();

  // 1. Load notice and its workflow run
  const [{ data: notice }, { data: run }] = await Promise.all([
    supabase
      .from('notices')
      .select('id, title, type, status, is_statutory, latitude, longitude, ward_ref, node_notice_ref, comment_deadline, content')
      .eq('id', id)
      .single(),
    supabase
      .from('notice_workflow_runs')
      .select('id, stage, approved_at, gn_notice_ref, analysis_outputs, provenance_manifest, preset_id')
      .eq('notice_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!notice) {
    return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
  }

  // 2. Eligibility: must be approved stage
  if (!run || run.stage !== 'approved') {
    return NextResponse.json(
      { error: `Transfer requires stage=approved. Current stage: ${run?.stage ?? 'none'}` },
      { status: 422 },
    );
  }

  // 3. Idempotency: already transferred
  if (run.gn_notice_ref) {
    return NextResponse.json({
      transferred: true,
      gnNoticeRef: run.gn_notice_ref,
      idempotent: true,
    });
  }

  // 4. Validate required fields
  if (!notice.title || !notice.type) {
    return NextResponse.json(
      { error: 'Notice missing required fields: title, type' },
      { status: 422 },
    );
  }

  // 5. Resolve GN endpoint
  const gnUrl = process.env.GOVERNANCE_NODE_URL ?? process.env.CONTROL_CENTRE_URL?.replace('controlcenter', 'umkhandlu');
  const nodeApiKey = process.env.UMKHANDLU_NODE_API_KEY;

  if (!gnUrl || !nodeApiKey) {
    return NextResponse.json(
      { error: 'GOVERNANCE_NODE_URL and UMKHANDLU_NODE_API_KEY must be configured' },
      { status: 503 },
    );
  }

  // 6. Build transfer payload — only publicly redistributable data
  const payload = {
    ccNoticeId: notice.id,
    noticeType: notice.type,
    title: notice.title,
    description: notice.content ?? '',
    isStatutory: notice.is_statutory ?? true,
    commentDeadline: notice.comment_deadline ?? null,
    wardRef: notice.ward_ref ?? null,
    lat: notice.latitude ?? null,
    lng: notice.longitude ?? null,
    approvedAt: run.approved_at ?? new Date().toISOString(),
    // Analysis outputs are internal — only transfer summary, not raw spatial data
    analysisSummary: run.analysis_outputs
      ? extractPublicSummary(run.analysis_outputs as Record<string, unknown>)
      : null,
  };

  // 7. Call GN receive-transfer endpoint
  let gnResponse: { gnNoticeRef?: string; error?: string };
  try {
    const res = await fetch(`${gnUrl}/api/notices/receive-transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nodeApiKey}`,
      },
      body: JSON.stringify(payload),
    });
    gnResponse = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    if (!res.ok) {
      await logTransferAttempt(supabase, run.id, notice.id, 'failed', gnResponse.error ?? `HTTP ${res.status}`);
      return NextResponse.json(
        { error: gnResponse.error ?? `GN returned HTTP ${res.status}` },
        { status: 502 },
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logTransferAttempt(supabase, run.id, notice.id, 'failed', msg);
    return NextResponse.json({ error: `GN request failed: ${msg}` }, { status: 502 });
  }

  if (!gnResponse.gnNoticeRef) {
    await logTransferAttempt(supabase, run.id, notice.id, 'failed', 'GN did not return gnNoticeRef');
    return NextResponse.json({ error: 'GN did not return gnNoticeRef' }, { status: 502 });
  }

  // 8. Record the GN ref on the workflow run
  await supabase
    .from('notice_workflow_runs')
    .update({ gn_notice_ref: gnResponse.gnNoticeRef, updated_at: new Date().toISOString() })
    .eq('id', run.id);

  // 9. Audit log
  await logTransferAttempt(supabase, run.id, notice.id, 'success', null, gnResponse.gnNoticeRef);

  return NextResponse.json({
    transferred: true,
    gnNoticeRef: gnResponse.gnNoticeRef,
    idempotent: false,
  });
}

function extractPublicSummary(outputs: Record<string, unknown>): Record<string, unknown> {
  // Only pass through fields that are safe for public governance records.
  // Internal analytical details, restricted dataset references and raw geometry stay in CC.
  const safe: Record<string, unknown> = {};
  if (typeof outputs.summary === 'string') safe.summary = outputs.summary;
  if (typeof outputs.screeningStatus === 'string') safe.screeningStatus = outputs.screeningStatus;
  if (typeof outputs.analystName === 'string') safe.analystName = outputs.analystName;
  if (typeof outputs.analysisDate === 'string') safe.analysisDate = outputs.analysisDate;
  if (typeof outputs.geolibreProjectUrl === 'string') safe.geolibreProjectUrl = outputs.geolibreProjectUrl;
  return safe;
}

async function logTransferAttempt(
  supabase: ReturnType<typeof createServiceClient>,
  runId: string,
  noticeId: string,
  status: 'success' | 'failed',
  errorMessage: string | null,
  gnNoticeRef?: string,
) {
  await supabase.from('gis_audit_log').insert({
    table_name: 'notice_workflow_runs',
    record_id: runId,
    actor: 'cc-transfer',
    action: 'transfer',
    previous_state: null,
    new_state: { noticeId, status, gnNoticeRef: gnNoticeRef ?? null, errorMessage },
  });
}
