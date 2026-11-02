import { type NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getNodeClient } from '@/lib/api/client';
import { getRegisteredNodes } from '@/lib/nodes/fetcher';

export const dynamic = 'force-dynamic';

// Shared secret for cron authentication.
// Set POLL_NODES_SECRET in Vercel environment variables.
// Vercel cron calls: GET /api/poll-nodes with Authorization: Bearer <secret>
function authenticate(request: NextRequest): boolean {
  const secret = process.env.POLL_NODES_SECRET;
  if (!secret) return false; // secret not configured — deny all
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return token === secret;
}

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!authenticate(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const nodes = await getRegisteredNodes();
  if (nodes.length === 0) {
    return NextResponse.json({ polled: 0, message: 'No active nodes.' });
  }

  const supabase = createServiceClient();
  const results: { nodeId: string; name: string; status: 'ok' | 'error' }[] = [];

  await Promise.all(
    nodes.map(async (node) => {
      const client = getNodeClient(node.url, node.api_key);

      const [health, records, notices, commercial, participation, evidence, tcrs, lineage] =
        await Promise.all([
          safe(() => client.health()),
          safe(() => client.recordsSummary()),
          safe(() => client.noticesSummary()),
          safe(() => client.commercialSummary()),
          safe(() => client.participationSummary()),
          safe(() => client.evidenceSummary()),
          safe(() => client.tcrsSummary()),
          safe(() => client.lineageSummary()),
        ]);

      const { error } = await supabase.from('node_snapshots').insert({
        node_id: node.id,
        captured_at: new Date().toISOString(),
        health,
        records,
        notices,
        commercial,
        participation,
        evidence,
        tcrs,
        lineage,
      });

      results.push({
        nodeId: node.id,
        name: node.name,
        status: error ? 'error' : 'ok',
      });
    }),
  );

  return NextResponse.json({
    polled: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
