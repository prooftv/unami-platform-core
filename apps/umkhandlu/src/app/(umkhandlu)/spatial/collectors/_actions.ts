'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { getOperatorSession } from '@/lib/auth/operator';

export async function toggleCollectorActive(
  collectorId: string,
  active: boolean,
): Promise<{ success: boolean; error?: string }> {
  const session = await getOperatorSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const supabase = createServiceClient();

  const { error } = await supabase
    .from('field_collectors')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', collectorId);

  if (error) return { success: false, error: error.message };

  await supabase.from('gis_audit_log').insert({
    table_name: 'field_collectors',
    record_id: collectorId,
    actor: session.email,
    action: 'update',
    reason: active ? 'Operator reactivated collector' : 'Operator deactivated collector',
    new_state: { active },
  });

  revalidatePath('/spatial/collectors');
  revalidatePath(`/spatial/collectors/${collectorId}`);
  return { success: true };
}
