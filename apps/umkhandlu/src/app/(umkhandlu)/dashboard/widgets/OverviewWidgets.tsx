'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Network, Activity, Globe, ShieldCheck } from 'lucide-react';
import type { NodeHealth, GovernanceNodeIdentity, RecordsSummary, NoticesSummary, TcrsSummary } from '@unami/api';

function formatLocation(location: GovernanceNodeIdentity['location']): string {
  if (!location) return '';
  if (typeof location === 'string') return location;
  return [location.municipality, location.province].filter(Boolean).join(', ');
}

export function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

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

export function OverviewKPIs({
  nodes,
  records,
  notices,
  tcrs,
}: {
  nodes: NodeWithHealth[];
  records: RecordsSummary | null;
  notices: NoticesSummary | null;
  tcrs: TcrsSummary | null;
}) {
  const healthy    = nodes.filter((n) => n.health?.status === 'healthy').length;

  const adoptionRate = records && records.total > 0
    ? Math.round((records.byStatus.adopted / records.total) * 100)
    : null;

  const escalationRate = tcrs && tcrs.total > 0
    ? Math.round((tcrs.escalated / tcrs.total) * 100)
    : null;

  const statutoryPending = notices?.statutory.pendingProof ?? null;

  const kpis = [
    {
      title: 'Connected Nodes',
      value: nodes.length,
      description: `${healthy} healthy`,
      icon: Network,
      alert: false,
    },
    {
      title: 'Adoption Rate',
      value: adoptionRate !== null ? `${adoptionRate}%` : '—',
      description: `${records?.byStatus.adopted ?? 0} of ${records?.total ?? 0} records adopted`,
      icon: ShieldCheck,
      alert: adoptionRate !== null && adoptionRate < 50,
    },
    {
      title: 'Statutory Pending',
      value: statutoryPending !== null ? statutoryPending : '—',
      description: 'notices awaiting proof of publication',
      icon: Globe,
      alert: statutoryPending !== null && statutoryPending > 0,
    },
    {
      title: 'TCRS Escalation Rate',
      value: escalationRate !== null ? `${escalationRate}%` : '—',
      description: `${tcrs?.escalated ?? 0} of ${tcrs?.total ?? 0} conflicts escalated`,
      icon: Activity,
      alert: escalationRate !== null && escalationRate > 20,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map(({ title, value, description, icon: Icon, alert }) => (
        <Card key={title} className={alert ? 'border-destructive/50' : undefined}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className={`text-xs font-medium ${alert ? 'text-destructive' : 'text-muted-foreground'}`}>{title}</CardTitle>
            <Icon className={`h-3.5 w-3.5 ${alert ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className={`text-xl font-semibold ${alert ? 'text-destructive' : ''}`}>{value}</p>
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
                  <span className="text-xs text-muted-foreground truncate">{formatLocation(identity.location)}</span>
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

// ── Cross-Node Comparison Widget ─────────────────────────────────────────────

import type { NodeSnapshot } from '@/lib/nodes/fetcher';

const SNAP_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  healthy:     'default',
  degraded:    'secondary',
  unreachable: 'destructive',
};

export function CrossNodeWidget({ snapshots }: { snapshots: NodeSnapshot[] }) {
  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-sm font-semibold">Cross-Node Comparison</CardTitle>
          <CardDescription className="text-xs mt-0.5">Per-node governance intelligence</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">No nodes registered</p>
        </CardContent>
      </Card>
    );
  }

  const totals = {
    records:       snapshots.reduce((s, n) => s + (n.records?.total ?? 0), 0),
    adopted:       snapshots.reduce((s, n) => s + (n.records?.byStatus.adopted ?? 0), 0),
    notices:       snapshots.reduce((s, n) => s + (n.notices?.total ?? 0), 0),
    statutory:     snapshots.reduce((s, n) => s + (n.notices?.statutory.total ?? 0), 0),
    pendingProof:  snapshots.reduce((s, n) => s + (n.notices?.statutory.pendingProof ?? 0), 0),
    projects:      snapshots.reduce((s, n) => s + (n.commercial?.projects.total ?? 0), 0),
    beneficiaries: snapshots.reduce((s, n) => s + (n.commercial?.projects.totalBeneficiaries ?? 0), 0),
  };

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Cross-Node Comparison</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {snapshots.length} node{snapshots.length !== 1 ? 's' : ''} — governance intelligence side by side
            </CardDescription>
          </div>
          <Network className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Node</th>
                <th className="text-center font-medium text-muted-foreground px-3 py-2.5">Status</th>
                <th className="text-center font-medium text-muted-foreground px-3 py-2.5">Records</th>
                <th className="text-center font-medium text-muted-foreground px-3 py-2.5">Adopted %</th>
                <th className="text-center font-medium text-muted-foreground px-3 py-2.5">Notices</th>
                <th className="text-center font-medium text-muted-foreground px-3 py-2.5">Pending Proof</th>
                <th className="text-center font-medium text-muted-foreground px-3 py-2.5">Projects</th>
                <th className="text-center font-medium text-muted-foreground px-3 py-2.5">Beneficiaries</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {snapshots.map((node) => {
                const adoptPct = node.records && node.records.total > 0
                  ? Math.round((node.records.byStatus.adopted / node.records.total) * 100)
                  : null;
                const pendingProof = node.notices?.statutory.pendingProof ?? null;
                return (
                  <tr key={node.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{node.name}</div>
                      <div className="text-xs text-muted-foreground">{node.authority}</div>
                    </td>
                    <td className="text-center px-3 py-3">
                      <Badge variant={SNAP_STATUS_VARIANT[node.health?.status ?? 'unreachable']}>
                        {node.health?.status ?? 'unreachable'}
                      </Badge>
                    </td>
                    <td className="text-center px-3 py-3 font-medium">{node.records?.total ?? '—'}</td>
                    <td className="text-center px-3 py-3">
                      {adoptPct !== null ? (
                        <span className={adoptPct < 50 ? 'text-destructive font-medium' : 'text-green-600 dark:text-green-400 font-medium'}>
                          {adoptPct}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-center px-3 py-3 font-medium">{node.notices?.total ?? '—'}</td>
                    <td className="text-center px-3 py-3">
                      {pendingProof !== null ? (
                        <span className={pendingProof > 0 ? 'text-destructive font-medium' : ''}>
                          {pendingProof}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-center px-3 py-3 font-medium">{node.commercial?.projects.total ?? '—'}</td>
                    <td className="text-center px-3 py-3">{node.commercial?.projects.totalBeneficiaries ?? '—'}</td>
                  </tr>
                );
              })}
              <tr className="bg-muted/40 font-semibold border-t-2">
                <td className="px-4 py-2.5 text-muted-foreground text-xs uppercase tracking-wide">Total ({snapshots.length})</td>
                <td />
                <td className="text-center px-3 py-2.5">{totals.records}</td>
                <td className="text-center px-3 py-2.5 text-xs text-muted-foreground">
                  {totals.records > 0 ? `${Math.round((totals.adopted / totals.records) * 100)}%` : '—'}
                </td>
                <td className="text-center px-3 py-2.5">{totals.notices}</td>
                <td className="text-center px-3 py-2.5">{totals.pendingProof > 0 ? <span className="text-destructive">{totals.pendingProof}</span> : totals.pendingProof}</td>
                <td className="text-center px-3 py-2.5">{totals.projects}</td>
                <td className="text-center px-3 py-2.5">{totals.beneficiaries}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
