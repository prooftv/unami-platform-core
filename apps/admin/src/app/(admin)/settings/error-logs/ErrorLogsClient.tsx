'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import type { ErrorLogEntry } from '@moments/api';
import type { PaginatedResponse } from '@moments/api';

const SEVERITY_VARIANT: Record<string, 'outline' | 'secondary' | 'destructive' | 'default'> = {
  low: 'outline', medium: 'secondary', high: 'default', critical: 'destructive',
};

interface Props {
  initialData: PaginatedResponse<ErrorLogEntry> | null;
  currentPage: number;
  currentSeverity: string;
}

export function ErrorLogsClient({ initialData, currentPage, currentSeverity }: Props) {
  const router = useRouter();
  const total = initialData?.pagination.total ?? 0;
  const totalPages = Math.ceil(total / (initialData?.pagination.limit ?? 20));

  function buildUrl(overrides: { page?: number; severity?: string }) {
    const params = new URLSearchParams();
    const p = overrides.page ?? currentPage;
    const s = overrides.severity !== undefined ? overrides.severity : currentSeverity;
    if (p > 1) params.set('page', String(p));
    if (s && s !== 'all') params.set('severity', s);
    const qs = params.toString();
    return `/settings/error-logs${qs ? '?' + qs : ''}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Error Log</h1>
          <p className="text-sm text-muted-foreground">Application errors captured by Edge Functions</p>
        </div>
      </div>

      <Select value={currentSeverity || 'all'} onValueChange={(v) => router.push(buildUrl({ severity: v, page: 1 }))}>
        <SelectTrigger className="h-8 w-40"><SelectValue placeholder="All severities" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All severities</SelectItem>
          {['low', 'medium', 'high', 'critical'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severity</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(initialData?.data ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No errors found.</TableCell>
            </TableRow>
          ) : (initialData?.data ?? []).map((entry) => (
            <TableRow key={entry.id}>
              <TableCell><Badge variant={SEVERITY_VARIANT[entry.severity]}>{entry.severity}</Badge></TableCell>
              <TableCell><span className="font-mono text-xs">{entry.errorType}</span></TableCell>
              <TableCell><p className="text-sm truncate max-w-sm">{entry.errorMessage}</p></TableCell>
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
