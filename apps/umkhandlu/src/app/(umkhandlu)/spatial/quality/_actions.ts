'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { getOperatorSession } from '@/lib/auth/operator';

async function requireOperator() {
  const session = await getOperatorSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export type DiscrepancyReviewOutcome =
  | 'confirmed-discrepancy'
  | 'accepted-variation'
  | 'resolved-verified'
  | 'dismissed';

export async function recordDiscrepancyReviewAction(
  discrepancyId: string,
  outcome: DiscrepancyReviewOutcome,
  notes: string,
) {
  const session = await requireOperator();
  const supabase = createServiceClient();

  if (!notes.trim()) return { error: 'Review notes are required.' };

  const { error } = await supabase
    .from('spatial_coordinate_discrepancies')
    .update({
      review_status: outcome,
      reviewer_id: session.id,
      reviewed_at: new Date().toISOString(),
      review_outcome: outcome,
      review_notes: notes.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', discrepancyId)
    .in('review_status', ['pending-review', 'requires-configuration', 'confirmed-discrepancy']);

  if (error) return { error: error.message };

  revalidatePath('/spatial/quality');
  return { success: true };
}
