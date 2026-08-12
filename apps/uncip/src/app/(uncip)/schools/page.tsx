import Link from 'next/link';
import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@unami/ui';
import { School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PROVINCE_LABELS } from '@/domain/uncip/types';

export default async function SchoolsPage() {
  const [session, client] = await Promise.all([getUNCIPSession(), getUNCIPClient()]);
  const res = await client?.schools.list();
  const schools = res?.data ?? [];
  const isAdmin = session?.role === 'admin';

  const actions = isAdmin ? (
    <Button asChild><Link href="/schools/new">Add School</Link></Button>
  ) : undefined;

  if (schools.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Schools" description="Schools registered in the UNCIP system." actions={actions} />
        <EmptyState title="No schools registered" description="Schools will appear here once added by an administrator." icon={School} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Schools" description={`${schools.length} schools registered.`} actions={actions} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <Card key={school.id}>
            <CardContent className="pt-4 space-y-1">
              <p className="font-medium text-sm">{school.name}</p>
              <p className="text-xs text-muted-foreground">{school.address}</p>
              <Badge variant="outline" className="text-xs capitalize">
                {PROVINCE_LABELS[school.province] ?? school.province}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
