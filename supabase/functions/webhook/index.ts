import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logError } from '../_shared/auth.ts';

const COMMANDS = {
  OPT_IN:    ['START', 'JOIN', 'SUBSCRIBE'],
  OPT_OUT:   ['STOP', 'UNSUBSCRIBE', 'QUIT', 'CANCEL'],
  HELP:      ['HELP', 'INFO', 'MENU', '?'],
  STATUS:    ['STATUS', 'SETTINGS'],
  MY_AUTHORITY: ['MYAUTHORITY'],
} as const;

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

  if (COMMANDS.MY_AUTHORITY.includes(command as never)) {
    await handleMyAuthority(supabase, fromNumber, authority);
    return;
  }

  if (COMMANDS.HELP.includes(command as never) || COMMANDS.STATUS.includes(command as never)) {
    // Handled by n8n workflow — no DB action needed
    return;
  }

  // Content submission — create advisory for moderation
  await supabase.from('advisories').insert({
    message_id: messageId,
    advisory_type: 'content_quality',
    confidence: 0.5, // placeholder — real MCP analysis via n8n
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
}

async function handleMyAuthority(
  supabase: ReturnType<typeof createClient>,
  fromNumber: string,
  authority: Record<string, unknown> | null,
) {
  // Response is sent via n8n workflow — we just log the request
  await supabase.from('analytics_events').insert({
    event_type: 'authority_queried',
    resource_type: 'authority_profile',
    resource_id: fromNumber,
    metadata: { has_authority: !!authority },
  });
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
