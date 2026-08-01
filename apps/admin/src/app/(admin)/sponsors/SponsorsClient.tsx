'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Sponsor, PaginatedResponse } from '@moments/api';
import type { SponsorStats } from '@moments/api';
import { SponsorTier } from '@moments/shared';
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
    const matchSearch = !search || s.displayName.toLowerCase().includes(search.toLowerCase()) || s.name.includes(search.toLowerCase());
    const matchTier = !tierFilter || tierFilter === 'all' || s.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  const kpis = [
    { title: 'Total Sponsors', value: stats?.total ?? '—', description: 'All sponsors', icon: Tag },
    { title: 'Active', value: stats?.active ?? '—', description: 'Currently active', icon: Users },
    { title: 'Platinum / Gold', value: stats ? (stats.byTier.platinum + stats.byTier.gold) : '—', description: 'Premium tiers', icon: Award },
    { title: 'Silver / Bronze', value: stats ? (stats.byTier.silver + stats.byTier.bronze) : '—', description: 'Standard tiers', icon: Star },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Sponsors</h1>
          <p className="text-sm text-muted-foreground">Organisations funding community broadcasts — tier assignments and budget tracking</p>
        </div>
        {(session.role === 'superadmin' || session.role === 'content_admin') && (
          <Button size="sm" onClick={() => router.push('/sponsors/new')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Sponsor
          </Button>
        )}
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

      <div className="flex items-center gap-2">
        <Input placeholder="Search sponsors..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-56" />
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="h-8 w-36"><SelectValue placeholder="All tiers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            {Object.values(SponsorTier).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => router.push(`/sponsors?page=${currentPage - 1}`)}>Previous</Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => router.push(`/sponsors?page=${currentPage + 1}`)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
