'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, KPIGrid, TableToolbar, TablePagination } from '@unami/ui';
import type { Sponsor, PaginatedResponse } from '@unami/api';
import type { SponsorStats } from '@unami/api';
import { SponsorTier } from '@/domain/moments';
import { Tag, Users, Star, Award, PlusCircle } from 'lucide-react';

const TIER_VARIANT: Record<string, 'secondary' | 'outline' | 'default'> = {
  bronze: 'secondary', silver: 'outline', gold: 'outline', platinum: 'default',
};

interface Props {
  initialData: PaginatedResponse<Sponsor> | null;
  stats: SponsorStats | null;
  currentPage: number;
  session: { role: string };
}

export function SponsorsClient({ initialData, stats, currentPage, session }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  const rows = (initialData?.data ?? []).filter((s) => {
    const matchSearch = !search || s.displayName.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase());
    const matchTier = !tierFilter || tierFilter === 'all' || s.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;

  const canCreate = session.role === 'superadmin' || session.role === 'content_admin';

  const kpiItems = [
    { title: 'Total Sponsors', value: stats?.total ?? '—', description: 'All sponsors', icon: Tag },
    { title: 'Active', value: stats?.active ?? '—', description: 'Currently active', icon: Users },
    { title: 'Platinum / Gold', value: stats ? stats.byTier.platinum + stats.byTier.gold : '—', description: 'Premium tiers', icon: Award },
    { title: 'Silver / Bronze', value: stats ? stats.byTier.silver + stats.byTier.bronze : '—', description: 'Standard tiers', icon: Star },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sponsors"
        description="Organisations funding community broadcasts — tier assignments and budget tracking"
        actions={
          canCreate ? (
            <Button size="sm" onClick={() => router.push('/sponsors/new')}>
              <PlusCircle className="h-4 w-4 mr-2" />New Sponsor
            </Button>
          ) : undefined
        }
      />

      <KPIGrid items={kpiItems} columns={4} />

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sponsors..."
        filters={
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="h-8 w-36"><SelectValue placeholder="All tiers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              {Object.values(SponsorTier).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sponsor</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Monthly Budget</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Contact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sponsors yet.</TableCell>
            </TableRow>
          ) : rows.map((s) => (
            <TableRow key={s.id} className="cursor-pointer" onClick={() => router.push(`/sponsors/${s.id}/edit`)}>
              <TableCell>
                <p className="font-medium text-sm">{s.displayName}</p>
                <p className="text-xs text-muted-foreground">{s.name}</p>
              </TableCell>
              <TableCell><Badge variant={TIER_VARIANT[s.tier]}>{s.tier}</Badge></TableCell>
              <TableCell><span className="text-sm">R{s.monthlyBudget.toLocaleString()}</span></TableCell>
              <TableCell><Badge variant={s.active ? 'default' : 'destructive'}>{s.active ? 'Active' : 'Inactive'}</Badge></TableCell>
              <TableCell><span className="text-xs text-muted-foreground">{s.contactEmail ?? '—'}</span></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {total > limit && (
        <TablePagination
          page={currentPage}
          pageSize={limit}
          total={total}
          onPageChange={(p) => router.push(`/sponsors?page=${p}`)}
        />
      )}
    </div>
  );
}
