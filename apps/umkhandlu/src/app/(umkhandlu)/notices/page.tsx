import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const statusColour: Record<string, string> = {
  draft:      'bg-gray-100 text-gray-700',
  published:  'bg-blue-100 text-blue-800',
  open:       'bg-green-100 text-green-800',
  closed:     'bg-gray-100 text-gray-700',
  approved:   'bg-green-100 text-green-800',
  rejected:   'bg-red-100 text-red-800',
  withdrawn:  'bg-amber-100 text-amber-800',
  archived:   'bg-gray-100 text-gray-600',
};

export default async function NoticesPage() {
  const supabase = createServiceClient();

  const { data: notices } = await supabase
    .from('notices')
    .select('id, type, title, status, is_statutory, comment_deadline, ward_ref, created_at')
    .order('created_at', { ascending: false });

  const rows = notices ?? [];
  const statutory = rows.filter((n) => n.is_statutory).length;
  const open      = rows.filter((n) => n.status === 'open').length;
  const today     = new Date();
  const expiring  = rows.filter((n) =>
    n.comment_deadline &&
    new Date(n.comment_deadline) > today &&
    new Date(n.comment_deadline) < new Date(today.getTime() + 7 * 86400_000) &&
    n.status === 'open'
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notices"
        description="Governance and statutory notices for Amajuba District. Statutory notices appear on the geographic map."
        actions={
          <Button asChild>
            <Link href="/notices/new">Add notice</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold">{rows.length}</p>
          <p className="text-sm text-muted-foreground">Total notices</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-blue-600">{statutory}</p>
          <p className="text-sm text-muted-foreground">Statutory</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-semibold text-amber-600">{expiring}</p>
          <p className="text-sm text-muted-foreground">Deadlines this week</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Notices</CardTitle>
            {open > 0 && (
              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                {open} open for comment
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No notices recorded. Add a notice to begin the register.
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((notice) => {
                const deadlineDate = notice.comment_deadline ? new Date(notice.comment_deadline) : null;
                const isExpiringSoon = deadlineDate && deadlineDate > today &&
                  deadlineDate < new Date(today.getTime() + 7 * 86400_000);
                return (
                  <div key={notice.id} className="relative px-6 py-4 space-y-1 hover:bg-muted/30">
                    <Link href={`/notices/${notice.id}`} className="absolute inset-0" aria-label={notice.title} />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{notice.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {notice.type.replace(/-/g, ' ')}
                          {notice.ward_ref ? ` · ${notice.ward_ref}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {notice.is_statutory && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800">
                            Statutory
                          </span>
                        )}
                        {isExpiringSoon && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                            Deadline soon
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[notice.status] ?? ''}`}>
                          {notice.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {deadlineDate && (
                        <span>Comment deadline: {deadlineDate.toLocaleDateString()}</span>
                      )}
                      <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
