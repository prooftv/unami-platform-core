import { PageHeader } from '@unami/ui';
import { fetchRegisteredNodes } from '@/lib/nodes/fetcher';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Cpu, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';

const STATUS_ICON = {
  healthy:     <CheckCircle2 className="h-4 w-4 text-green-500" />,
  degraded:    <AlertTriangle className="h-4 w-4 text-amber-500" />,
  unreachable: <WifiOff className="h-4 w-4 text-destructive" />,
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  healthy:     'default',
  degraded:    'secondary',
  unreachable: 'destructive',
};

export default async function NodesPage() {
  const nodes = await fetchRegisteredNodes();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registered Nodes"
        description="Governance nodes connected to the Control Centre"
      />

      <div className="max-w-3xl space-y-6">
        {nodes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <WifiOff className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No nodes connected</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Set <span className="font-mono">UMKHANDLU_NODE_API_KEY</span> in environment variables to connect the first governance node.
              </p>
            </CardContent>
          </Card>
        ) : (
          nodes.map(({ identity, health }) => (
            <Card key={identity.id}>
              <CardHeader className="border-b pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{identity.name}</CardTitle>
                    <CardDescription className="mt-0.5">{identity.authority}</CardDescription>
                  </div>
                  <Badge variant={STATUS_VARIANT[health?.status ?? 'unreachable']}>
                    {health?.status ?? 'unreachable'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Location</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {identity.location}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Version</p>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      Contract v{identity.contractVersion} · Node v{identity.version}
                    </div>
                  </div>
                  {health && (
                    <>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Records</p>
                        <div className="flex items-center gap-1.5 text-sm">
                          {STATUS_ICON[health.status]}
                          {health.recordCount} records
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Notices</p>
                        <p className="text-sm">{health.noticeCount} notices</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Capabilities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {identity.capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                {health?.lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated {new Date(health.lastUpdated).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
