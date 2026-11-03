import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { fetchRecordParticipation, getRegisteredNodes } from '@/lib/nodes/fetcher';
import { getNodeClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, FileText, Link2 } from 'lucide-react';

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

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  adopted: 'default',
  approved: 'default',
  pending: 'outline',
  resolved: 'secondary',
  rejected: 'destructive',
};

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch { return null; }
}

export default async function RecordIntelligencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nodeUrl?: string }>;
}) {
  const { id } = await params;
  const { nodeUrl } = await searchParams;

  if (!nodeUrl) notFound();
  const nodes = await getRegisteredNodes();
  const node = nodes.find((n) => n.url === nodeUrl);
  if (!node) notFound();

  // Authoritative record detail from node API v1.1
  const client = getNodeClient(node.url, node.api_key);
  const [detailResult, participation] = await Promise.all([
    safe(() => client.recordDetail(id)),
    fetchRecordParticipation(nodeUrl, id),
  ]);

  const record = detailResult?.record ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={record?.title ?? id}
        description={`${node.authority} · ${record?.recordType ?? '—'}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/intelligence/governance">
              <ArrowLeft className="h-4 w-4" />
              Governance
            </Link>
          </Button>
        }
      />

      <div className="max-w-3xl space-y-6">
        {/* Record metadata */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold">Record</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{record?.recordType ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                {record?.status ? (
                  <Badge variant={STATUS_VARIANT[record.status] ?? 'outline'}>{record.status}</Badge>
                ) : <span>—</span>}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{record?.date ? new Date(record.date).toLocaleDateString('en-ZA') : '—'}</span>
              </div>
              {record?.location && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-right max-w-[60%]">{record.location}</span>
                </div>
              )}
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
              {record?.approvedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved by</span>
                  <span>{record.approvedBy.firstName} {record.approvedBy.lastName}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {record?.summary && (
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{record.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Lineage */}
        {(record?.originNotice || record?.parentRecord || (record?.childRecords?.length ?? 0) > 0) && (
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Governance Lineage</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              {record?.originNotice && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Origin Notice</p>
                  <p className="font-medium">{record.originNotice.title}</p>
                  <p className="text-xs text-muted-foreground">{record.originNotice.noticeType}</p>
                </div>
              )}
              {record?.parentRecord && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Parent Record</p>
                  <p className="font-medium">{record.parentRecord.title}</p>
                  <p className="text-xs text-muted-foreground">{record.parentRecord.recordType}</p>
                </div>
              )}
              {record?.childRecords && record.childRecords.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Child Records ({record.childRecords.length})
                  </p>
                  <div className="space-y-1.5">
                    {record.childRecords.map((c) => (
                      <div key={c._id} className="flex items-center justify-between">
                        <span>{c.title}</span>
                        <Badge variant="outline" className="text-xs">{c.recordType}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Evidence */}
        {record?.evidence && record.evidence.length > 0 && (
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">
                  Evidence ({record.evidence.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {record.evidence.map((doc) => (
                <a
                  key={doc._key}
                  href={doc.url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  <span className="shrink-0">📄</span>
                  <span className="flex-1 min-w-0 truncate">{doc.title || 'Document'}</span>
                  <span className="text-xs text-primary shrink-0">Download →</span>
                </a>
              ))}
            </CardContent>
          </Card>
        )}

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

        {!record && (
          <Card>
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Could not retrieve authoritative record data from the governance node.
                The node may be temporarily unavailable.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
