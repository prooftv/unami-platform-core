import { PageHeader } from '@unami/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

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
