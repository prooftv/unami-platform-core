'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, KPIGrid, TableToolbar, TablePagination, BulkActionBar } from '@unami/ui';
import { createApiClient } from '@unami/api';
import { getToken } from '@/lib/auth/token';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import type { CampaignWithSponsor, PaginatedResponse } from '@unami/api';
import type { CampaignBudgetEntry } from '@unami/api';
import { CampaignStatus } from '@/domain/moments';
import { Briefcase, Target, DollarSign, CheckCircle, PlusCircle } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending_review: 'secondary', approved: 'outline', active: 'default',
  paused: 'secondary', completed: 'outline', cancelled: 'destructive', published: 'default',
};

interface Props {
  initialData: PaginatedResponse<CampaignWithSponsor> | null;
  budgetOverview: CampaignBudgetEntry[];
  currentPage: number;
  session: { role: string };
}

export function CampaignsClient({ initialData, budgetOverview, currentPage, session }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bulkPending, setBulkPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const allRows = initialData?.data ?? [];
  const rows = allRows.filter((c) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Only pending_review campaigns can be bulk-approved
  const approvable = allRows.filter((c) => c.status === 'pending_review');

  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;
  const active = budgetOverview.filter((c) => c.status === 'active');
  const totalBudget = budgetOverview.reduce((s, c) => s + c.budget, 0);
  const totalSpent = budgetOverview.reduce((s, c) => s + c.spent, 0);

  const canCreate = session.role === 'superadmin' || session.role === 'content_admin';
  const canApprove = session.role === 'superadmin';

  const { selected, toggle, toggleAll, clear, selectedCount } =
    useBulkSelection<CampaignWithSponsor>((c) => c.id);

  const approvableSelected = Array.from(selected).filter((id) =>
    approvable.some((c) => c.id === id)
  );

  function getApi(token: string) {
    return createApiClient({ baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL! + '/functions/v1', token });
  }

  async function bulkApprove() {
    if (approvableSelected.length === 0) return;
    setBulkPending(true);
    setFeedback(null);
    try {
      const token = await getToken();
      const api = getApi(token);
      const results = await Promise.allSettled(approvableSelected.map((id) => api.campaigns.approve(id)));
      const failed = results.filter((r) => r.status === 'rejected').length;
      setFeedback(
        failed === 0
          ? `${approvableSelected.length} campaign${approvableSelected.length > 1 ? 's' : ''} approved`
          : `${approvableSelected.length - failed} approved, ${failed} failed`,
      );
      clear();
      router.refresh();
    } finally {
      setBulkPending(false);
    }
  }

  const kpiItems = [
    { title: 'Total Campaigns', value: total || '—', description: 'All campaigns', icon: Briefcase },
    { title: 'Active', value: active.length, description: 'Currently running', icon: Target },
    { title: 'Total Budget', value: totalBudget > 0 ? `R${totalBudget.toLocaleString()}` : '—', description: 'Allocated', icon: DollarSign },
    { title: 'Total Spent', value: totalSpent > 0 ? `R${totalSpent.toLocaleString()}` : '—', description: 'Across all campaigns', icon: CheckCircle },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Campaigns"
        description="Sponsored broadcast campaigns — from pending review through to active delivery"
        actions={
          canCreate ? (
            <Button size="sm" onClick={() => router.push('/campaigns/new')}>
              <PlusCircle className="h-4 w-4 mr-2" />New Campaign
            </Button>
          ) : undefined
        }
      />

      <KPIGrid items={kpiItems} columns={4} />

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
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search campaigns..."
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.values(CampaignStatus).map((s) => (
                <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            {canApprove && (
              <TableHead className="w-10 pr-0">
                <input
                  type="checkbox"
                  checked={approvable.length > 0 && approvable.every((c) => selected.has(c.id))}
                  ref={(el) => {
                    if (el) el.indeterminate =
                      approvable.some((c) => selected.has(c.id)) &&
                      !approvable.every((c) => selected.has(c.id));
                  }}
                  onChange={() => toggleAll(approvable)}
                  className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                  aria-label="Select all pending"
                />
              </TableHead>
            )}
            <TableHead>Campaign</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Regions</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canApprove ? 7 : 6} className="text-center text-muted-foreground py-8">No campaigns yet.</TableCell>
            </TableRow>
          ) : rows.map((c) => {
            const isApprovable = c.status === 'pending_review';
            const isSelected = selected.has(c.id);
            return (
              <TableRow
                key={c.id}
                className={`cursor-pointer ${isSelected ? 'bg-muted/60' : ''}`}
                onClick={() => router.push(`/campaigns/${c.id}`)}
              >
                {canApprove && (
                  <TableCell className="w-10 pr-0">
                    {isApprovable ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => { e.stopPropagation(); toggle(c.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                        aria-label="Select row"
                      />
                    ) : (
                      <span className="block h-4 w-4" />
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <p className="font-medium text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.sponsor?.displayName ?? '—'}</p>
                </TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[c.status]}>{c.status.replace('_', ' ')}</Badge></TableCell>
                <TableCell><span className="text-sm">R{c.budget.toLocaleString()}</span></TableCell>
                <TableCell><Badge variant="secondary">{c.category}</Badge></TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{c.targetRegions.join(', ') || '—'}</span></TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {total > limit && (
        <TablePagination
          page={currentPage}
          pageSize={limit}
          total={total}
          onPageChange={(p) => router.push(`/campaigns?page=${p}`)}
        />
      )}

      {canApprove && (
        <BulkActionBar
          selectedCount={approvableSelected.length}
          entityLabel="campaign"
          onClear={clear}
          actions={[
            {
              label: bulkPending ? 'Approving...' : 'Approve selected',
              icon: <CheckCircle className="h-3.5 w-3.5" />,
              onClick: bulkApprove,
              disabled: bulkPending,
            },
          ]}
        />
      )}
    </div>
  );
}
