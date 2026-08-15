import { createClient } from 'jsr:@supabase/supabase-js@2';

const VALID_RESPONSE_TYPES = ['comment', 'support', 'objection', 'question'] as const;
const VALID_RELATIONSHIPS = ['resident', 'landowner', 'business', 'community', 'organisation', 'other'] as const;

// Phase 20 will add a node_id column to governance_nodes.
// Until then, validate against the known canonical node identifiers.
const KNOWN_NODE_IDS = ['umkhandlu-khathide-001'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://umkhandlu.unamifoundation.org',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return json(null, 204);
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // 1. POPIA consent
  if (body.popiaConsent !== true) {
    return json({ error: 'POPIA consent is required' }, 400);
  }

  // 2. Required fields
  const node_id = body.node_id as string;
  const sanity_id = body.sanity_id as string;
  const sanity_type = body.sanity_type as string;
  const response_type = body.response_type as string;
  const relationship = body.relationship as string;

  if (!node_id || !sanity_id || !sanity_type || !response_type || !relationship) {
    return json({ error: 'Missing required fields: node_id, sanity_id, sanity_type, response_type, relationship' }, 400);
  }

  // 3. Enum validation
  if (!(VALID_RESPONSE_TYPES as readonly string[]).includes(response_type)) {
    return json({ error: `Invalid response_type. Must be one of: ${VALID_RESPONSE_TYPES.join(', ')}` }, 400);
  }

  if (!(VALID_RELATIONSHIPS as readonly string[]).includes(relationship)) {
    return json({ error: `Invalid relationship. Must be one of: ${VALID_RELATIONSHIPS.join(', ')}` }, 400);
  }

  // 4. node_id validation against known registry
  if (!KNOWN_NODE_IDS.includes(node_id)) {
    return json({ error: 'Unknown node_id' }, 400);
  }

  // 5. Service-role client — bypasses RLS
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 6. Confirm node is active in governance_nodes
  const { data: nodeRow, error: nodeError } = await supabase
    .from('governance_nodes')
    .select('id')
    .eq('active', true)
    .limit(1)
    .maybeSingle();

  if (nodeError || !nodeRow) {
    return json({ error: 'Unknown or inactive node_id' }, 400);
  }

  // 7. Persist anonymised event — NO PII
  const submitted_at = new Date().toISOString();

  const { error: logError } = await supabase
    .from('participation_log')
    .insert({ node_id, sanity_id, sanity_type, response_type, relationship, popia_consent: true, submitted_at });

  if (logError) {
    console.error('[governance-participation] log insert failed:', logError.message);
    return json({ error: 'Database error' }, 500);
  }

  // 8. Upsert participation signal
  const { data: existing } = await supabase
    .from('participation_signals')
    .select('response_count, by_type, by_relationship')
    .eq('node_id', node_id)
    .eq('sanity_id', sanity_id)
    .maybeSingle();

  const prev_by_type = (existing?.by_type as Record<string, number>) ?? { comment: 0, support: 0, objection: 0, question: 0 };
  const prev_by_rel = (existing?.by_relationship as Record<string, number>) ?? { resident: 0, landowner: 0, business: 0, community: 0, organisation: 0, other: 0 };

  const { error: signalError } = await supabase
    .from('participation_signals')
    .upsert({
      node_id,
      sanity_id,
      sanity_type,
      response_count: (existing?.response_count ?? 0) + 1,
      by_type: { ...prev_by_type, [response_type]: (prev_by_type[response_type] ?? 0) + 1 },
      by_relationship: { ...prev_by_rel, [relationship]: (prev_by_rel[relationship] ?? 0) + 1 },
      last_submission: submitted_at,
      computed_at: submitted_at,
    }, { onConflict: 'node_id,sanity_id' });

  if (signalError) {
    console.error('[governance-participation] signal upsert failed:', signalError.message);
    return json({ error: 'Database error' }, 500);
  }

  return json({ success: true }, 201);
});

function json(body: unknown, status: number): Response {
  return new Response(body === null ? '' : JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
