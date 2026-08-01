import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logAudit, logError, checkRateLimit } from '../_shared/auth.ts';

const BATCH_SIZE = 50;

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  if (req.method !== 'POST') return err('Method not allowed', 405, cors);

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/broadcast\/?/, '').split('/').filter(Boolean);
  // POST /broadcast/:momentId

  if (parts.length !== 1) return err('Not found', 404, cors);
  const momentId = parts[0];

  const auth = await requireAuth(req, ['superadmin', 'content_admin']);
  if (auth instanceof Response) return auth;
  const { context, supabase } = auth;

  const rateLimited = await checkRateLimit(supabase, context.userId, '/broadcast');
  if (rateLimited) return rateLimited;

  try {
    return await executeBroadcast(supabase, momentId, context.userId, cors);
  } catch (e) {
    await logError(supabase, 'broadcast_function', (e as Error).message, { momentId });
    return err('Internal server error', 500, cors);
  }
});

async function executeBroadcast(
  supabase: ReturnType<typeof createClient>,
  momentId: string,
  userId: string,
  cors: Record<string, string>,
) {
  // 1. Load moment
  const { data: moment, error: momentErr } = await supabase
    .from('moments')
    .select('*')
    .eq('id', momentId)
    .single();

  if (momentErr || !moment) return err('Moment not found', 404, cors);
  if (moment.status === 'broadcasted') return err('Moment already broadcasted', 409, cors);
  if (moment.status === 'cancelled') return err('Cannot broadcast a cancelled moment', 409, cors);

  // 2. Resolve authority context (fail-open)
  let authorityContext = null;
  try {
    const { data } = await supabase.rpc('lookup_authority', { p_user_identifier: userId });
    authorityContext = data?.[0] ?? null;
  } catch {
    // fail-open — authority errors never block broadcast
  }

  const blastRadius: number = authorityContext?.blast_radius ?? 10000;

  // 3. Fetch matching subscribers
  const { data: subscribers, error: subErr } = await supabase
    .from('subscriptions')
    .select('phone_number')
    .eq('opted_in', true)
    .is('paused_until', null)
    .contains('regions', [moment.region === 'National' ? moment.region : moment.region])
    .contains('categories', [moment.category])
    .limit(blastRadius);

  if (subErr) return err(subErr.message, 500, cors);

  const phoneNumbers = (subscribers ?? []).map((s: { phone_number: string }) => s.phone_number);
  const recipientCount = phoneNumbers.length;

  // 4. Create broadcast record
  const { data: broadcast, error: broadcastErr } = await supabase
    .from('broadcasts')
    .insert({
      moment_id: momentId,
      recipient_count: recipientCount,
      status: 'processing',
      authority_context: authorityContext,
    })
    .select()
    .single();

  if (broadcastErr) return err(broadcastErr.message, 500, cors);

  // 5. Create batches
  const batches: string[][] = [];
  for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
    batches.push(phoneNumbers.slice(i, i + BATCH_SIZE));
  }

  const batchInserts = batches.map((recipients, i) => ({
    broadcast_id: broadcast.id,
    batch_number: i + 1,
    recipients,
    status: 'pending',
  }));

  if (batchInserts.length > 0) {
    await supabase.from('broadcast_batches').insert(batchInserts);
  }

  // 6. Create moment_intent for whatsapp channel
  await supabase
    .from('moment_intents')
    .upsert({
      moment_id: momentId,
      channel: 'whatsapp',
      action: 'publish',
      status: 'processing',
      payload: {
        title: moment.title,
        full_text: moment.content,
        region: moment.region,
        pwa_link: moment.pwa_link,
      },
    }, { onConflict: 'moment_id,channel' });

  // 7. Send batches via Meta API
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchResult = await sendBatch(batch, moment);

    successCount += batchResult.success;
    failureCount += batchResult.failure;

    await supabase
      .from('broadcast_batches')
      .update({
        status: batchResult.failure === batch.length ? 'failed' : 'completed',
        success_count: batchResult.success,
        failure_count: batchResult.failure,
        started_at: batchResult.startedAt,
        completed_at: new Date().toISOString(),
      })
      .eq('broadcast_id', broadcast.id)
      .eq('batch_number', i + 1);
  }

  // 8. Finalise broadcast
  const broadcastStatus = failureCount === recipientCount && recipientCount > 0 ? 'failed' : 'completed';

  await supabase
    .from('broadcasts')
    .update({
      status: broadcastStatus,
      success_count: successCount,
      failure_count: failureCount,
      broadcast_completed_at: new Date().toISOString(),
    })
    .eq('id', broadcast.id);

  // 9. Update moment status
  await supabase
    .from('moments')
    .update({ status: 'broadcasted', broadcasted_at: new Date().toISOString() })
    .eq('id', momentId);

  // 10. Update intent status
  await supabase
    .from('moment_intents')
    .update({ status: broadcastStatus === 'completed' ? 'sent' : 'failed' })
    .eq('moment_id', momentId)
    .eq('channel', 'whatsapp');

  // 11. Record marketing compliance
  await supabase.from('marketing_compliance').insert({
    moment_id: momentId,
    broadcast_id: broadcast.id,
    sponsor_disclosed: moment.is_sponsored,
    opt_out_included: true,
    pwa_link_included: !!moment.pwa_link,
    compliance_score: calculateComplianceScore(moment),
  });

  // 12. Log analytics event
  await supabase.from('analytics_events').insert({
    event_type: 'broadcast_sent',
    resource_type: 'broadcast',
    resource_id: broadcast.id,
    metadata: { moment_id: momentId, recipient_count: recipientCount, success_count: successCount },
  });

  await logAudit(supabase, userId, 'broadcast', 'moment', momentId, {
    broadcast_id: broadcast.id,
    recipient_count: recipientCount,
    success_count: successCount,
  });

  return json({
    broadcastId: broadcast.id,
    recipientCount,
    successCount,
    failureCount,
    status: broadcastStatus,
  }, 200, cors);
}

// ---------------------------------------------------------------------------
// Meta API send (stub — replace with real Meta Cloud API call)
// ---------------------------------------------------------------------------

async function sendBatch(
  phoneNumbers: string[],
  moment: Record<string, unknown>,
): Promise<{ success: number; failure: number; startedAt: string }> {
  const startedAt = new Date().toISOString();
  const waToken = Deno.env.get('WHATSAPP_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!waToken || !phoneNumberId) {
    // No credentials configured — treat as failure in production, success in dev
    const isDev = Deno.env.get('ENVIRONMENT') === 'development';
    return { success: isDev ? phoneNumbers.length : 0, failure: isDev ? 0 : phoneNumbers.length, startedAt };
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

  return { success, failure, startedAt };
}

function formatMessage(moment: Record<string, unknown>): string {
  const lines = [
    `*${moment.title}*`,
    '',
    String(moment.content),
  ];
  if (moment.is_sponsored) lines.push('', `_Sponsored content_`);
  if (moment.pwa_link) lines.push('', `Read more: ${moment.pwa_link}`);
  lines.push('', 'Reply STOP to unsubscribe');
  return lines.join('\n');
}

function calculateComplianceScore(moment: Record<string, unknown>): number {
  let score = 60; // base
  if (moment.pwa_link) score += 15;
  if (!moment.is_sponsored) score += 15; // non-sponsored = lower risk
  if (moment.urgency_level === 'low') score += 10;
  return Math.min(score, 100);
}
