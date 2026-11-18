'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';

type ReviewAction = 'approve' | 'reject' | 'request_correction' | 'open_review';

export async function reviewFieldSubmission(
  submissionId: string,
  action: ReviewAction,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

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
      ...(action !== 'open_review' ? { reviewed_at: new Date().toISOString(), review_notes: notes ?? null } : {}),
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
      metadata: { action },
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
      const { data: staged, error: stageError } = await supabase
        .from('spatial_staged_features')
        .insert({
          dataset_id: await getOrCreateFieldDataset(supabase, submission.activity_type),
          pipeline_run_id: await getOrCreateFieldPipelineRun(supabase, submissionId),
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
): Promise<string> {
  const name = `Field Submissions — ${activityType.replace(/_/g, ' ')}`;
  const { data: existing } = await supabase
    .from('spatial_datasets')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) return existing.id;

  const { data: source } = await supabase
    .from('spatial_sources')
    .select('id')
    .eq('source_type', 'field-collection')
    .single();

  let sourceId = source?.id;
  if (!sourceId) {
    const { data: newSource } = await supabase
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
    sourceId = newSource?.id;
  }

  const { data: newDataset } = await supabase
    .from('spatial_datasets')
    .insert({
      name,
      source_id: sourceId,
      status: 'staged',
      permission_classification: 'restricted',
    })
    .select('id')
    .single();

  return newDataset!.id;
}

async function getOrCreateFieldPipelineRun(
  supabase: ReturnType<typeof createServiceClient>,
  submissionId: string,
): Promise<string> {
  const { data } = await supabase
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
  return data!.id;
}
