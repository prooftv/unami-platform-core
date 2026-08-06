import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { requireAuth, corsHeaders, json, err, logError } from '../_shared/auth.ts';

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 50;

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return err('Method not allowed', 405, cors);

  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { supabase } = auth;

  try {
    return await retryFailedBatches(supabase, cors);
  } catch (e) {
    await logError(supabase, 'retry_batches_function', (e as Error).message, {});
    return err('Internal server error', 500, cors);
  }
});

async function retryFailedBatches(
  supabase: ReturnType<typeof createClient>,
  cors: Record<string, string>,
) {
  // Find failed batches where the parent broadcast has attempts < MAX_ATTEMPTS
  const { data: failedBatches, error } = await supabase
    .from('broadcast_batches')
    .select('id, broadcast_id, batch_number, recipients, broadcasts(moment_id, moments(*))')
    .eq('status', 'failed')
    .lt('failure_count', BATCH_SIZE); // partial failures only — full failures may be invalid numbers

  if (error) return err(error.message, 500, cors);
  if (!failedBatches || failedBatches.length === 0) {
    return json({ retried: 0, message: 'No failed batches to retry' }, 200, cors);
  }

  let retried = 0;
  let skipped = 0;

  for (const batch of failedBatches) {
    const broadcast = batch.broadcasts as Record<string, unknown> | null;
    const moment = broadcast?.moments as Record<string, unknown> | null;

    if (!broadcast || !moment) { skipped++; continue; }

    // Check attempt count on the moment_intent
    const { data: intent } = await supabase
      .from('moment_intents')
      .select('attempts')
      .eq('moment_id', broadcast.moment_id as string)
      .eq('channel', 'whatsapp')
      .single();

    if ((intent?.attempts ?? 0) >= MAX_ATTEMPTS) { skipped++; continue; }

    // Mark batch as processing
    await supabase
      .from('broadcast_batches')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', batch.id);

    // Increment attempt counter
    await supabase
      .from('moment_intents')
      .update({
        attempts: (intent?.attempts ?? 0) + 1,
        last_attempt_at: new Date().toISOString(),
        status: 'processing',
      })
      .eq('moment_id', broadcast.moment_id as string)
      .eq('channel', 'whatsapp');

    // Re-send the batch
    const result = await sendBatch(batch.recipients as string[], moment);

    await supabase
      .from('broadcast_batches')
      .update({
        status: result.failure === (batch.recipients as string[]).length ? 'failed' : 'completed',
        success_count: result.success,
        failure_count: result.failure,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id);

    if (result.failure < (batch.recipients as string[]).length) {
      retried++;
    }
  }

  return json({ retried, skipped, total: failedBatches.length }, 200, cors);
}

async function sendBatch(
  phoneNumbers: string[],
  moment: Record<string, unknown>,
): Promise<{ success: number; failure: number }> {
  const waToken = Deno.env.get('WHATSAPP_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!waToken || !phoneNumberId) {
    return { success: 0, failure: phoneNumbers.length };
  }

  let success = 0;
  let failure = 0;

  await Promise.allSettled(
    phoneNumbers.map(async (phone) => {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${waToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phone,
              type: 'text',
              text: { body: formatMessage(moment) },
            }),
          },
        );
        if (res.ok) success++; else failure++;
      } catch {
        failure++;
      }
    }),
  );

  return { success, failure };
}

function formatMessage(moment: Record<string, unknown>): string {
  const lines = [`*${moment.title}*`, '', String(moment.content)];
  if (moment.is_sponsored) lines.push('', '_Sponsored content_');
  if (moment.pwa_link) lines.push('', `Read more: ${moment.pwa_link}`);
  lines.push('', 'Reply STOP to unsubscribe');
  return lines.join('\n');
}
