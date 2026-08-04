import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NodesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Registered Nodes"
        description="Governance nodes connected to the Control Centre"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Phase 18B — Node Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Node registration is built in Phase 18B. The first node to connect is{' '}
            <span className="font-mono text-xs">umkhandlu.unamifoundation.org</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
