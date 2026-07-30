'use client';

import {
  PageHeader, DataTable, Badge, KPIGrid, MetricCard,
  ActivityFeed, Card, CardContent, CardHeader, CardTitle,
} from '@moments/ui';
import type { ColumnDef, ActivityItem } from '@moments/ui';
import type { AuthorityProfile, PaginatedResponse } from '@moments/api';
import type { AuthorityAuditEntry, AuthorityStats } from '@moments/api';
import { Network, Users, Zap, Shield } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'warning'> = {
  active: 'success', suspended: 'destructive', expired: 'warning',
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Community Member', 2: 'Verified Member', 3: 'Community Leader',
  4: 'NGO Partner', 5: 'National Authority',
};

interface Props {
  profiles: PaginatedResponse<AuthorityProfile> | null;
  auditLog: PaginatedResponse<AuthorityAuditEntry> | null;
  stats: AuthorityStats | null;
}

export function AuthorityClient({ profiles, auditLog, stats }: Props) {
  const auditItems: ActivityItem[] = (auditLog?.data ?? []).map((e) => ({
    id: e.id,
    label: e.actionType,
    description: `Level ${e.authorityLevel} · ${e.scope} · blast radius ${e.blastRadiusApplied}`,
    timestamp: new Date(e.performedAt).toLocaleDateString(),
    icon: Shield,
  }));

  const columns: ColumnDef<AuthorityProfile>[] = [
    {
      key: 'identifier',
      header: 'Identifier',
      cell: (p) => <span className="font-mono text-sm">{p.userIdentifier}</span>,
    },
    {
      key: 'level',
      header: 'Level',
      cell: (p) => (
        <div>
          <p className="text-sm font-medium">Level {p.authorityLevel}</p>
          <p className="text-xs text-muted-foreground">{LEVEL_LABELS[p.authorityLevel] ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'Scope',
      cell: (p) => (
        <div>
          <Badge variant="outline">{p.scope}</Badge>
          {p.scopeIdentifier && (
            <span className="text-xs text-muted-foreground ml-1">{p.scopeIdentifier}</span>
          )}
        </div>
      ),
    },
    {
      key: 'blast',
      header: 'Blast Radius',
      cell: (p) => <span className="text-sm">{p.blastRadius.toLocaleString()}</span>,
    },
    {
      key: 'approval',
      header: 'Approval Mode',
      cell: (p) => <Badge variant="secondary">{p.approvalMode}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Authority Profiles"
        description="Trusted community members with elevated content privileges — levels 1–5"
      />

      <KPIGrid columns={4}>
        <MetricCard title="Total Profiles" value={stats ? stats.total : '—'} description="All authorities" icon={Network} />
        <MetricCard title="Active" value={stats ? stats.active : '—'} description="Currently active" icon={Users} />
        <MetricCard title="Actions Today" value={stats ? stats.actionsToday : '—'} description="Today" icon={Zap} />
        <MetricCard title="Actions (7d)" value={stats ? stats.actionsLast7d : '—'} description="Last 7 days" icon={Shield} />
      </KPIGrid>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <DataTable
            columns={columns}
            data={profiles?.data ?? []}
            getRowKey={(p) => p.id}
            emptyMessage="No authority profiles yet."
          />
        </div>
        <div className="lg:col-span-4">
          <ActivityFeed title="Recent Actions" items={auditItems} />
        </div>
      </div>
    </div>
  );
}
