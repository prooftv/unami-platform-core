import { PageHeader } from '@unami/ui';
import { getAllNodes } from '@/lib/nodes/fetcher';
import { getNodeClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, WifiOff, Server, Clock } from 'lucide-react';
import type { NodeHealth } from '@unami/api';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  healthy:     'default',
  degraded:    'secondary',
  unreachable: 'destructive',
};

async function timedHealth(url: string, apiKey: string): Promise<{ health: NodeHealth | null; ms: number }> {
  const start = Date.now();
  try {
    const health = await getNodeClient(url, apiKey).health();
    return { health, ms: Date.now() - start };
  } catch {
    return { health: null, ms: Date.now() - start };
  }
}

export default async function PlatformHealthPage() {
  const nodes = await getAllNodes();
  const active = nodes.filter((n) => n.active);

  const results = await Promise.all(
    active.map(async (node) => {
      const { health, ms } = await timedHealth(node.url, node.api_key);
      return { node, health, ms };
    }),
  );

  const allHealthy = results.every((r) => r.health?.status === 'healthy');
  const anyUnreachable = results.some((r) => !r.health || r.health.status === 'unreachable');

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Health"
        description="Live connectivity and response times for all registered governance nodes"
      />

      {/* Overall status banner */}
      <div className="max-w-3xl">
        {allHealthy ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              All {active.length} node{active.length !== 1 ? 's' : ''} healthy
            </span>
          </div>
        ) : anyUnreachable ? (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3">
            <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-sm font-medium text-red-800 dark:text-red-300">
              One or more nodes unreachable
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              One or more nodes degraded
            </span>
          </div>
        )}
      </div>

      <div className="max-w-3xl space-y-4">
        {results.map(({ node, health, ms }) => (
          <Card key={node.id}>
            <CardHeader className="border-b pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    {node.name}
                  </CardTitle>
                  <CardDescription className="mt-0.5 font-mono text-xs">{node.url}</CardDescription>
                </div>
                <Badge variant={STATUS_VARIANT[health?.status ?? 'unreachable']}>
                  {health?.status ?? 'unreachable'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Response Time</p>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {ms}ms
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Contract</p>
                  <p className="text-sm">v{node.contract_version}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Node Version</p>
                  <p className="text-sm">{health?.version ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Capabilities</p>
                  <p className="text-sm">{node.capabilities.length}</p>
                </div>
              </div>
              {health?.lastUpdated && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                  Node last updated {new Date(health.lastUpdated).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
