import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { fetchRecordParticipation, getRegisteredNodes } from '@/lib/nodes/fetcher';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';

const PARTICIPATION_TYPE_LABELS: Record<string, string> = {
  comment: 'Comments',
  support: 'Support',
  objection: 'Objections',
  question: 'Questions',
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  resident: 'Resident',
  landowner: 'Landowner',
  business: 'Business',
  community: 'Community',
  organisation: 'Organisation',
  other: 'Other',
};

export default async function RecordIntelligencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nodeUrl?: string; title?: string; type?: string; status?: string; date?: string }>;
}) {
  const { id } = await params;
  const { nodeUrl, title, type, status, date } = await searchParams;

  // Validate nodeUrl against the registered-node registry — never trust arbitrary input
  if (!nodeUrl) notFound();
  const nodes = await getRegisteredNodes();
  const node = nodes.find((n) => n.url === nodeUrl);
  if (!node) notFound();

  const participation = await fetchRecordParticipation(nodeUrl, id);

  const displayTitle = title ? decodeURIComponent(title) : id;
  const displayType  = type   ? decodeURIComponent(type)  : '—';
  const displayDate  = date   ? decodeURIComponent(date)  : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayTitle}
        description={`${node.authority} · ${displayType}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/intelligence/governance"><ArrowLeft className="h-4 w-4" />Governance</Link>
          </Button>
        }
      />

      <div className="max-w-3xl space-y-6">
        {/* Governance state */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold">Record</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{displayType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                {status ? <Badge variant="outline">{status}</Badge> : <span>—</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{displayDate}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold">Node</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Authority</span>
                <span className="text-right">{node.authority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Node ID</span>
                <span className="font-mono text-xs text-muted-foreground">{node.node_id ?? '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participation intelligence */}
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Participation Intelligence</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {participation
                  ? `${participation.total} response${participation.total !== 1 ? 's' : ''} recorded`
                  : 'No participation responses recorded for this record'}
              </CardDescription>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            {!participation || participation.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No participation signals for this record.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Response Type</p>
                  {Object.entries(participation.byType).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{PARTICIPATION_TYPE_LABELS[k] ?? k}</span>
                      <Badge variant="outline">{v}</Badge>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Relationship</p>
                  {Object.entries(participation.byRelationship).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{RELATIONSHIP_LABELS[k] ?? k}</span>
                      <Badge variant="outline">{v}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {participation?.lastSubmission && (
              <p className="text-xs text-muted-foreground mt-4">
                Last submission: {new Date(participation.lastSubmission).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
