import { type NextRequest, NextResponse } from 'next/server';
import { getOperatorSession } from '@/lib/auth/operator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getOperatorSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_UMKHANDLU_SUPABASE_URL;
  const serviceKey  = process.env.UMKHANDLU_SUPABASE_SERVICE_ROLE_KEY;
  const schedulerSecret = process.env.SPATIAL_SCHEDULER_SECRET;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Scheduler not configured' }, { status: 503 });
  }

  const pipeline = request.nextUrl.searchParams.get('pipeline') ?? 'all';
  const edgeFnUrl = `${supabaseUrl}/functions/v1/spatial-scheduler?pipeline=${pipeline}`;

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    };
    if (schedulerSecret) headers['x-scheduler-secret'] = schedulerSecret;

    const res = await fetch(edgeFnUrl, { method: 'POST', headers });
    const data = await res.json();
    return NextResponse.json({ status: res.status, ...data });
  } catch (e) {
    return NextResponse.json(
      { error: 'Scheduler invocation failed', detail: String(e) },
      { status: 500 },
    );
  }
}
