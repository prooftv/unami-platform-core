import { getOperatorSession } from '@/lib/auth/operator';
import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await getOperatorSession();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Governance Intelligence"
        description="Umkhandlu operator dashboard — institutional memory and governance health"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Governance records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Community and statutory notices</p>
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
    </div>
  );
}
