import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { logError, checkRateLimit } from '../_shared/auth.ts';

const COMMANDS = {
  OPT_IN:       ['START', 'JOIN', 'SUBSCRIBE', 'YES'],
  OPT_OUT:      ['STOP', 'UNSUBSCRIBE', 'QUIT', 'CANCEL', 'NO'],
  HELP:         ['HELP', 'INFO', 'MENU', '?'],
  STATUS:       ['STATUS', 'SETTINGS', 'MY'],
  MY_AUTHORITY: ['MYAUTHORITY'],
} as const;

// ---------------------------------------------------------------------------
// WhatsApp send helper
// ---------------------------------------------------------------------------

async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  const token = Deno.env.get('WHATSAPP_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  if (!token || !phoneNumberId) return false;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body },
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  // Meta webhook verification (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === Deno.env.get('WEBHOOK_VERIFY_TOKEN')) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Rate limiting — keyed by CF-Connecting-IP or fallback
  const ip = req.headers.get('CF-Connecting-IP') ?? req.headers.get('X-Forwarded-For') ?? 'unknown';
  const supabaseForRateLimit = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const rateLimitResponse = await checkRateLimit(supabaseForRateLimit, ip, '/webhook');
  if (rateLimitResponse) return new Response('OK', { status: 200 }); // Always 200 to Meta

  // HMAC verification
  const rawBody = await req.arrayBuffer();
  const signature = req.headers.get('x-hub-signature-256');
  const secret = Deno.env.get('WEBHOOK_HMAC_SECRET');

  if (!signature || !secret) return new Response('Forbidden', { status: 403 });

  const valid = await verifyHmac(rawBody, signature, secret);
  if (!valid) return new Response('Forbidden', { status: 403 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const payload = JSON.parse(new TextDecoder().decode(rawBody));
    await processWebhook(supabase, payload);
    return new Response('OK', { status: 200 });
  } catch (e) {
    await logError(supabase, 'webhook_function', (e as Error).message, {}, 'high');
    // Always return 200 to Meta — never let errors cause retries
    return new Response('OK', { status: 200 });
  }
});

// ---------------------------------------------------------------------------
// HMAC verification
// ---------------------------------------------------------------------------

async function verifyHmac(body: ArrayBuffer, signature: string, secret: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, body);
    const computed = 'sha256=' + Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return signature === computed;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Webhook payload processing
// ---------------------------------------------------------------------------

async function processWebhook(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
) {
  const entry = (payload.entry as unknown[])?.[0] as Record<string, unknown>;
  const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
  const value = changes?.value as Record<string, unknown>;

  if (!value) return;

  // Process messages
  const messages = value.messages as unknown[] | undefined;
  if (messages) {
    for (const msg of messages) {
      await processMessage(supabase, msg as Record<string, unknown>);
    }
  }

  // Process status updates (delivery receipts) — log only
  const statuses = value.statuses as unknown[] | undefined;
  if (statuses) {
    for (const status of statuses) {
      await processStatusUpdate(supabase, status as Record<string, unknown>);
    }
  }
}

async function processMessage(
  supabase: ReturnType<typeof createClient>,
  msg: Record<string, unknown>,
) {
  const whatsappId = msg.id as string;
  const fromNumber = msg.from as string;
  const messageType = (msg.type as string) ?? 'text';
  const timestamp = new Date(Number(msg.timestamp) * 1000).toISOString();

  // Dedup — skip if already processed
  const { data: existing } = await supabase
    .from('messages')
    .select('id')
    .eq('whatsapp_id', whatsappId)
    .single();

  if (existing) return;

  // Extract content
  const textContent = (msg.text as Record<string, string> | undefined)?.body ?? null;
  const mediaId = (msg[messageType] as Record<string, string> | undefined)?.id ?? null;

  // Insert message record
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      whatsapp_id: whatsappId,
      from_number: fromNumber,
      message_type: messageType,
      content: textContent,
      media_id: mediaId,
      timestamp,
      processed: false,
      moderation_status: 'pending',
    })
    .select()
    .single();

  if (error || !message) return;

  // Lookup authority (fail-open)
  let authority = null;
  try {
    const { data } = await supabase.rpc('lookup_authority', { p_user_identifier: fromNumber });
    authority = data?.[0] ?? null;
  } catch { /* fail-open */ }

  // Route by command or content
  if (textContent) {
    const command = textContent.trim().toUpperCase();
    await routeMessage(supabase, fromNumber, command, textContent, message.id, authority);
  }

  // Mark processed
  await supabase
    .from('messages')
    .update({ processed: true, authority_context: authority })
    .eq('id', message.id);

  // Log analytics
  await supabase.from('analytics_events').insert({
    event_type: 'message_received',
    resource_type: 'message',
    resource_id: message.id,
    metadata: { from_number: fromNumber, message_type: messageType },
  });
}

