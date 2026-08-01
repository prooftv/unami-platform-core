'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader, DataTable, TableToolbar, TablePagination,
  Badge, KPIGrid, MetricCard, FilterSelect,
} from '@moments/ui';
import type { ColumnDef } from '@moments/ui';
import type { Sponsor, PaginatedResponse } from '@moments/api';
import type { SponsorStats } from '@moments/api';
import { SponsorTier } from '@moments/shared';
import { Tag, Users, Star, Award } from 'lucide-react';

const TIER_VARIANT: Record<string, 'secondary' | 'info' | 'warning' | 'success'> = {
  bronze: 'secondary', silver: 'info', gold: 'warning', platinum: 'success',
};

const TIER_OPTIONS = Object.values(SponsorTier).map((t) => ({ value: t, label: t }));

interface Props {
  initialData: PaginatedResponse<Sponsor> | null;
  stats: SponsorStats | null;
  currentPage: number;
}

export function SponsorsClient({ initialData, stats, currentPage }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  const rows = (initialData?.data ?? []).filter((s) => {
    const matchSearch = !search || s.displayName.toLowerCase().includes(search.toLowerCase()) || s.name.includes(search.toLowerCase());
    const matchTier = !tierFilter || s.tier === tierFilter;
    return matchSearch && matchTier;
  });

  function handlePageChange(page: number) {
    router.push(`/sponsors?page=${page}`);
  }

  const columns: ColumnDef<Sponsor>[] = [
    {
      key: 'name',
      header: 'Sponsor',
      cell: (s) => (
        <div>
          <p className="font-medium text-sm">{s.displayName}</p>
          <p className="text-xs text-muted-foreground">{s.name}</p>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Tier',
      cell: (s) => <Badge variant={TIER_VARIANT[s.tier]}>{s.tier}</Badge>,
    },
    {
      key: 'budget',
      header: 'Monthly Budget',
      cell: (s) => (
        <span className="text-sm">R{s.monthlyBudget.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => (
        <Badge variant={s.active ? 'success' : 'destructive'}>
          {s.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (s) => (
        <span className="text-xs text-muted-foreground">{s.contactEmail ?? '—'}</span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Sponsors"
        description="Organisations funding community broadcasts — tier assignments and budget tracking"
      />

      <KPIGrid columns={4}>
        <MetricCard title="Total Sponsors" value={stats ? stats.total : '—'} description="All sponsors" icon={Tag} />
        <MetricCard title="Active" value={stats ? stats.active : '—'} description="Currently active" icon={Users} />
        <MetricCard title="Platinum / Gold" value={stats ? (stats.byTier.platinum + stats.byTier.gold) : '—'} description="Premium tiers" icon={Award} />
        <MetricCard title="Silver / Bronze" value={stats ? (stats.byTier.silver + stats.byTier.bronze) : '—'} description="Standard tiers" icon={Star} />
      </KPIGrid>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sponsors..."
        filters={
          <FilterSelect value={tierFilter} onChange={setTierFilter} options={TIER_OPTIONS} placeholder="All tiers" />
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(s) => s.id}
        emptyMessage="No sponsors yet."
      />

      {initialData && (
        <TablePagination
          page={currentPage}
          pageSize={initialData.pagination.limit}
          total={initialData.pagination.total}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
