import { notFound } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { RiskForm } from '../_components/RiskForm';
import { RiskStatusActions } from '../_components/RiskStatusActions';

export const dynamic = 'force-dynamic';

const exposureColour = (score: number) =>
  score >= 15 ? 'text-destructive font-bold text-3xl' :
  score >= 8  ? 'text-amber-600 font-bold text-3xl' :
                'text-green-600 font-bold text-3xl';

interface Props { params: Promise<{ id: string }> }

export default async function RiskDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: risk }, { data: revisions }, { data: registers }] = await Promise.all([
    supabase.from('risks').select('*, risk_registers(title)').eq('id', id).single(),
    supabase.from('risk_revisions').select('*').eq('risk_id', id).order('created_at', { ascending: false }),
    supabase.from('risk_registers').select('id, title').eq('status', 'active'),
  ]);

  if (!risk) notFound();

  const register = risk.risk_registers as { title: string } | null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${risk.identifier} — ${risk.title}`}
        description={register?.title ?? ''}
        actions={
          <div className="flex items-center gap-2">
            <RiskStatusActions id={risk.id} status={risk.status} />
            <Button variant="outline" asChild><Link href="/risk">Back</Link></Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Category:</span> {risk.category}</p>
              <p><span className="text-muted-foreground">Owner:</span> {risk.owner}</p>
              <p><span className="text-muted-foreground">Treatment:</span> {risk.treatment}</p>
              <p><span className="text-muted-foreground">Status:</span> {risk.status}</p>
              {risk.treatment_deadline && (
                <p><span className="text-muted-foreground">Deadline:</span> {risk.treatment_deadline}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center gap-1">
              <p className={exposureColour(risk.exposure)}>{risk.exposure}</p>
              <p className="text-xs text-muted-foreground">Exposure score</p>
              <p className="text-xs text-muted-foreground">L:{risk.likelihood} × I:{risk.impact}</p>
              {risk.methodology && (
                <p className="text-xs text-muted-foreground mt-2 text-center">{risk.methodology}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {risk.description && (
          <Card>
            <CardContent className="pt-6 text-sm">{risk.description}</CardContent>
          </Card>
        )}

        {risk.treatment_plan && (
          <Card>
            <CardHeader><CardTitle>Treatment Plan</CardTitle></CardHeader>
            <CardContent className="text-sm">{risk.treatment_plan}</CardContent>
          </Card>
        )}

        {revisions && revisions.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Revision History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {revisions.map((rev) => (
                  <div key={rev.id} className="px-6 py-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="font-medium">L:{rev.likelihood} × I:{rev.impact} = {rev.exposure}</span>
                        <span className="ml-3 text-muted-foreground">{rev.treatment}</span>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {rev.assessed_by} · {rev.assessed_at}
                      </div>
                    </div>
                    {rev.reason && <p className="text-xs text-muted-foreground mt-0.5">{rev.reason}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Edit Risk</CardTitle></CardHeader>
          <CardContent>
            <RiskForm registers={registers ?? []} risk={risk} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
