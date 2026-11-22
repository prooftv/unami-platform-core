import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { DiscrepancyReviewForm } from './_components/DiscrepancyReviewForm';

export const dynamic = 'force-dynamic';

function QualityBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const colour =
    pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-destructive';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-16 text-right">
        {value}/{total} ({pct}%)
      </span>
    </div>
  );
}

export default async function DataQualityPage() {
  const supabase = createServiceClient();

  const [
    { data: sources },
    { data: datasets },
    { data: stagedFeatures },
    { data: fieldSubmissions },
    { data: notices },
  ] = await Promise.all([
    supabase
      .from('spatial_sources')
      .select('id, name, active, last_checked_at, permission_classification, description, geographic_coverage, coordinate_system'),
    supabase
      .from('spatial_datasets')
      .select('id, name, status, active, feature_count, dataset_date, attribution, crs, permission_classification, last_processed_at, source_id'),
    supabase
      .from('spatial_staged_features')
      .select('id, geometry_valid, geometry_issues, operator_status, dataset_id'),
    supabase
      .from('field_submissions')
      .select('id, status, geometry_geojson, geometry_type, gps_accuracy_metres, attributes'),
    supabase
      .from('notices')
      .select('id, status, latitude, longitude, ward_ref, type, comment_deadline'),
  ]);

  const src = sources ?? [];
  const ds = datasets ?? [];
  const sf = stagedFeatures ?? [];
  const fs = fieldSubmissions ?? [];
  const ns = notices ?? [];

  // ── Source quality ──────────────────────────────────────────────────────────
  const srcActive = src.filter((s) => s.active).length;
  const srcCheckedRecently = src.filter((s) => {
    if (!s.last_checked_at) return false;
    return new Date(s.last_checked_at) > new Date(Date.now() - 7 * 86400_000);
  }).length;
  const srcWithDescription = src.filter((s) => s.description).length;
  const srcPermConfirmed = src.filter((s) =>
    ['download', 'redistribute', 'internal', 'display', 'reference'].includes(s.permission_classification),
  ).length;
  const srcWithCoverage = src.filter((s) => s.geographic_coverage).length;

  // ── Dataset quality ─────────────────────────────────────────────────────────
  const dsPublished = ds.filter((d) => d.status === 'published').length;
  const dsWithFeatureCount = ds.filter((d) => d.feature_count != null).length;
  const dsWithDate = ds.filter((d) => d.dataset_date).length;
  const dsWithAttribution = ds.filter((d) => d.attribution).length;
  const dsWithCrs = ds.filter((d) => d.crs).length;
  const dsPermConfirmed = ds.filter((d) =>
    ['download', 'redistribute', 'internal', 'display', 'reference'].includes(d.permission_classification),
  ).length;

  // ── Staged feature quality ──────────────────────────────────────────────────
  const sfValid = sf.filter((f) => f.geometry_valid).length;
  const sfApproved = sf.filter((f) => f.operator_status === 'approved').length;
  const sfWithIssues = sf.filter((f) => f.geometry_issues && (f.geometry_issues as unknown[]).length > 0).length;

  // ── Field submission quality ────────────────────────────────────────────────
  const fsWithGeometry = fs.filter((f) => f.geometry_geojson != null).length;
  const fsWithAccuracy = fs.filter((f) => f.gps_accuracy_metres != null).length;
  const fsApproved = fs.filter((f) => f.status === 'approved').length;
  const fsPending = fs.filter((f) => ['pending', 'under_review'].includes(f.status)).length;

  // ── Notice quality ──────────────────────────────────────────────────────────
  const nsWithCoords = ns.filter((n) => n.latitude != null && n.longitude != null).length;
  const nsWithWard = ns.filter((n) => n.ward_ref).length;
  const nsPublished = ns.filter((n) => ['published', 'open'].includes(n.status)).length;
  const nsStatutoryWithDeadline = ns.filter((n) =>
    ['eia', 'rezoning', 'land-use', 'township', 'building', 'mining', 'liquor', 'telecom'].includes(n.type) &&
    n.comment_deadline,
  ).length;
  const nsStatutory = ns.filter((n) =>
    ['eia', 'rezoning', 'land-use', 'township', 'building', 'mining', 'liquor', 'telecom'].includes(n.type),
  ).length;

  // ── Coordinate discrepancies ────────────────────────────────────────────────
  const { data: discrepancies } = await supabase
    .from('spatial_coordinate_discrepancies')
    .select('id, subject_id, subject_type, subject_label, gn_record_id, gn_source_name, gn_coordinate_role, gn_lat, gn_lng, gn_location_precision, gn_verification_status, cc_feature_id, cc_source_name, cc_coordinate_role, cc_lat, cc_lng, cc_location_precision, cc_verification_status, distance_metres, rule_id, rule_threshold_metres, review_status, detected_at')
    .in('review_status', ['pending-review', 'requires-configuration'])
    .order('detected_at', { ascending: false })
    .limit(50);

  const { data: allDiscrepancies } = await supabase
    .from('spatial_coordinate_discrepancies')
    .select('review_status', { count: 'exact' });

  const discrepancyStatusCounts = (allDiscrepancies ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.review_status] = (acc[r.review_status] ?? 0) + 1;
    return acc;
  }, {});

  const pendingDiscrepancies = discrepancies ?? [];

  const assessedAt = new Date().toLocaleString();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Quality"
        description={`Completeness and integrity measurements across spatial data, submissions and notices. Assessed ${assessedAt}.`}
      />

      <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
        These are completeness measurements, not quality certifications. A high score means fields are populated — it does not confirm accuracy, currency or fitness for a specific purpose.
      </div>

      {/* Sources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Sources ({src.length})</CardTitle>
            <Link href="/spatial/sources" className="text-xs text-muted-foreground hover:underline">View sources →</Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {src.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sources registered.</p>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Active</span>
                </div>
                <QualityBar value={srcActive} total={src.length} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Checked in last 7 days</span>
                </div>
                <QualityBar value={srcCheckedRecently} total={src.length} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Permission confirmed</span>
                </div>
                <QualityBar value={srcPermConfirmed} total={src.length} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Has description</span>
                </div>
                <QualityBar value={srcWithDescription} total={src.length} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Geographic coverage recorded</span>
                </div>
                <QualityBar value={srcWithCoverage} total={src.length} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Datasets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Datasets ({ds.length})</CardTitle>
            <Link href="/spatial/datasets" className="text-xs text-muted-foreground hover:underline">View datasets →</Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {ds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No datasets registered.</p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Published</p>
                <QualityBar value={dsPublished} total={ds.length} />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Feature count recorded</p>
                <QualityBar value={dsWithFeatureCount} total={ds.length} />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Dataset date recorded</p>
                <QualityBar value={dsWithDate} total={ds.length} />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Attribution recorded</p>
                <QualityBar value={dsWithAttribution} total={ds.length} />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">CRS recorded</p>
                <QualityBar value={dsWithCrs} total={ds.length} />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Permission confirmed</p>
                <QualityBar value={dsPermConfirmed} total={ds.length} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Staged features */}
      {sf.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Staged Features ({sf.length})</CardTitle>
              <Link href="/spatial/staging" className="text-xs text-muted-foreground hover:underline">View staging →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Geometry valid</p>
              <QualityBar value={sfValid} total={sf.length} />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Operator approved</p>
              <QualityBar value={sfApproved} total={sf.length} />
            </div>
            {sfWithIssues > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2">
                {sfWithIssues} feature{sfWithIssues !== 1 ? 's' : ''} have recorded geometry issues.{' '}
                <Link href="/spatial/staging" className="underline">Review in staging.</Link>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Field submissions */}
      {fs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Field Submissions ({fs.length})</CardTitle>
              <Link href="/spatial/field-submissions" className="text-xs text-muted-foreground hover:underline">View submissions →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Has geometry</p>
              <QualityBar value={fsWithGeometry} total={fs.length} />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">GPS accuracy recorded</p>
              <QualityBar value={fsWithAccuracy} total={fs.length} />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Approved</p>
              <QualityBar value={fsApproved} total={fs.length} />
            </div>
            {fsPending > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2">
                {fsPending} submission{fsPending !== 1 ? 's' : ''} awaiting review.{' '}
                <Link href="/spatial/field-submissions?status=pending" className="underline">Review now.</Link>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Coordinate discrepancies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Coordinate Discrepancies
              {pendingDiscrepancies.length > 0 && (
                <span className="ml-2 text-xs font-normal text-amber-700 bg-amber-100 rounded px-2 py-0.5">
                  {pendingDiscrepancies.length} pending review
                </span>
              )}
            </CardTitle>
            <Link href="/spatial/staging" className="text-xs text-muted-foreground hover:underline">View staging →</Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded border bg-amber-50 dark:bg-amber-950/20 border-amber-200 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            A discrepancy is a flag for human review — not proof of error, misconduct or incorrect official data.
            Both original source values are preserved. No coordinate is overwritten.
          </div>

          {/* Status summary */}
          {Object.keys(discrepancyStatusCounts).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(discrepancyStatusCounts).map(([status, count]) => (
                <span key={status} className="text-xs border rounded px-2 py-0.5 text-muted-foreground">
                  {status}: {count}
                </span>
              ))}
            </div>
          )}

          {/* Unconfigured threshold rules notice */}
          {pendingDiscrepancies.some((d) => d.review_status === 'requires-configuration') && (
            <div className="rounded border border-blue-200 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 text-xs text-blue-800 dark:text-blue-300">
              Some discrepancies are marked <strong>requires-configuration</strong> — no threshold rule is active for their source/precision combination.
              Activate rules in the <code>spatial_discrepancy_rules</code> table to enable automatic threshold assessment.
            </div>
          )}

          {pendingDiscrepancies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No discrepancies pending review.</p>
          ) : (
            <div className="space-y-4">
              {pendingDiscrepancies.map((d) => (
                <div key={d.id} className="rounded border p-3 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{d.subject_label ?? d.subject_id}</p>
                      <p className="text-muted-foreground">{d.subject_type} · detected {new Date(d.detected_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 font-medium ${
                      d.review_status === 'requires-configuration'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {d.review_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded bg-muted/50 p-2 space-y-0.5">
                      <p className="font-medium">Source A — {d.gn_source_name}</p>
                      <p className="text-muted-foreground">Role: {d.gn_coordinate_role}</p>
                      <p className="text-muted-foreground">Precision: {d.gn_location_precision ?? 'not recorded'}</p>
                      <p className="text-muted-foreground">Verification: {d.gn_verification_status}</p>
                      <p className="font-mono">{d.gn_lat.toFixed(6)}, {d.gn_lng.toFixed(6)}</p>
                    </div>
                    <div className="rounded bg-muted/50 p-2 space-y-0.5">
                      <p className="font-medium">Source B — {d.cc_source_name}</p>
                      <p className="text-muted-foreground">Role: {d.cc_coordinate_role}</p>
                      <p className="text-muted-foreground">Precision: {d.cc_location_precision ?? 'not recorded'}</p>
                      <p className="text-muted-foreground">Verification: {d.cc_verification_status}</p>
                      <p className="font-mono">{d.cc_lat.toFixed(6)}, {d.cc_lng.toFixed(6)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>Distance: <strong className="text-foreground">{d.distance_metres >= 1000 ? `${(d.distance_metres / 1000).toFixed(2)} km` : `${Math.round(d.distance_metres)} m`}</strong></span>
                    <span>Method: haversine-wgs84</span>
                    {d.rule_id && <span>Rule: {d.rule_id} (threshold {d.rule_threshold_metres} m)</span>}
                    {!d.rule_id && <span className="text-blue-700">No threshold rule configured</span>}
                  </div>

                  <div className="flex gap-2">
                    {d.gn_record_id && (
                      <a
                        href={`https://umkhandlu.unamifoundation.org`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline text-muted-foreground"
                      >
                        View GN record ↗
                      </a>
                    )}
                    {d.cc_feature_id && (
                      <Link href={`/spatial/staging`} className="text-xs underline text-muted-foreground">
                        View CC feature ↗
                      </Link>
                    )}
                  </div>

                  <DiscrepancyReviewForm discrepancyId={d.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notices ({ns.length})</CardTitle>
            <Link href="/notices" className="text-xs text-muted-foreground hover:underline">View notices →</Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {ns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notices recorded.</p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Has coordinates</p>
                <QualityBar value={nsWithCoords} total={ns.length} />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Ward reference recorded</p>
                <QualityBar value={nsWithWard} total={ns.length} />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Published or open</p>
                <QualityBar value={nsPublished} total={ns.length} />
              </div>
              {nsStatutory > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Statutory notices with comment deadline</p>
                  <QualityBar value={nsStatutoryWithDeadline} total={nsStatutory} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
