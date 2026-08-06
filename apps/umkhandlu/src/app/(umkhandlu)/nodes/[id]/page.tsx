import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { fetchNodeIdentity } from '@/lib/nodes/fetcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Cpu } from 'lucide-react';
import { NodeOperatorsWidget } from '@/app/(umkhandlu)/dashboard/widgets/OperatorWidgets';

const CAPABILITY_LABELS: Record<string, string> = {
  'governance':           'Governance',
  'participation':        'Participation',
  'evidence':             'Evidence',
  'commercial':           'Commercial',
  'tcrs':                 'TCRS',
  'institutional-memory': 'Institutional Memory',
  'health':               'Health',
  'operators':            'Operators',
};

function formatLocation(location: { province: string; district?: string; municipality: string; locality?: string } | null): string {
  if (!location) return '—';
  return [location.locality, location.municipality, location.province].filter(Boolean).join(', ');
}

export default async function NodeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await fetchNodeIdentity(id);
  if (!result) notFound();

  const { node, identity, operators } = result;

  return (
    <div className="space-y-6">
      <PageHeader
        title={identity.name}
        description={identity.authority}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/nodes"><ArrowLeft className="h-4 w-4" />Nodes</Link>
          </Button>
        }
      />

      <div className="max-w-3xl space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold">Node Identity</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{formatLocation(identity.location)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>Contract v{identity.contractVersion}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground text-xs">Node ID</span>
                <span className="font-mono text-xs text-muted-foreground">{node.id}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-sm font-semibold">Capabilities</CardTitle>
              <CardDescription className="text-xs mt-0.5">Intelligence endpoints this node exposes</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-1.5">
                {identity.capabilities.map((cap) => (
                  <Badge key={cap} variant="outline" className="text-xs">
                    {CAPABILITY_LABELS[cap] ?? cap}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {operators ? (
          <NodeOperatorsWidget
            nodeId={node.id}
            nodeName={identity.name}
            nodeAuthority={identity.authority}
            summary={operators}
          />
        ) : (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Operator data unavailable
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
