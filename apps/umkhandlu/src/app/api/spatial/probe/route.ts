import { NextResponse } from 'next/server';
import { getOperatorSession } from '@/lib/auth/operator';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getOperatorSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const baseUrl = url.searchParams.get('url');
  const sourceType = url.searchParams.get('type') ?? '';

  if (!baseUrl) return NextResponse.json({ error: 'url parameter required' }, { status: 400 });

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}?f=json`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'User-Agent': 'UnamiControlCentre/1.0' },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json({
        reachable: false,
        responseMs: Date.now() - start,
        error: `HTTP ${res.status}`,
      });
    }

    const data = await res.json() as Record<string, unknown>;

    if (data.error) {
      const err = data.error as Record<string, unknown>;
      return NextResponse.json({
        reachable: false,
        responseMs: Date.now() - start,
        error: `Service error ${err.code}: ${err.message}`,
      });
    }

    const layers = (data.layers as unknown[]) ?? [];
    const tables = (data.tables as unknown[]) ?? [];

    // For FeatureServer with layers, attempt a sample query on layer 0
    let sampleFeatureCount: number | undefined;
    if (sourceType === 'arcgis-featureserver' && layers.length > 0) {
      try {
        const firstLayer = layers[0] as Record<string, unknown>;
        const layerId = firstLayer.id as number;
        const queryUrl = `${baseUrl.replace(/\/$/, '')}/${layerId}/query?where=1=1&returnCountOnly=true&f=json`;
        const qRes = await fetch(queryUrl, {
          cache: 'no-store',
          headers: { 'User-Agent': 'UnamiControlCentre/1.0' },
          signal: AbortSignal.timeout(8_000),
        });
        if (qRes.ok) {
          const qData = await qRes.json() as Record<string, unknown>;
          if (typeof qData.count === 'number') {
            sampleFeatureCount = qData.count;
          }
        }
      } catch {
        // Sample query failed — service is still reachable
      }
    }

    return NextResponse.json({
      reachable: true,
      responseMs: Date.now() - start,
      layerCount: layers.length + tables.length,
      sampleFeatureCount,
      serviceType: sourceType.includes('Feature') ? 'FeatureServer' : sourceType.includes('Map') ? 'MapServer' : sourceType,
    });
  } catch (e) {
    return NextResponse.json({
      reachable: false,
      responseMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
