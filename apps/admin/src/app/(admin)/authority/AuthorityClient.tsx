'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader, KPIGrid, TablePagination } from '@moments/ui';
import type { AuthorityProfile, PaginatedResponse } from '@moments/api';
import type { AuthorityAuditEntry, AuthorityStats } from '@moments/api';
import { Network, Users, Zap, Shield, PlusCircle } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'secondary'> = {
  active: 'default', suspended: 'destructive', expired: 'secondary',
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Community Member', 2: 'Verified Member', 3: 'Community Leader',
  4: 'NGO Partner', 5: 'National Authority',
};

interface Props {
  profiles: PaginatedResponse<AuthorityProfile> | null;
  auditLog: PaginatedResponse<AuthorityAuditEntry> | null;
  stats: AuthorityStats | null;
  session: { role: string };
  currentPage?: number;
}

export function AuthorityClient({ profiles, auditLog, stats, session, currentPage = 1 }: Props) {
  const router = useRouter();

  const total = profiles?.pagination.total ?? 0;
  const limit = profiles?.pagination.limit ?? 20;

  const kpiItems = [
    { title: 'Total Profiles', value: stats?.total ?? '—', description: 'All authorities', icon: Network },
    { title: 'Active', value: stats?.active ?? '—', description: 'Currently active', icon: Users },
    { title: 'Actions Today', value: stats?.actionsToday ?? '—', description: 'Today', icon: Zap },
    { title: 'Actions (7d)', value: stats?.actionsLast7d ?? '—', description: 'Last 7 days', icon: Shield },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Authority Profiles"
        description="Trusted community members with elevated publishing privileges — authority levels 1–5"
        actions={
          session.role === 'superadmin' ? (
            <Button size="sm" onClick={() => router.push('/authority/new')}>
              <PlusCircle className="h-4 w-4 mr-2" />New Profile
            </Button>
          ) : undefined
        }
      />

      <KPIGrid items={kpiItems} columns={4} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifier</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Blast Radius</TableHead>
                <TableHead>Approval Mode</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(profiles?.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No authority profiles yet.</TableCell>
                </TableRow>
              ) : (profiles?.data ?? []).map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => router.push(`/authority/${p.id}/edit`)}>
                  <TableCell><span className="font-mono text-sm">{p.userIdentifier}</span></TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">Level {p.authorityLevel}</p>
                    <p className="text-xs text-muted-foreground">{LEVEL_LABELS[p.authorityLevel] ?? '—'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.scope}</Badge>
                    {p.scopeIdentifier && <span className="text-xs text-muted-foreground ml-1">{p.scopeIdentifier}</span>}
                  </TableCell>
                  <TableCell><span className="text-sm">{p.blastRadius.toLocaleString()}</span></TableCell>
                  <TableCell><Badge variant="secondary">{p.approvalMode}</Badge></TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {total > limit && (
            <TablePagination
              page={currentPage}
              pageSize={limit}
              total={total}
              onPageChange={(p) => router.push(`/authority?page=${p}`)}
            />
          )}
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Recent Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(auditLog?.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent actions.</p>
              ) : (auditLog?.data ?? []).map((e) => (
                <div key={e.id} className="flex items-start gap-2 text-xs">
                  <Shield className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{e.actionType}</p>
                    <p className="text-muted-foreground">Level {e.authorityLevel} &middot; {e.scope} &middot; blast radius {e.blastRadiusApplied}</p>
                    <p className="text-muted-foreground">{new Date(e.performedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
