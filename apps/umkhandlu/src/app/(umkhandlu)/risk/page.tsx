import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const exposureColour = (score: number) => {
  if (score >= 15) return 'text-destructive font-semibold';
  if (score >= 8)  return 'text-amber-600 font-semibold';
  return 'text-green-600';
};

const statusColour: Record<string, string> = {
  open:             'bg-red-100 text-red-800',
  'under-treatment':'bg-amber-100 text-amber-800',
  closed:           'bg-green-100 text-green-800',
  accepted:         'bg-gray-100 text-gray-700',
};

export default async function RiskPage() {
  const supabase = createServiceClient();

  const { data: risks } = await supabase
    .from('risks')
    .select('*, risk_registers(title)')
    .order('exposure', { ascending: false });

  const rows = risks ?? [];
  const critical = rows.filter((r) => r.exposure >= 15).length;
  const high     = rows.filter((r) => r.exposure >= 8 && r.exposure < 15).length;
  const open     = rows.filter((r) => r.status === 'open' || r.status === 'under-treatment').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Register"
        description="Governance, spatial, data and operational risks for Amajuba District."
        actions={
          <Button asChild>
            <Link href="/risk/new">Add risk</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-destructive">{critical}</p>
          <p className="text-sm text-muted-foreground">Critical (score ≥ 15)</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-amber-600">{high}</p>
          <p className="text-sm text-muted-foreground">High (score 8–14)</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold">{open}</p>
          <p className="text-sm text-muted-foreground">Open / under treatment</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Risks</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No risks recorded. Add a risk to begin building the register.
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((risk) => {
                const register = risk.risk_registers as { title: string } | null;
                return (
                  <div key={risk.id} className="relative px-6 py-4 space-y-1 hover:bg-muted/30">
                    <Link href={`/risk/${risk.id}`} className="absolute inset-0" aria-label={risk.title} />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{risk.identifier} — {risk.title}</p>
                        <p className="text-xs text-muted-foreground">{register?.title ?? '—'} · {risk.category} · Owner: {risk.owner}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-sm ${exposureColour(risk.exposure)}`}>
                          {risk.exposure}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[risk.status] ?? ''}`}>
                          {risk.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>L:{risk.likelihood} × I:{risk.impact}</span>
                      <span>Treatment: {risk.treatment}</span>
                      {risk.treatment_deadline && <span>Deadline: {risk.treatment_deadline}</span>}
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
