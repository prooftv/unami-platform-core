import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/spatial/notice-workflow?noticeId=
export async function GET(req: NextRequest) {
  const noticeId = req.nextUrl.searchParams.get('noticeId');
  if (!noticeId) return NextResponse.json({ error: 'noticeId required' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: run } = await supabase
    .from('notice_workflow_runs')
    .select('*, notice_workflow_events(id, from_stage, to_stage, actor_type, notes, created_at)')
    .eq('notice_id', noticeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: preset } = run?.preset_id
    ? await supabase
        .from('notice_presets')
        .select('id, label, notice_type, version, proximity_radius_metres, geolibre_tools, validation_rules, gn_publication_required')
        .eq('id', run.preset_id)
        .single()
    : { data: null };

  return NextResponse.json({ run: run ?? null, preset: preset ?? null });
}

// POST /api/spatial/notice-workflow — create or advance a workflow run
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    noticeId: string;
    noticeType: string;
    action: 'start' | 'advance' | 'reject';
    toStage?: string;
    notes?: string;
    geolibreProjectId?: string;
    geolibreProjectUrl?: string;
    analysisOutputs?: Record<string, unknown>;
    provenanceManifest?: Record<string, unknown>;
  };

  const { noticeId, noticeType, action, notes } = body;
  if (!noticeId || !noticeType || !action) {
    return NextResponse.json({ error: 'noticeId, noticeType and action required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  if (action === 'start') {
    // Find matching preset
    const { data: preset } = await supabase
      .from('notice_presets')
      .select('id, version')
      .eq('notice_type', noticeType)
      .eq('active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: run, error } = await supabase
      .from('notice_workflow_runs')
      .insert({
        notice_id: noticeId,
        notice_type: noticeType,
        preset_id: preset?.id ?? null,
        preset_version: preset?.version ?? null,
        stage: 'draft',
      })
      .select('id, stage')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('notice_workflow_events').insert({
      run_id: run.id,
      from_stage: null,
      to_stage: 'draft',
      actor_type: 'operator',
      notes: notes ?? 'Workflow started',
    });

    return NextResponse.json({ run });
  }

  if (action === 'advance') {
    const toStage = body.toStage;
    if (!toStage) return NextResponse.json({ error: 'toStage required for advance' }, { status: 400 });

    const { data: existing } = await supabase
      .from('notice_workflow_runs')
      .select('id, stage')
      .eq('notice_id', noticeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing) return NextResponse.json({ error: 'No workflow run found. Start one first.' }, { status: 404 });

    const updates: Record<string, unknown> = { stage: toStage, updated_at: new Date().toISOString() };
    if (toStage === 'workbench' && body.geolibreProjectId) {
      updates.geolibre_project_id = body.geolibreProjectId;
      updates.geolibre_project_url = body.geolibreProjectUrl ?? null;
    }
    if (toStage === 'review') {
      if (body.analysisOutputs) updates.analysis_outputs = body.analysisOutputs;
      if (body.provenanceManifest) updates.provenance_manifest = body.provenanceManifest;
    }
    if (toStage === 'approved') {
      updates.approved_at = new Date().toISOString();
    }
    if (toStage === 'transferred') {
      updates.transferred_at = new Date().toISOString();
      // Trigger the actual CC→GN transfer server-side
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
      try {
        const transferRes = await fetch(`${baseUrl}/api/notices/${noticeId}/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const transferBody = await transferRes.json() as { gnNoticeRef?: string; error?: string; idempotent?: boolean };
        if (!transferRes.ok) {
          return NextResponse.json(
            { error: `Transfer to Governance Node failed: ${transferBody.error ?? `HTTP ${transferRes.status}`}` },
            { status: 502 },
          );
        }
        if (transferBody.gnNoticeRef) {
          updates.gn_notice_ref = transferBody.gnNoticeRef;
        }
      } catch (err) {
        return NextResponse.json(
          { error: `Transfer request failed: ${err instanceof Error ? err.message : String(err)}` },
          { status: 502 },
        );
      }
    }
    if (toStage === 'published') {
      updates.published_at = new Date().toISOString();
    }

    const { data: run, error } = await supabase
      .from('notice_workflow_runs')
      .update(updates)
      .eq('id', existing.id)
      .select('id, stage')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('notice_workflow_events').insert({
      run_id: existing.id,
      from_stage: existing.stage,
      to_stage: toStage,
      actor_type: 'operator',
      notes: notes ?? null,
    });

    return NextResponse.json({ run });
  }

  if (action === 'reject') {
    const { data: existing } = await supabase
      .from('notice_workflow_runs')
      .select('id, stage')
      .eq('notice_id', noticeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existing) return NextResponse.json({ error: 'No workflow run found.' }, { status: 404 });

    const { data: run, error } = await supabase
      .from('notice_workflow_runs')
      .update({ stage: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id, stage')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('notice_workflow_events').insert({
      run_id: existing.id,
      from_stage: existing.stage,
      to_stage: 'rejected',
      actor_type: 'operator',
      notes: notes ?? null,
    });

    return NextResponse.json({ run });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
