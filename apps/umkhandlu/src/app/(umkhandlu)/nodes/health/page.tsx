import { PageHeader } from '@unami/ui';
import { getAllNodes } from '@/lib/nodes/fetcher';
import { getNodeClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, WifiOff, FileText, Bell, Cpu } from 'lucide-react';
import type { NodeHealth } from '@unami/api';

const STATUS_ICON = {
  healthy:     <CheckCircle2 className="h-4 w-4 text-green-500" />,
  degraded:    <AlertTriangle className="h-4 w-4 text-amber-500" />,
  unreachable: <WifiOff className="h-4 w-4 text-destructive" />,
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  healthy:     'default',
  degraded:    'secondary',
  unreachable: 'destructive',
};

async function safeHealth(url: string, apiKey: string): Promise<NodeHealth | null> {
  try { return await getNodeClient(url, apiKey).health(); } catch { return null; }
}

export default async function NodeHealthPage() {
  const nodes = await getAllNodes();
  const active = nodes.filter((n) => n.active);
  const results = await Promise.all(
    active.map(async (node) => ({ node, health: await safeHealth(node.url, node.api_key) })),
  );

  const healthy     = results.filter((r) => r.health?.status === 'healthy').length;
  const degraded    = results.filter((r) => r.health?.status === 'degraded').length;
  const unreachable = results.filter((r) => !r.health || r.health.status === 'unreachable').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Node Health"
        description="Live health status for all registered governance nodes"
      />

      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        {[
          { label: 'Healthy',     value: healthy,     icon: CheckCircle2, cls: 'text-green-600' },
          { label: 'Degraded',    value: degraded,    icon: AlertTriangle, cls: 'text-amber-500' },
          { label: 'Unreachable', value: unreachable, icon: WifiOff,       cls: 'text-destructive' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-3.5 w-3.5 ${cls}`} />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-3xl space-y-4">
        {results.map(({ node, health }) => (
          <Card key={node.id}>
            <CardHeader className="border-b pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{node.name}</CardTitle>
                  <CardDescription className="mt-0.5">{node.authority}</CardDescription>
                </div>
                <Badge variant={STATUS_VARIANT[health?.status ?? 'unreachable']}>
                  {health?.status ?? 'unreachable'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {health ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Status</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      {STATUS_ICON[health.status]}
                      <span className="capitalize">{health.status}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Records</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {health.recordCount}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Notices</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                      {health.noticeCount}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Version</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                      {health.version}
                    </div>
                  </div>
                  {health.lastUpdated && (
                    <div className="col-span-2 sm:col-span-4 pt-1 border-t">
                      <p className="text-xs text-muted-foreground">
                        Last updated {new Date(health.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <WifiOff className="h-4 w-4" />
                  Node did not respond
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
