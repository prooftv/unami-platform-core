import Link from 'next/link';
import { getUNCIPSession, getUNCIPClient } from '@/lib/auth/operator';
import { PageHeader, EmptyState } from '@unami/ui';
import { School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SchoolSummaryCard } from '@/components/uncip/school/SchoolSummaryCard';

export default async function SchoolsPage() {
  const [session, client] = await Promise.all([getUNCIPSession(), getUNCIPClient()]);
  const schools = await client?.schools.list().then((r) => r.data).catch(() => []) ?? [];
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
          <SchoolSummaryCard key={school.id} school={school} />
        ))}
      </div>
    </div>
  );
}
