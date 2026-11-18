import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, parsePage, PAGE_SIZE } from '@/components/ui/pagination';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  correction_requested: 'Correction Requested',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'default',
  under_review: 'secondary',
  approved: 'outline',
  rejected: 'destructive',
  correction_requested: 'secondary',
};

const ACTIVITY_LABELS: Record<string, string> = {
  locality_mapping: 'Locality Mapping',
  infrastructure_inventory: 'Infrastructure Inventory',
  community_facilities: 'Community Facilities',
  development_monitoring: 'Development Monitoring',
  notice_site_verification: 'Notice Site Verification',
};

interface Props { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function FieldSubmissionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = parsePage(sp);
  const filterStatus = typeof sp.status === 'string' ? sp.status : '';
  const supabase = createServiceClient();

  // Status counts across all submissions
  const { data: allStatuses } = await supabase
    .from('field_submissions')
    .select('status');
  const counts = (allStatuses ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  let query = supabase
    .from('field_submissions')
    .select('id, activity_type, status, collector_display_name, created_at, geometry_type, gratisgis_submission_id', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filterStatus) query = query.eq('status', filterStatus);

  const { data: submissions, count } = await query
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const rows = submissions ?? [];
  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Submissions"
        description="Review and approve field collection submissions from GratisGIS Data Collection."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['pending', 'under_review', 'approved', 'rejected'] as const).map((status) => (
          <Link
            key={status}
            href={filterStatus === status ? '/spatial/field-submissions' : `/spatial/field-submissions?status=${status}`}
            className={`block rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
              filterStatus === status ? 'border-foreground bg-muted' : ''
            }`}
          >
            <p className="text-2xl font-semibold">{counts[status] ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{STATUS_LABELS[status]}</p>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Submissions</CardTitle>
            {filterStatus && (
              <Link href="/spatial/field-submissions" className="text-xs text-muted-foreground hover:text-foreground underline">
                Clear filter
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              {filterStatus
                ? `No ${STATUS_LABELS[filterStatus]?.toLowerCase()} submissions.`
                : 'No field submissions received yet. Submissions arrive when collectors sync from GratisGIS Data Collection.'}
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((s) => (
                <Link
                  key={s.id}
                  href={`/spatial/field-submissions/${s.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium">
                      {ACTIVITY_LABELS[s.activity_type] ?? s.activity_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.collector_display_name} · {s.geometry_type ?? 'No geometry'} ·{' '}
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {s.gratisgis_submission_id}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[s.status] ?? 'outline'}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
          <div className="px-6 border-t">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              baseUrl={`/spatial/field-submissions${filterStatus ? `?status=${filterStatus}` : ''}`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
