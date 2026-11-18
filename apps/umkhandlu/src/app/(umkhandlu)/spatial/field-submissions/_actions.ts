'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { getOperatorSession } from '@/lib/auth/operator';

type ReviewAction = 'approve' | 'reject' | 'request_correction' | 'open_review';

const TERMINAL_STATUSES = new Set(['approved', 'rejected']);

export async function reviewFieldSubmission(
  submissionId: string,
  action: ReviewAction,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getOperatorSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const supabase = createServiceClient();

  // Guard: prevent re-processing terminal submissions
  const { data: current } = await supabase
    .from('field_submissions')
    .select('status')
    .eq('id', submissionId)
    .single();

  if (!current) return { success: false, error: 'Submission not found.' };
  if (TERMINAL_STATUSES.has(current.status) && action !== 'open_review') {
    return { success: false, error: `Submission is already ${current.status}.` };
  }

  const statusMap: Record<ReviewAction, string> = {
    open_review: 'under_review',
    approve: 'approved',
    reject: 'rejected',
    request_correction: 'correction_requested',
  };

  const eventTypeMap: Record<ReviewAction, string> = {
    open_review: 'review_opened',
    approve: 'approved',
    reject: 'rejected',
    request_correction: 'correction_requested',
  };

  const newStatus = statusMap[action];

  const { error: updateError } = await supabase
    .from('field_submissions')
    .update({
      status: newStatus,
      ...(action !== 'open_review' ? {
        reviewed_at: new Date().toISOString(),
        review_notes: notes ?? null,
      } : {}),
    })
    .eq('id', submissionId);

  if (updateError) return { success: false, error: updateError.message };

  const { error: eventError } = await supabase
    .from('field_submission_events')
    .insert({
      submission_id: submissionId,
      event_type: eventTypeMap[action],
      actor_type: 'operator',
      notes: notes ?? null,
      metadata: { action, operator: session.email },
    });

  if (eventError) return { success: false, error: eventError.message };

  // If approved, promote geometry to spatial_staged_features
  if (action === 'approve') {
    const { data: submission } = await supabase
      .from('field_submissions')
      .select('geometry_geojson, attributes, gratisgis_submission_id, activity_type, collector_display_name')
      .eq('id', submissionId)
      .single();

    if (submission?.geometry_geojson) {
      const datasetId = await getOrCreateFieldDataset(supabase, submission.activity_type);
      const pipelineRunId = await getOrCreateFieldPipelineRun(supabase, submissionId);
      if (!datasetId || !pipelineRunId) {
        console.error('[reviewFieldSubmission] failed to resolve dataset or pipeline run');
        return { success: false, error: 'Failed to resolve staging dataset.' };
      }

      const { data: staged, error: stageError } = await supabase
        .from('spatial_staged_features')
        .insert({
          dataset_id: datasetId,
          pipeline_run_id: pipelineRunId,
          feature_geojson: submission.geometry_geojson,
          feature_properties: {
            ...submission.attributes,
            _source: 'field_submission',
            _submission_id: submissionId,
            _gratisgis_id: submission.gratisgis_submission_id,
            _collector: submission.collector_display_name,
            _activity: submission.activity_type,
          },
          geometry_valid: true,
          operator_status: 'approved',
          source_feature_id: submission.gratisgis_submission_id,
        })
        .select('id')
        .single();

      if (!stageError && staged) {
        await supabase
          .from('field_submissions')
          .update({ approved_feature_id: staged.id })
          .eq('id', submissionId);

        await supabase.from('field_submission_events').insert({
          submission_id: submissionId,
          event_type: 'feature_promoted',
          actor_type: 'system',
          metadata: { staged_feature_id: staged.id },
        });
      }
    }
  }

  revalidatePath('/spatial/field-submissions');
  revalidatePath(`/spatial/field-submissions/${submissionId}`);
  return { success: true };
}

async function getOrCreateFieldDataset(
  supabase: ReturnType<typeof createServiceClient>,
  activityType: string,
): Promise<string | null> {
  const name = `Field Submissions — ${activityType.replace(/_/g, ' ')}`;
  const { data: existing } = await supabase
    .from('spatial_datasets')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: source } = await supabase
    .from('spatial_sources')
    .select('id')
    .eq('source_type', 'field-collection')
    .maybeSingle();

  let sourceId = source?.id;
  if (!sourceId) {
    const { data: newSource, error: srcErr } = await supabase
      .from('spatial_sources')
      .insert({
        name: 'Umkhandlu Field Collection',
        institution: 'Unami Foundation',
        source_type: 'field-collection',
        active: true,
        permission_classification: 'restricted',
      })
      .select('id')
      .single();
    if (srcErr) return null;
    sourceId = newSource?.id;
  }

  const { data: newDataset, error: dsErr } = await supabase
    .from('spatial_datasets')
    .insert({
      name,
      source_id: sourceId,
      status: 'staged',
      permission_classification: 'restricted',
    })
    .select('id')
    .single();

  if (dsErr) return null;
  return newDataset?.id ?? null;
}

async function getOrCreateFieldPipelineRun(
  supabase: ReturnType<typeof createServiceClient>,
  submissionId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('spatial_pipeline_runs')
    .insert({
      pipeline_type: 'field-submission',
      status: 'success',
      features_fetched: 1,
      features_processed: 1,
      triggered_by: `field_submission:${submissionId}`,
    })
    .select('id')
    .single();
  if (error) return null;
  return data?.id ?? null;
}
