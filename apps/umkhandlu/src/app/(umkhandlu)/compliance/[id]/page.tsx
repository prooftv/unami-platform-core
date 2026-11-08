import { notFound } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { ObligationForm } from '../_components/ObligationForm';

export const dynamic = 'force-dynamic';

const statusColour: Record<string, string> = {
  compliant:       'bg-green-100 text-green-800',
  'non-compliant': 'bg-red-100 text-red-800',
  'under-review':  'bg-amber-100 text-amber-800',
  'not-applicable':'bg-gray-100 text-gray-700',
};

interface Props { params: Promise<{ id: string }> }

export default async function ObligationDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: ob } = await supabase.from('compliance_obligations').select('*').eq('id', id).single();
  if (!ob) notFound();

  const today = new Date();
  const isOverdue = ob.due_date && new Date(ob.due_date) < today
    && ob.status !== 'compliant' && ob.status !== 'not-applicable';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${ob.identifier} — ${ob.title}`}
        description={ob.source}
        actions={<Button variant="outline" asChild><Link href="/compliance">Back</Link></Button>}
      />

      <div className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Responsible:</span> {ob.responsible_party}</p>
              {ob.due_date && <p><span className="text-muted-foreground">Due:</span> {new Date(ob.due_date).toLocaleDateString()}</p>}
              {ob.recurrence && <p><span className="text-muted-foreground">Recurrence:</span> {ob.recurrence}</p>}
              {ob.assessed_by && <p><span className="text-muted-foreground">Assessed by:</span> {ob.assessed_by}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center gap-2">
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusColour[ob.status] ?? ''}`}>
                {ob.status}
              </span>
              {isOverdue && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-200 text-red-900">Overdue</span>
              )}
            </CardContent>
          </Card>
        </div>

        {ob.description && (
          <Card>
            <CardContent className="pt-6 text-sm">{ob.description}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Edit Obligation</CardTitle></CardHeader>
          <CardContent>
            <ObligationForm obligation={ob} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
