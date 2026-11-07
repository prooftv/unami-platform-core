import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const statusColour: Record<string, string> = {
  compliant:      'bg-green-100 text-green-800',
  'non-compliant':'bg-red-100 text-red-800',
  'under-review': 'bg-amber-100 text-amber-800',
  'not-applicable':'bg-gray-100 text-gray-700',
};

export default async function CompliancePage() {
  const supabase = createServiceClient();

  const { data: obligations } = await supabase
    .from('compliance_obligations')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });

  const rows = obligations ?? [];
  const nonCompliant  = rows.filter((o) => o.status === 'non-compliant').length;
  const compliant     = rows.filter((o) => o.status === 'compliant').length;
  const underReview   = rows.filter((o) => o.status === 'under-review').length;

  const today = new Date();
  const overdue = rows.filter((o) =>
    o.due_date && new Date(o.due_date) < today && o.status !== 'compliant' && o.status !== 'not-applicable'
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Obligations"
        description="Legislative, regulatory and institutional compliance obligations."
        actions={
          <Button asChild>
            <Link href="/compliance/new">Add obligation</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-green-600">{compliant}</p>
          <p className="text-sm text-muted-foreground">Compliant</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-destructive">{nonCompliant}</p>
          <p className="text-sm text-muted-foreground">Non-compliant</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-amber-600">{underReview}</p>
          <p className="text-sm text-muted-foreground">Under review</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-destructive">{overdue}</p>
          <p className="text-sm text-muted-foreground">Overdue</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Obligations</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No obligations recorded. Add an obligation to begin the compliance register.
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((ob) => {
                const isOverdue = ob.due_date && new Date(ob.due_date) < today
                  && ob.status !== 'compliant' && ob.status !== 'not-applicable';
                return (
                  <div key={ob.id} className="relative px-6 py-4 space-y-1 hover:bg-muted/30">
                    <Link href={`/compliance/${ob.id}`} className="absolute inset-0" aria-label={ob.title} />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{ob.identifier} — {ob.title}</p>
                        <p className="text-xs text-muted-foreground">{ob.source} · {ob.responsible_party}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isOverdue && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-200 text-red-900">Overdue</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[ob.status] ?? ''}`}>
                          {ob.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {ob.due_date && <span>Due: {new Date(ob.due_date).toLocaleDateString()}</span>}
                      {ob.recurrence && <span>Recurrence: {ob.recurrence}</span>}
                      {ob.assessed_at && <span>Assessed: {new Date(ob.assessed_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
