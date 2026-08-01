'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CampaignWithSponsor, PaginatedResponse } from '@moments/api';
import type { CampaignBudgetEntry } from '@moments/api';
import { CampaignStatus } from '@moments/shared';
import { Briefcase, Target, DollarSign, CheckCircle } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  pending_review: 'secondary', approved: 'outline', active: 'default',
  paused: 'secondary', completed: 'outline', cancelled: 'destructive', published: 'default',
};

interface Props {
  initialData: PaginatedResponse<CampaignWithSponsor> | null;
  budgetOverview: CampaignBudgetEntry[];
  currentPage: number;
}

export function CampaignsClient({ initialData, budgetOverview, currentPage }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const rows = (initialData?.data ?? []).filter((c) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const active = budgetOverview.filter((c) => c.status === 'active');
  const totalBudget = budgetOverview.reduce((s, c) => s + c.budget, 0);
  const totalSpent = budgetOverview.reduce((s, c) => s + c.spent, 0);
  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  const kpis = [
    { title: 'Total Campaigns', value: total || '—', description: 'All campaigns', icon: Briefcase },
    { title: 'Active', value: active.length, description: 'Currently running', icon: Target },
    { title: 'Total Budget', value: totalBudget > 0 ? `R${totalBudget.toLocaleString()}` : '—', description: 'Allocated', icon: DollarSign },
    { title: 'Total Spent', value: totalSpent > 0 ? `R${totalSpent.toLocaleString()}` : '—', description: 'Across all campaigns', icon: CheckCircle },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Campaigns</h1>
        <p className="text-sm text-muted-foreground">Sponsored broadcast campaigns — from pending review through to active delivery</p>
      </div>

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

      <div className="flex items-center gap-2">
        <Input placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-56" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(CampaignStatus).map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No campaigns yet.</TableCell>
            </TableRow>
          ) : rows.map((c) => (
            <TableRow key={c.id}>
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
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => router.push(`/campaigns?page=${currentPage - 1}`)}>Previous</Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => router.push(`/campaigns?page=${currentPage + 1}`)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
