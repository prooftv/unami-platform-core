import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/server';
import { CollectorToggle } from '../_components/CollectorToggle';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  correction_requested: 'Correction Requested',
};

const ACTIVITY_LABELS: Record<string, string> = {
  locality_mapping: 'Locality Mapping',
  infrastructure_inventory: 'Infrastructure Inventory',
  community_facilities: 'Community Facilities',
  development_monitoring: 'Development Monitoring',
  notice_site_verification: 'Notice Site Verification',
};

export default async function CollectorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: collector }, { data: submissions }, { data: auditRows }] = await Promise.all([
    supabase
      .from('field_collectors')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('field_submissions')
      .select('id, activity_type, status, created_at, geometry_type')
      .eq('collector_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('gis_audit_log')
      .select('action, reason, created_at, actor')
      .eq('table_name', 'field_collectors')
      .eq('record_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (!collector) notFound();

  const rows = submissions ?? [];
  const counts = rows.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={collector.display_name}
          description={`GratisGIS collector · ${collector.active ? 'Active' : 'Inactive'}`}
        />
        <Link href="/spatial/collectors" className="text-sm text-muted-foreground hover:underline shrink-0 mt-1">
          ← Back to collectors
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Display name</span>
              <span>{collector.display_name}</span>
            </div>
            {collector.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{collector.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">GratisGIS user ID</span>
              <span className="font-mono text-xs">{collector.gratisgis_user_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={collector.active ? 'default' : 'secondary'}>
                {collector.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registered</span>
              <span>{new Date(collector.created_at).toLocaleDateString()}</span>
            </div>
            <div className="pt-2 border-t">
              <CollectorToggle collectorId={collector.id} active={collector.active} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Submission Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total submissions</span>
              <span className="font-semibold">{rows.length}</span>
            </div>
            {Object.entries(counts).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="text-muted-foreground">{STATUS_LABELS[status] ?? status}</span>
                <span>{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Submission History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No submissions from this collector.
            </div>
          ) : (
            <div className="divide-y">
              {rows.map((s) => (
                <Link
                  key={s.id}
                  href={`/spatial/field-submissions/${s.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {ACTIVITY_LABELS[s.activity_type] ?? s.activity_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.geometry_type ?? 'No geometry'} · {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(auditRows ?? []).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Account History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {(auditRows ?? []).map((row, i) => (
                <div key={i} className="px-6 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{row.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.actor} · {new Date(row.created_at).toLocaleString()}
                    </span>
                  </div>
                  {row.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5">{row.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
