'use client';

import { useState } from 'react';
import {
  PageHeader, DataTable, TableToolbar, TablePagination,
  Badge, KPIGrid, MetricCard, Card, CardContent, CardHeader, CardTitle,
} from '@moments/ui';
import type { ColumnDef } from '@moments/ui';
import type { CampaignWithSponsor, PaginatedResponse } from '@moments/api';
import type { CampaignBudgetEntry } from '@moments/api';
import { CampaignStatus } from '@moments/shared';
import { Briefcase, Target, DollarSign, CheckCircle } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'outline' | 'warning' | 'success' | 'destructive' | 'info' | 'secondary'> = {
  pending_review: 'warning', approved: 'info', active: 'success',
  paused: 'secondary', completed: 'outline', cancelled: 'destructive', published: 'success',
};

const STATUSES = Object.values(CampaignStatus);

interface Props {
  initialData: PaginatedResponse<CampaignWithSponsor> | null;
  budgetOverview: CampaignBudgetEntry[];
}

export function CampaignsClient({ initialData, budgetOverview }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const rows = (initialData?.data ?? []).filter((c) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const active = budgetOverview.filter((c) => c.status === 'active');
  const totalBudget = budgetOverview.reduce((s, c) => s + c.budget, 0);
  const totalSpent = budgetOverview.reduce((s, c) => s + c.spent, 0);

  const columns: ColumnDef<CampaignWithSponsor>[] = [
    {
      key: 'title',
      header: 'Campaign',
      cell: (c) => (
        <div>
          <p className="font-medium text-sm">{c.title}</p>
          <p className="text-xs text-muted-foreground">{c.sponsor?.displayName ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (c) => <Badge variant={STATUS_VARIANT[c.status]}>{c.status.replace('_', ' ')}</Badge>,
    },
    {
      key: 'budget',
      header: 'Budget',
      cell: (c) => <span className="text-sm">R{c.budget.toLocaleString()}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      cell: (c) => <Badge variant="secondary">{c.category}</Badge>,
    },
    {
      key: 'regions',
      header: 'Regions',
      cell: (c) => (
        <span className="text-xs text-muted-foreground">{c.targetRegions.join(', ') || '—'}</span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      cell: (c) => (
        <span className="text-xs text-muted-foreground">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Campaigns"
        description="Sponsored broadcast campaigns — pending_review → approved → active"
      />

      <KPIGrid columns={4}>
        <MetricCard title="Total Campaigns" value={initialData?.pagination.total ?? '—'} description="All campaigns" icon={Briefcase} />
        <MetricCard title="Active" value={active.length} description="Currently running" icon={Target} />
        <MetricCard title="Total Budget" value={totalBudget > 0 ? `R${totalBudget.toLocaleString()}` : '—'} description="Allocated" icon={DollarSign} />
        <MetricCard title="Total Spent" value={totalSpent > 0 ? `R${totalSpent.toLocaleString()}` : '—'} description="Across all campaigns" icon={CheckCircle} />
      </KPIGrid>

      {active.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Active Campaign Budget Utilisation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {active.map((c) => {
              const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
              return (
                <div key={c.campaignId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.title}</span>
                    <span className="text-muted-foreground">R{c.spent.toLocaleString()} / R{c.budget.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search campaigns..."
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(c) => c.id}
        emptyMessage="No campaigns yet."
      />

      {initialData && (
        <TablePagination
          page={initialData.pagination.page}
          pageSize={initialData.pagination.limit}
          total={initialData.pagination.total}
          onPageChange={() => {}}
        />
      )}
    </div>
  );
}
