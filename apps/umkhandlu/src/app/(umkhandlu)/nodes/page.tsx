import { PageHeader } from '@unami/ui';
import { fetchRegisteredNodes } from '@/lib/nodes/fetcher';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, MapPin, Cpu, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.map(({ identity, health }) => (
            <Card key={identity.id}>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">{identity.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5 truncate">{identity.authority}</CardDescription>
                  </div>
                  <Badge variant={STATUS_VARIANT[health?.status ?? 'unreachable']}>
                    {health?.status ?? 'unreachable'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {identity.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Cpu className="h-3.5 w-3.5 shrink-0" />
                  Contract v{identity.contractVersion} · Node v{identity.version}
                </div>
                {health && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {STATUS_ICON[health.status]}
                    {health.recordCount} records · {health.noticeCount} notices
                  </div>
                )}
                <div className="flex flex-wrap gap-1 pt-1">
                  {identity.capabilities.map((cap) => (
                    <Badge key={cap} variant="outline" className="text-[10px] px-1.5 py-0">
                      {cap}
                    </Badge>
                  ))}
                </div>
                {health?.lastUpdated && (
                  <p className="text-[10px] text-muted-foreground">
                    Updated {new Date(health.lastUpdated).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
