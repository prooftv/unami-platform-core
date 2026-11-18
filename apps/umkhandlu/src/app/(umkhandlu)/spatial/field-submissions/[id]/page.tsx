import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@unami/ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/server';
import { SubmissionReviewActions } from '../_components/SubmissionReviewActions';

export const dynamic = 'force-dynamic';

const ACTIVITY_LABELS: Record<string, string> = {
  locality_mapping: 'Locality Mapping',
  infrastructure_inventory: 'Infrastructure Inventory',
  community_facilities: 'Community Facilities',
  development_monitoring: 'Development Monitoring',
  notice_site_verification: 'Notice Site Verification',
};

export default async function FieldSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: submission }, { data: events }, { data: attachments }] = await Promise.all([
    supabase
      .from('field_submissions')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('field_submission_events')
      .select('*')
      .eq('submission_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('field_submission_attachments')
      .select('*')
      .eq('submission_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (!submission) notFound();

  const attrs = (submission.attributes as Record<string, unknown>) ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={ACTIVITY_LABELS[submission.activity_type] ?? submission.activity_type}
          description={`Submitted by ${submission.collector_display_name} · ${new Date(submission.created_at).toLocaleString()}`}
        />
        <Link href="/spatial/field-submissions" className="text-sm text-muted-foreground hover:underline shrink-0 mt-1">
          ← Back to inbox
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status and actions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Review</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge>{submission.status}</Badge>
            </div>
            {submission.review_notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Review notes</p>
                <p className="text-sm">{submission.review_notes}</p>
              </div>
            )}
            {['pending', 'under_review', 'correction_requested'].includes(submission.status) && (
              <SubmissionReviewActions submissionId={id} currentStatus={submission.status} />
            )}
            {submission.approved_feature_id && (
              <p className="text-xs text-muted-foreground">
                Promoted to staged feature:{' '}
                <span className="font-mono">{submission.approved_feature_id}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Provenance */}
        <Card>
          <CardHeader><CardTitle className="text-base">Provenance</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collector</span>
              <span>{submission.collector_display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Activity</span>
              <span>{ACTIVITY_LABELS[submission.activity_type] ?? submission.activity_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Geometry</span>
              <span>{submission.geometry_type ?? 'None'}</span>
            </div>
            {submission.gps_accuracy_metres != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GPS accuracy</span>
                <span>{submission.gps_accuracy_metres}m</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">GratisGIS ID</span>
              <span className="font-mono text-xs truncate max-w-[180px]">{submission.gratisgis_submission_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Collection</span>
              <span className="font-mono text-xs truncate max-w-[180px]">{submission.gratisgis_collection_id}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attributes */}
      {Object.keys(attrs).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Captured Attributes</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {Object.entries(attrs).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 text-sm">
                  <span className="text-muted-foreground font-mono">{key}</span>
                  <span className="max-w-[60%] text-right break-words">
                    {value === null || value === undefined ? (
                      <span className="text-muted-foreground italic">—</span>
                    ) : typeof value === 'object' ? (
                      <span className="font-mono text-xs">{JSON.stringify(value)}</span>
                    ) : (
                      String(value)
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geometry */}
      {submission.geometry_geojson && (
        <Card>
          <CardHeader><CardTitle className="text-base">Geometry (GeoJSON)</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-48">
              {JSON.stringify(submission.geometry_geojson, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {(attachments ?? []).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Attachments</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {(attachments ?? []).map((a) => (
                <div key={a.id} className="px-6 py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{a.filename}</p>
                    {a.caption && <p className="text-xs text-muted-foreground">{a.caption}</p>}
                    <p className="text-xs text-muted-foreground">{a.mime_type}</p>
                  </div>
                  {a.public_url ? (
                    <a href={a.public_url} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not yet published</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit trail */}
      {(events ?? []).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Audit Trail</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {(events ?? []).map((e) => (
                <div key={e.id} className="px-6 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{e.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">
                      {e.actor_type} · {new Date(e.created_at).toLocaleString()}
                    </span>
                  </div>
                  {e.notes && <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
