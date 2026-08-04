'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Network, Activity, Globe, ShieldCheck } from 'lucide-react';
import type { NodeHealth, GovernanceNodeIdentity } from '@unami/api';

// ── Node Status Banner ────────────────────────────────────────────────────────

type BannerState = 'operational' | 'degraded' | 'attention';

function deriveBannerState(nodes: NodeWithHealth[]): { state: BannerState; items: string[] } {
  const items: string[] = [];
  const unreachable = nodes.filter((n) => n.health?.status === 'unreachable');
  const degraded    = nodes.filter((n) => n.health?.status === 'degraded');

  if (unreachable.length > 0)
    items.push(`${unreachable.length} node${unreachable.length > 1 ? 's' : ''} unreachable`);
  if (degraded.length > 0)
    items.push(`${degraded.length} node${degraded.length > 1 ? 's' : ''} degraded`);

  const state: BannerState =
    nodes.length === 0 ? 'degraded' :
    items.length > 0   ? 'attention' :
    'operational';

  return { state, items };
}

export type NodeWithHealth = {
  identity: GovernanceNodeIdentity;
  health: NodeHealth | null;
};

export function NodeStatusBanner({ nodes }: { nodes: NodeWithHealth[] }) {
  const { state, items } = deriveBannerState(nodes);

  if (state === 'operational') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
        <span className="text-sm font-medium text-green-800 dark:text-green-300">
          All {nodes.length} node{nodes.length !== 1 ? 's' : ''} healthy — no issues detected
        </span>
      </div>
    );
  }

  if (state === 'degraded') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
        <span className="text-sm font-medium text-red-800 dark:text-red-300">
          No governance nodes connected — register a node to begin
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Node issues detected ({items.length})
        </span>
      </div>
      <ul className="ml-7 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-amber-500 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Overview KPIs ─────────────────────────────────────────────────────────────

export function OverviewKPIs({ nodes }: { nodes: NodeWithHealth[] }) {
  const healthy    = nodes.filter((n) => n.health?.status === 'healthy').length;
  const totalRecs  = nodes.reduce((sum, n) => sum + (n.health?.recordCount ?? 0), 0);
  const totalNotes = nodes.reduce((sum, n) => sum + (n.health?.noticeCount ?? 0), 0);

  const kpis = [
    { title: 'Connected Nodes',  value: nodes.length,  description: `${healthy} healthy`,          icon: Network },
    { title: 'Node Health',      value: `${healthy}/${nodes.length}`, description: 'reporting healthy', icon: Activity },
    { title: 'Total Records',    value: totalRecs,     description: 'across all nodes',             icon: ShieldCheck },
    { title: 'Total Notices',    value: totalNotes,    description: 'across all nodes',             icon: Globe },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map(({ title, value, description, icon: Icon }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Node Health List ──────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  healthy:     'default',
  degraded:    'secondary',
  unreachable: 'destructive',
};

export function NodeHealthListWidget({ nodes }: { nodes: NodeWithHealth[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Node Health</CardTitle>
          <CardDescription className="text-xs mt-0.5">Live status per governance node</CardDescription>
        </div>
        <Network className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {nodes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No nodes registered</p>
        ) : (
          <ul className="space-y-2 pt-1">
            {nodes.map(({ identity, health }) => (
              <li key={identity.id} className="flex items-center justify-between text-sm">
                <div className="flex flex-col min-w-0 mr-2">
                  <span className="font-medium truncate">{identity.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{identity.location}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {health ? (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {health.recordCount}r / {health.noticeCount}n
                      </span>
                      <Badge variant={STATUS_VARIANT[health.status] ?? 'outline'}>
                        {health.status}
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="outline">checking…</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Capability Matrix Widget ──────────────────────────────────────────────────

const ALL_CAPABILITIES = [
  'governance', 'participation', 'evidence', 'commercial', 'tcrs', 'institutional-memory',
] as const;

export function NodeCapabilityMatrixWidget({ nodes }: { nodes: NodeWithHealth[] }) {
  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-sm font-semibold">Capability Coverage</CardTitle>
        <CardDescription className="text-xs mt-0.5">Which capabilities each node exposes</CardDescription>
      </CardHeader>
      <CardContent>
        {nodes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No nodes registered</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Node</th>
                  {ALL_CAPABILITIES.map((cap) => (
                    <th key={cap} className="text-center font-medium text-muted-foreground pb-2 px-1 capitalize">
                      {cap.replace('institutional-memory', 'memory')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {nodes.map(({ identity }) => (
                  <tr key={identity.id}>
                    <td className="py-2 pr-4 font-medium truncate max-w-[120px]">{identity.name}</td>
                    {ALL_CAPABILITIES.map((cap) => (
                      <td key={cap} className="text-center py-2 px-1">
                        {identity.capabilities.includes(cap) ? (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
