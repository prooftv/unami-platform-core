import { type NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED_RESPONSE_TYPES = new Set(['comment', 'objection', 'support', 'question']);
const ALLOWED_RELATIONSHIPS = new Set(['resident', 'landowner', 'business', 'community', 'organisation', 'other', '']);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;

    const { node_id, sanity_id, sanity_type, response_type, relationship, popiaConsent } = body;

    if (!node_id || typeof node_id !== 'string') {
      return NextResponse.json({ error: 'node_id required' }, { status: 400 });
    }
    if (!sanity_id || typeof sanity_id !== 'string') {
      return NextResponse.json({ error: 'sanity_id required' }, { status: 400 });
    }
    if (!response_type || !ALLOWED_RESPONSE_TYPES.has(response_type as string)) {
      return NextResponse.json({ error: 'Invalid response_type' }, { status: 400 });
    }
    if (relationship !== undefined && !ALLOWED_RELATIONSHIPS.has(relationship as string)) {
      return NextResponse.json({ error: 'Invalid relationship' }, { status: 400 });
    }
    if (popiaConsent !== true) {
      return NextResponse.json({ error: 'POPIA consent required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from('node_participation_log').insert({
      node_id,
      sanity_id,
      sanity_type: sanity_type ?? 'notice',
      response_type,
      relationship: relationship ?? '',
      popia_consent: true,
    });

    if (error) {
      console.error('[node-participation] DB insert failed:', error.message);
      return NextResponse.json({ error: 'Failed to log participation' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error('[node-participation] Unexpected error:', (e as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
