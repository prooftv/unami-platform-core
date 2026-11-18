import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default async function FieldSubmissionsPage() {
  const supabase = createServiceClient();

  const { data: submissions } = await supabase
    .from('field_submissions')
    .select('id, activity_type, status, collector_display_name, created_at, geometry_type, gratisgis_submission_id')
    .order('created_at', { ascending: false })
    .limit(100);

  const rows = submissions ?? [];

  const counts = rows.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Submissions"
        description="Review and approve field collection submissions from GratisGIS Data Collection."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['pending', 'under_review', 'approved', 'rejected'] as const).map((status) => (
          <Card key={status}>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-semibold">{counts[status] ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{STATUS_LABELS[status]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No field submissions received yet. Submissions arrive when collectors sync from GratisGIS Data Collection.
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
        </CardContent>
      </Card>
    </div>
  );
}
