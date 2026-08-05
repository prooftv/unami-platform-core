import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { getAllNodes } from '@/lib/nodes/fetcher';
import { getOperatorSession, isSuperAdmin } from '@/lib/auth/operator';
import { getNodeClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Cpu, CheckCircle2, AlertTriangle, WifiOff, ExternalLink } from 'lucide-react';
import { NodeActions } from './_components/NodeActions';
import { AddNodeForm } from './_components/AddNodeForm';
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
  try {
    return await getNodeClient(url, apiKey).health();
  } catch {
    return null;
  }
}

export default async function NodesPage() {
  const session = await getOperatorSession();
  const isAdmin = isSuperAdmin(session);
  const nodes = await getAllNodes();

  const nodesWithHealth = await Promise.all(
    nodes.map(async (node) => ({
      node,
      health: node.active ? await safeHealth(node.url, node.api_key) : null,
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registered Nodes"
        description="Governance nodes connected to the Control Centre"
        actions={isAdmin ? <AddNodeForm /> : undefined}
      />

      <div className="max-w-3xl space-y-4">
        {nodesWithHealth.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <WifiOff className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No nodes registered</p>
              {isAdmin && (
                <p className="text-xs text-muted-foreground">Use the Register Node button above to add the first governance node.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          nodesWithHealth.map(({ node, health }) => (
            <Card key={node.id} className={!node.active ? 'opacity-60' : undefined}>
              <CardHeader className="border-b pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{node.name}</CardTitle>
                    <CardDescription className="mt-0.5">{node.authority}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!node.active && <Badge variant="outline">Inactive</Badge>}
                    {node.active && (
                      <Badge variant={STATUS_VARIANT[health?.status ?? 'unreachable']}>
                        {health?.status ?? 'unreachable'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {node.location && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Location</p>
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {node.location}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Contract Version</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      v{node.contract_version}
                    </div>
                  </div>
                  {health && (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Records</p>
                        <div className="flex items-center gap-1.5 text-sm">
                          {STATUS_ICON[health.status]}
                          {health.recordCount} records
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Notices</p>
                        <p className="text-sm">{health.noticeCount} notices</p>
                      </div>
                    </>
                  )}
                </div>

                {node.capabilities.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Capabilities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {node.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline" className="text-xs">{cap}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">URL</p>
                  <p className="text-xs font-mono text-muted-foreground">{node.url}</p>
                </div>

                {node.notes && (
                  <p className="text-xs text-muted-foreground">{node.notes}</p>
                )}

                {health?.lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated {new Date(health.lastUpdated).toLocaleString()}
                  </p>
                )}

                {isAdmin && (
                  <div className="pt-1 border-t flex items-center justify-between">
                    <Link
                      href={`/nodes/${node.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View profile
                    </Link>
                    <NodeActions id={node.id} active={node.active} />
                  </div>
                )}
                {!isAdmin && (
                  <div className="pt-1 border-t">
                    <Link
                      href={`/nodes/${node.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View profile
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
