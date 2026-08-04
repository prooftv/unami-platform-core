import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3';
import { corsHeaders, json, err, logError, checkRateLimit } from '../_shared/auth.ts';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const SubmitSchema = z.object({
  momentId:     z.string().uuid(),
  name:         z.string().min(2).max(100),
  contact:      z.string().min(3).max(200),
  responseType: z.enum(['comment', 'support', 'concern', 'question']),
  relationship: z.enum(['resident', 'business', 'community', 'organisation', 'other']),
  comment:      z.string().min(10).max(2000),
  popiaConsent: z.literal(true),
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return err('Method not allowed', 405, cors);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // Rate limit by IP
    const ip = req.headers.get('CF-Connecting-IP') ?? req.headers.get('X-Forwarded-For') ?? 'unknown';
    const rateLimited = await checkRateLimit(supabase, ip, '/participation');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: 'Validation failed', details: parsed.error.flatten() }, 400, cors);
    }

    const { momentId, name, contact, responseType, relationship, comment, popiaConsent } = parsed.data;

    // Fetch moment — must be broadcasted, participation_enabled, and within deadline
    const { data: moment, error: momentError } = await supabase
      .from('moments')
      .select('id, title, moment_type, participation_enabled, participation_deadline, status')
      .eq('id', momentId)
      .single();

    if (momentError || !moment) return err('Moment not found', 404, cors);
    if (moment.status !== 'broadcasted') return err('Moment is not published', 422, cors);
    if (!moment.participation_enabled) return err('Participation is not enabled for this moment', 422, cors);
    if (moment.moment_type !== 'consultation') return err('Participation is only available on consultation moments', 422, cors);

    // Server-side deadline enforcement
    if (moment.participation_deadline && new Date(moment.participation_deadline) < new Date()) {
      return err('The participation window for this moment has closed', 422, cors);
    }

    // Log anonymised entry — no personal data
    const { data: logEntry, error: logError_ } = await supabase
      .from('participation_log')
      .insert({
        moment_id:     momentId,
        response_type: responseType,
        relationship,
        popia_consent: popiaConsent,
      })
      .select('id')
      .single();

    if (logError_ || !logEntry) {
      await logError(supabase, 'participation_function', logError_?.message ?? 'Log insert failed', { momentId });
      return err('Failed to record participation', 500, cors);
    }

    // Increment participation_count on moment_stats
    await supabase.rpc('increment_participation_count', { p_moment_id: momentId });

    // Deliver webhook — personal data lives here only, never in DB
    const { data: webhookSetting } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'participation_webhook_url')
      .single();

    const webhookUrl = webhookSetting?.setting_value;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'participation',
            timestamp: new Date().toISOString(),
            momentId,
            momentTitle: moment.title,
            name,
            contact,
            responseType,
            relationship,
            comment,
            popiaConsent: true,
          }),
        });
      } catch (webhookErr) {
        // Webhook failure is non-fatal — log it but do not fail the submission
        await logError(supabase, 'participation_webhook', (webhookErr as Error).message, { momentId, webhookUrl });
      }
    }

    return json({ success: true, logId: logEntry.id }, 201, cors);
  } catch (e) {
    await logError(supabase, 'participation_function', (e as Error).message, { url: req.url });
    return err('Internal server error', 500, cors);
  }
});
