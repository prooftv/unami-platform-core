import { notFound } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { FindingForm } from '../_components/FindingForm';
import { RemediationPanel } from '../_components/RemediationPanel';

export const dynamic = 'force-dynamic';

const severityColour: Record<string, string> = {
  critical: 'bg-red-200 text-red-900',
  high:     'bg-red-100 text-red-800',
  medium:   'bg-amber-100 text-amber-800',
  low:      'bg-gray-100 text-gray-700',
};

interface Props { params: Promise<{ id: string }> }

export default async function FindingDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: finding }, { data: remediations }] = await Promise.all([
    supabase.from('findings').select('*').eq('id', id).single(),
    supabase.from('remediation_actions').select('*').eq('finding_id', id).order('created_at'),
  ]);

  if (!finding) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={finding.title}
        description={`${finding.finding_type} · ${finding.severity}`}
        actions={<Button variant="outline" asChild><Link href="/findings">Back</Link></Button>}
      />

      <div className="max-w-3xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Type:</span> {finding.finding_type}</p>
              <p><span className="text-muted-foreground">Owner:</span> {finding.owner}</p>
              <p><span className="text-muted-foreground">Identified:</span> {new Date(finding.identified_at).toLocaleDateString()}</p>
              {finding.closed_at && <p><span className="text-muted-foreground">Closed:</span> {new Date(finding.closed_at).toLocaleDateString()}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex flex-col items-center justify-center gap-2">
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${severityColour[finding.severity] ?? ''}`}>
                {finding.severity}
              </span>
              <span className="text-sm text-muted-foreground">{finding.status}</span>
            </CardContent>
          </Card>
        </div>

        {finding.description && (
          <Card>
            <CardContent className="pt-6 text-sm">{finding.description}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Remediation Actions</CardTitle></CardHeader>
          <CardContent>
            <RemediationPanel findingId={finding.id} actions={remediations ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Edit Finding</CardTitle></CardHeader>
          <CardContent>
            <FindingForm finding={finding} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
