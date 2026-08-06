import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAuth, corsHeaders, json, err, logAudit, logError, checkRateLimit } from '../_shared/auth.ts';

const BATCH_SIZE = 50;

// Region short code → full display name
const REGION_NAMES: Record<string, string> = {
  KZN:      'KwaZulu-Natal',
  WC:       'Western Cape',
  GP:       'Gauteng',
  EC:       'Eastern Cape',
  FS:       'Free State',
  LP:       'Limpopo',
  MP:       'Mpumalanga',
  NC:       'Northern Cape',
  NW:       'North West',
  National: 'South Africa',
};

// Sponsor tier → emoji prefix for sponsored template header
const TIER_EMOJI: Record<string, string> = {
  platinum: '👑',
  gold:     '⭐',
  silver:   '📢',
  bronze:   '📢',
};

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  if (req.method !== 'POST') return err('Method not allowed', 405, cors);

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/broadcast\/?/, '').split('/').filter(Boolean);

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
  // 1. Load moment — join sponsor if sponsored
  const { data: moment, error: momentErr } = await supabase
    .from('moments')
    .select('*, sponsors(id, display_name, tier)')
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
  // National = all opted-in subscribers (no region filter)
  // Province  = subscribers whose regions array contains the moment region
  let query = supabase
    .from('subscriptions')
    .select('phone_number')
    .eq('opted_in', true)
    .is('paused_until', null)
    .contains('categories', [moment.category])
    .limit(blastRadius);

  if (moment.region !== 'National') {
    query = query.contains('regions', [moment.region]);
  }

  const { data: subscribers, error: subErr } = await query;
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
    const batchResult = await sendBatch(supabase, batch, moment, broadcast.id);

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
// Meta API send — MARKETING templates only, no freeform fallback
// ---------------------------------------------------------------------------

async function sendBatch(
  supabase: ReturnType<typeof createClient>,
  phoneNumbers: string[],
  moment: Record<string, unknown>,
  broadcastId: string,
): Promise<{ success: number; failure: number; startedAt: string }> {
  const startedAt = new Date().toISOString();
  const waToken = Deno.env.get('WHATSAPP_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!waToken || !phoneNumberId) {
    // Credentials not set — fail all in non-dev, succeed all in dev
    const isDev = Deno.env.get('ENVIRONMENT') === 'development';
    return { success: isDev ? phoneNumbers.length : 0, failure: isDev ? 0 : phoneNumbers.length, startedAt };
  }

  const sponsor = moment.is_sponsored
    ? (moment.sponsors as Record<string, string> | null)
    : null;

  let success = 0;
  let failure = 0;

  await Promise.allSettled(
    phoneNumbers.map(async (phone) => {
      const { payload, templateName, variables } = moment.is_sponsored && sponsor
        ? buildSponsoredTemplatePayload(phone, moment, sponsor)
        : buildMomentBroadcastPayload(phone, moment);

      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );

        const responseBody = await res.json().catch(() => ({}));
        const metaMessageId = (responseBody as Record<string, unknown>)?.messages?.[0]?.id as string | undefined;

        if (res.ok) {
          success++;
          await supabase.from('template_messages').insert({
            broadcast_id: broadcastId,
            moment_id: moment.id as string,
            template_name: templateName,
            phone_number: phone,
            variables,
            meta_message_id: metaMessageId ?? null,
            status: 'sent',
          });
        } else {
          failure++;
          const errorBody = responseBody as Record<string, unknown>;
          await supabase.from('template_messages').insert({
            broadcast_id: broadcastId,
            moment_id: moment.id as string,
            template_name: templateName,
            phone_number: phone,
            variables,
            status: 'failed',
            error_code: String((errorBody?.error as Record<string, unknown>)?.code ?? ''),
            error_message: String((errorBody?.error as Record<string, unknown>)?.message ?? ''),
          });
        }
      } catch {
        failure++;
        await supabase.from('template_messages').insert({
          broadcast_id: broadcastId,
          moment_id: moment.id as string,
          template_name: templateName,
          phone_number: phone,
          variables,
          status: 'failed',
          error_message: 'Network error',
        });
      }
    }),
  );

  return { success, failure, startedAt };
}

// ---------------------------------------------------------------------------
// Template payload builders
// ---------------------------------------------------------------------------

function buildMomentBroadcastPayload(
  to: string,
  moment: Record<string, unknown>,
): { payload: Record<string, unknown>; templateName: string; variables: Record<string, string> } {
  const region = String(moment.region ?? '');
  const regionFull = REGION_NAMES[region] ?? region;
  const headerText = `📢 Moment — ${region}`;
  const title = String(moment.title ?? '');
  const content = String(moment.content ?? '').slice(0, 160);
  const category = String(moment.category ?? '');

  const variables = { '1': '📢', '2': region, '3': title, '4': content, '5': category, '6': regionFull };

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'moment_broadcast',
      language: { code: mapLanguageCode(moment.language as string) },
      components: [
        {
          type: 'header',
          parameters: [{ type: 'text', text: headerText }],
        },
        {
          type: 'body',
          parameters: [
            { type: 'text', text: title },
            { type: 'text', text: content },
            { type: 'text', text: category },
            { type: 'text', text: regionFull },
          ],
        },
      ],
    },
  };

  return { payload, templateName: 'moment_broadcast', variables };
}

function buildSponsoredTemplatePayload(
  to: string,
  moment: Record<string, unknown>,
  sponsor: Record<string, string>,
): { payload: Record<string, unknown>; templateName: string; variables: Record<string, string> } {
  const region = String(moment.region ?? '');
  const regionFull = REGION_NAMES[region] ?? region;
  const tierEmoji = TIER_EMOJI[sponsor.tier ?? 'bronze'] ?? '📢';
  const headerText = `${tierEmoji} [Sponsored] Moment — ${region}`;
  const title = String(moment.title ?? '');
  const content = String(moment.content ?? '').slice(0, 160);
  const category = String(moment.category ?? '');
  const sponsorName = sponsor.display_name ?? '';
  const utmLink = buildUtmLink(moment);

  const variables = {
    '1': tierEmoji, '2': region, '3': title, '4': content,
    '5': category, '6': regionFull, '7': sponsorName, '8': utmLink,
  };

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'sponsored_moment',
      language: { code: mapLanguageCode(moment.language as string) },
      components: [
        {
          type: 'header',
          parameters: [{ type: 'text', text: headerText }],
        },
        {
          type: 'body',
          parameters: [
            { type: 'text', text: title },
            { type: 'text', text: content },
            { type: 'text', text: category },
            { type: 'text', text: regionFull },
            { type: 'text', text: sponsorName },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 0,
          parameters: [{ type: 'text', text: utmLink }],
        },
      ],
    },
  };

  return { payload, templateName: 'sponsored_moment', variables };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapLanguageCode(lang: string): string {
  const map: Record<string, string> = { eng: 'en', zul: 'zu', xho: 'xh', afr: 'af' };
  return map[lang] ?? 'en';
}

function buildUtmLink(moment: Record<string, unknown>): string {
  const base = moment.pwa_link
    ? String(moment.pwa_link)
    : `https://moments.unamifoundation.org/moment/${moment.id}`;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}utm_source=whatsapp&utm_medium=sponsored&utm_campaign=${moment.id}`;
}

function calculateComplianceScore(moment: Record<string, unknown>): number {
  let score = 60;
  if (moment.pwa_link) score += 15;
  if (!moment.is_sponsored) score += 15;
  if (moment.urgency_level === 'low') score += 10;
  return Math.min(score, 100);
}
