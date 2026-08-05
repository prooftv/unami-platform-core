'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX } from 'lucide-react';
import type { OperatorsSummary } from '@unami/api';
import type { NodeOperatorsSummary } from '@/lib/nodes/fetcher';

const ROLE_LABELS: Record<string, string> = {
  'council-secretary': 'Council Secretary',
  'youth-rep':         'Youth Representative',
  'induna-rep':        'Area Headman',
  'operating-partner': 'Operating Partner',
  'pmu-rep':           'PMU / Engineer',
  'platform-operator': 'Platform Operator',
};

// ── Operator KPIs ─────────────────────────────────────────────────────────────

export function OperatorKPIs({ nodes }: { nodes: NodeOperatorsSummary[] }) {
  const totalAll      = nodes.reduce((s, n) => s + n.summary.total, 0);
  const totalActive   = nodes.reduce((s, n) => s + n.summary.active, 0);
  const totalInactive = nodes.reduce((s, n) => s + n.summary.inactive, 0);

  const kpis = [
    { title: 'Total Operators', value: totalAll,      icon: Users,     cls: '' },
    { title: 'Active',          value: totalActive,   icon: UserCheck, cls: 'text-green-600' },
    { title: 'Inactive',        value: totalInactive, icon: UserX,     cls: 'text-muted-foreground' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 max-w-lg">
      {kpis.map(({ title, value, icon: Icon, cls }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className={`h-3.5 w-3.5 ${cls || 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-semibold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Node Operators Card ───────────────────────────────────────────────────────

export function NodeOperatorsWidget({ nodeId, nodeName, nodeAuthority, summary }: NodeOperatorsSummary) {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{nodeName}</CardTitle>
            <CardDescription className="mt-0.5">{nodeAuthority}</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline">{summary.active} active</Badge>
            {summary.inactive > 0 && (
              <Badge variant="secondary">{summary.inactive} inactive</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {summary.operators.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No operators registered</p>
        ) : (
          <ul className="space-y-3">
            {summary.operators.map((op) => (
              <li key={op.id} className="flex items-center justify-between text-sm">
                <div className="flex flex-col min-w-0 mr-4">
                  <span className="font-medium">{op.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABELS[op.operatorRole] ?? op.operatorRole}
                    {op.organisation ? ` · ${op.organisation}` : ''}
                  </span>
                </div>
                <Badge variant={op.active ? 'default' : 'secondary'}>
                  {op.active ? 'active' : 'inactive'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Role Distribution Widget ──────────────────────────────────────────────────

export function OperatorRoleDistributionWidget({ nodes }: { nodes: NodeOperatorsSummary[] }) {
  const combined: Record<string, number> = {};
  for (const { summary } of nodes) {
    for (const [role, count] of Object.entries(summary.byRole)) {
      combined[role] = (combined[role] ?? 0) + count;
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Role Distribution</CardTitle>
          <CardDescription className="text-xs mt-0.5">Operators by role across all nodes</CardDescription>
        </div>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {Object.keys(combined).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
        ) : (
          Object.entries(combined).map(([role, count]) => (
            <div key={role} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{ROLE_LABELS[role] ?? role}</span>
              <Badge variant="outline">{count}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
