'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserProfile } from '@unami/api';
import type { PaginatedResponse } from '@unami/api';
import { Star, MessageSquare, Users } from 'lucide-react';

interface Props {
  initialData: PaginatedResponse<UserProfile> | null;
  currentPage: number;
}

export function CommunityProfilesClient({ initialData, currentPage }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();

  const rows = initialData?.data ?? [];
  const total = initialData?.pagination.total ?? 0;
  const limit = initialData?.pagination.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set('search', value);
      router.push(`/community-profiles?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Community Profiles</h1>
        <p className="text-sm text-muted-foreground">Anonymous community member profiles — phone numbers masked per POPIA</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Profiles</CardTitle>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-semibold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Comments</CardTitle>
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-semibold">{rows.reduce((s, r) => s + r.totalComments, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Featured</CardTitle>
            <Star className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xl font-semibold">{rows.reduce((s, r) => s + r.totalFeatured, 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Input
        placeholder="Search by display name..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="h-8 w-64"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Display Name</TableHead>
            <TableHead>Reputation</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No profiles found.</TableCell>
            </TableRow>
          ) : rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <span className="font-medium">{p.displayName ?? <span className="text-muted-foreground italic">Anonymous</span>}</span>
              </TableCell>
              <TableCell>
                <Badge variant={p.reputationScore >= 50 ? 'default' : 'secondary'}>{p.reputationScore}</Badge>
              </TableCell>
              <TableCell>{p.totalComments}</TableCell>
              <TableCell>{p.totalFeatured}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => router.push(`/community-profiles?page=${currentPage - 1}`)}>Previous</Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => router.push(`/community-profiles?page=${currentPage + 1}`)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
