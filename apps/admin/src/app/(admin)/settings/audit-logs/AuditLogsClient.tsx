'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import type { AuditLogEntry } from '@moments/api';
import type { PaginatedResponse } from '@moments/api';

const RESOURCE_TYPES = ['moment', 'campaign', 'sponsor', 'subscription', 'authority_profile', 'feature_flag', 'system_setting', 'broadcast', 'message', 'comment'];

interface Props {
  initialData: PaginatedResponse<AuditLogEntry> | null;
  currentPage: number;
  currentResourceType: string;
}

export function AuditLogsClient({ initialData, currentPage, currentResourceType }: Props) {
  const router = useRouter();
  const total = initialData?.pagination.total ?? 0;
  const totalPages = Math.ceil(total / (initialData?.pagination.limit ?? 20));

  function buildUrl(overrides: { page?: number; resourceType?: string }) {
    const params = new URLSearchParams();
    const p = overrides.page ?? currentPage;
    const rt = overrides.resourceType !== undefined ? overrides.resourceType : currentResourceType;
    if (p > 1) params.set('page', String(p));
    if (rt && rt !== 'all') params.set('resourceType', rt);
    const qs = params.toString();
    return `/settings/audit-logs${qs ? '?' + qs : ''}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Audit Log</h1>
            <p className="text-sm text-muted-foreground">Admin action history — all write operations across the platform</p>
          </div>
        </div>
      </div>

      <Select value={currentResourceType || 'all'} onValueChange={(v) => router.push(buildUrl({ resourceType: v, page: 1 }))}>
        <SelectTrigger className="h-8 w-48"><SelectValue placeholder="All resource types" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {RESOURCE_TYPES.map((rt) => <SelectItem key={rt} value={rt}>{rt.replace('_', ' ')}</SelectItem>)}
        </SelectContent>
      </Select>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Resource ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(initialData?.data ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No audit entries found.</TableCell>
            </TableRow>
          ) : (initialData?.data ?? []).map((entry) => (
            <TableRow key={entry.id}>
              <TableCell><Badge variant="outline">{entry.action}</Badge></TableCell>
              <TableCell><span className="text-sm">{entry.resourceType.replace('_', ' ')}</span></TableCell>
              <TableCell><span className="font-mono text-xs text-muted-foreground">{entry.resourceId.slice(0, 8)}…</span></TableCell>
              <TableCell><span className="font-mono text-xs text-muted-foreground">{entry.userId.slice(0, 8)}…</span></TableCell>
              <TableCell><span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => router.push(buildUrl({ page: currentPage - 1 }))}>Previous</Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => router.push(buildUrl({ page: currentPage + 1 }))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
