import { getOperatorSession } from '@/lib/auth/operator';
import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await getOperatorSession();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unami Control Centre"
        description="Cross-node governance intelligence — connecting to deployed governance nodes"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Connected Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Governance nodes registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Node Health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Nodes reporting healthy</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Operator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{session!.email}</p>
            <p className="text-xs text-muted-foreground mt-1">{session!.role}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Phase 18B — Node Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The Control Centre connects to deployed governance nodes via read-only APIs.
            Node registration and health views are built in Phase 18B and 18C.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
