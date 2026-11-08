import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const severityColour: Record<string, string> = {
  critical: 'bg-red-200 text-red-900',
  high:     'bg-red-100 text-red-800',
  medium:   'bg-amber-100 text-amber-800',
  low:      'bg-gray-100 text-gray-700',
};

const statusColour: Record<string, string> = {
  open:        'bg-red-100 text-red-800',
  'in-progress':'bg-amber-100 text-amber-800',
  resolved:    'bg-green-100 text-green-800',
  accepted:    'bg-gray-100 text-gray-700',
};

const typeLabel: Record<string, string> = {
  gap:       'Gap',
  exception: 'Exception',
  incident:  'Incident',
};

export default async function FindingsPage() {
  const supabase = createServiceClient();
  const { data: findings } = await supabase
    .from('findings')
    .select('*')
    .order('identified_at', { ascending: false });

  const rows = findings ?? [];
  const open       = rows.filter((f) => f.status === 'open').length;
  const inProgress = rows.filter((f) => f.status === 'in-progress').length;
  const critical   = rows.filter((f) => f.severity === 'critical' && f.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Findings"
        description="Gaps, exceptions and incidents requiring remediation."
        actions={
          <Button asChild><Link href="/findings/new">Add finding</Link></Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-destructive">{critical}</p>
          <p className="text-sm text-muted-foreground">Critical open</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-red-600">{open}</p>
          <p className="text-sm text-muted-foreground">Open</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-amber-600">{inProgress}</p>
          <p className="text-sm text-muted-foreground">In progress</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Findings</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No findings recorded.
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((f) => (
                <div key={f.id} className="relative px-6 py-4 space-y-1 hover:bg-muted/30">
                  <Link href={`/findings/${f.id}`} className="absolute inset-0" aria-label={f.title} />
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{typeLabel[f.finding_type] ?? f.finding_type} · Owner: {f.owner}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColour[f.severity] ?? ''}`}>
                        {f.severity}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[f.status] ?? ''}`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Identified: {new Date(f.identified_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