async function routeMessage(
  supabase: ReturnType<typeof createClient>,
  fromNumber: string,
  command: string,
  rawText: string,
  messageId: string,
  authority: Record<string, unknown> | null,
) {
  if (COMMANDS.OPT_IN.includes(command as never)) {
    await handleOptIn(supabase, fromNumber);
    return;
  }

  if (COMMANDS.OPT_OUT.includes(command as never)) {
    await handleOptOut(supabase, fromNumber);
    return;
  }

  if (COMMANDS.HELP.includes(command as never)) {
    await handleHelp(fromNumber);
    return;
  }

  if (COMMANDS.STATUS.includes(command as never)) {
    await handleStatus(supabase, fromNumber);
    return;
  }

  if (COMMANDS.MY_AUTHORITY.includes(command as never)) {
    await handleMyAuthority(supabase, fromNumber, authority);
    return;
  }

  // Content submission — create advisory for moderation
  await supabase.from('advisories').insert({
    message_id: messageId,
    advisory_type: 'content_quality',
    confidence: 0.5,
    urgency_level: 'low',
    escalation_suggested: false,
    details: { raw_text: rawText, authority_level: authority?.authority_level ?? 1 },
  });
}

async function handleOptIn(supabase: ReturnType<typeof createClient>, fromNumber: string) {
  await supabase
    .from('subscriptions')
    .upsert({
      phone_number: fromNumber,
      opted_in: true,
      opted_out_at: null,
      last_activity: new Date().toISOString(),
      consent_timestamp: new Date().toISOString(),
      consent_method: 'whatsapp_optin',
    }, { onConflict: 'phone_number' });

  await supabase.from('analytics_events').insert({
    event_type: 'subscriber_joined',
    resource_type: 'subscription',
    resource_id: fromNumber,
  });

  await sendWhatsAppMessage(
    fromNumber,
    `✅ *Welcome to Moments!*

You’re now subscribed to community updates for your region.

You’ll receive important notices, opportunities, and community news directly here.

Reply *STOP* at any time to unsubscribe.
Reply *HELP* for the full menu.`,
  );
}

async function handleOptOut(supabase: ReturnType<typeof createClient>, fromNumber: string) {
  await supabase
    .from('subscriptions')
    .update({
      opted_in: false,
      opted_out_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    })
    .eq('phone_number', fromNumber);

  await supabase.from('analytics_events').insert({
    event_type: 'subscriber_left',
    resource_type: 'subscription',
    resource_id: fromNumber,
  });

  await sendWhatsAppMessage(
    fromNumber,
    `You have been unsubscribed from Moments community updates.

You will no longer receive broadcasts.

Reply *START* at any time to resubscribe.`,
  );
}

async function handleHelp(fromNumber: string) {
  await sendWhatsAppMessage(
    fromNumber,
    `*Moments — Community Updates*

Available commands:

• *START* — Subscribe to community updates
• *STOP* — Unsubscribe from all updates
• *STATUS* — View your current subscription settings
• *MYAUTHORITY* — View your community authority level
• *HELP* — Show this menu

You can also send a message to share community news. It will be reviewed before publishing.

Powered by Unami Platform.`,
  );
}

async function handleStatus(supabase: ReturnType<typeof createClient>, fromNumber: string) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('opted_in, regions, categories, language_preference, delivery_schedule, opted_in_at')
    .eq('phone_number', fromNumber)
    .single();

  if (!sub || !sub.opted_in) {
    await sendWhatsAppMessage(
      fromNumber,
      `You are not currently subscribed to Moments.

Reply *START* to subscribe and receive community updates.`,
    );
    return;
  }

  const regions = (sub.regions as string[]).join(', ') || 'National';
  const categories = (sub.categories as string[]).join(', ') || 'All';
  const schedule = (sub.delivery_schedule as string) ?? 'instant';
  const since = sub.opted_in_at
    ? new Date(sub.opted_in_at as string).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Unknown';

  await sendWhatsAppMessage(
    fromNumber,
    `*Your Moments Subscription*

✅ Status: Active
📍 Regions: ${regions}
🏷️ Categories: ${categories}
⏰ Delivery: ${schedule}
📅 Subscribed since: ${since}

Reply *STOP* to unsubscribe.
Reply *HELP* for all commands.`,
  );
}

async function handleMyAuthority(
  supabase: ReturnType<typeof createClient>,
  fromNumber: string,
  authority: Record<string, unknown> | null,
) {
  await supabase.from('analytics_events').insert({
    event_type: 'authority_queried',
    resource_type: 'authority_profile',
    resource_id: fromNumber,
    metadata: { has_authority: !!authority },
  });

  if (!authority) {
    await sendWhatsAppMessage(
      fromNumber,
      `*Your Community Authority*

You are registered as a standard community member.

Authority Level: 1 — Community Member
Scope: Community

Contact your community administrator to request elevated authority status.`,
    );
    return;
  }

  const level = authority.authority_level as number;
  const role = authority.role_label as string;
  const scope = authority.scope as string;
  const scopeId = authority.scope_identifier as string | null;
  const validUntil = authority.valid_until as string | null;

  const scopeDisplay = scopeId ? `${scope} (${scopeId})` : scope;
  const validDisplay = validUntil
    ? new Date(validUntil).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Permanent';

  await sendWhatsAppMessage(
    fromNumber,
    `*Your Community Authority*

🏅 Role: ${role}
🔢 Level: ${level} of 5
🌍 Scope: ${scopeDisplay}
📅 Valid until: ${validDisplay}

Your authority level determines how your community submissions are reviewed and how many people can receive your broadcasts.`,
  );
}

async function processStatusUpdate(
  supabase: ReturnType<typeof createClient>,
  status: Record<string, unknown>,
) {
  // Delivery receipts — log as analytics event only
  await supabase.from('analytics_events').insert({
    event_type: 'message_status_update',
    resource_type: 'message',
    resource_id: status.id as string,
    metadata: { status: status.status, recipient: status.recipient_id },
  });
}
