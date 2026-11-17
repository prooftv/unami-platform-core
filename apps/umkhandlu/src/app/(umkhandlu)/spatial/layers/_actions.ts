'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { getOperatorSession } from '@/lib/auth/operator';

async function requireOperator() {
  const session = await getOperatorSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

const VALID_CATEGORIES = new Set([
  'administrative', 'infrastructure', 'education', 'health',
  'cultural', 'environment', 'land-use', 'transport', 'general',
]);

export async function upsertLayerConfigAction(datasetId: string, formData: FormData) {
  await requireOperator();
  const supabase = createServiceClient();

  const category = formData.get('category') as string;
  if (!VALID_CATEGORIES.has(category)) {
    return { error: 'Invalid category.' };
  }

  const fillOpacity = parseFloat(formData.get('fill_opacity') as string);
  const strokeWeight = parseFloat(formData.get('stroke_weight') as string);
  const strokeOpacity = parseFloat(formData.get('stroke_opacity') as string);
  const pointRadius = parseInt(formData.get('point_radius') as string, 10);
  const displayOrder = parseInt(formData.get('display_order') as string, 10);

  if (
    !Number.isFinite(fillOpacity) || fillOpacity < 0 || fillOpacity > 1 ||
    !Number.isFinite(strokeWeight) || strokeWeight < 0 ||
    !Number.isFinite(strokeOpacity) || strokeOpacity < 0 || strokeOpacity > 1 ||
    !Number.isInteger(pointRadius) || pointRadius < 1 ||
    !Number.isInteger(displayOrder)
  ) {
    return { error: 'Invalid numeric values.' };
  }

  const colour = (formData.get('colour') as string).trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(colour)) {
    return { error: 'Colour must be a valid hex colour (e.g. #3b82f6).' };
  }

  const { error } = await supabase.from('spatial_layer_config').upsert({
    dataset_id:           datasetId,
    display_name:         (formData.get('display_name') as string).trim() || null,
    category,
    colour,
    fill_opacity:         fillOpacity,
    stroke_weight:        strokeWeight,
    stroke_opacity:       strokeOpacity,
    point_radius:         pointRadius,
    visible_default:      formData.get('visible_default') === 'true',
    display_order:        displayOrder,
    min_zoom:             formData.get('min_zoom') ? parseInt(formData.get('min_zoom') as string, 10) : null,
    max_zoom:             formData.get('max_zoom') ? parseInt(formData.get('max_zoom') as string, 10) : null,
    attribution_override: (formData.get('attribution_override') as string) || null,
    legend_label:         (formData.get('legend_label') as string) || null,
    active:               formData.get('active') === 'true',
    updated_at:           new Date().toISOString(),
  }, { onConflict: 'dataset_id' });

  if (error) return { error: error.message };

  revalidatePath('/spatial/layers');
  revalidatePath('/spatial/map');
  return { success: true };
}
