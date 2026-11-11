import { notFound } from 'next/navigation';
import { PageHeader } from '@unami/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { SourceForm } from '../_components/SourceForm';
import { SourceActions } from '../_components/SourceActions';
import { SourceInspector } from '../_components/SourceInspector';
import type { SpatialSource } from '@/lib/gis/spatial-sources-fetcher';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

const CLASSIFICATION_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  reference:    'secondary',
  display:      'secondary',
  internal:     'default',
  download:     'default',
  redistribute: 'default',
  restricted:   'destructive',
  prohibited:   'destructive',
  pending:      'outline',
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export default async function SourceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: source } = await supabase
    .from('spatial_sources')
    .select('*')
    .eq('id', id)
    .single();

  if (!source) notFound();

  const [{ data: recentRuns }, { data: permissionChanges }] = await Promise.all([
    supabase
      .from('spatial_pipeline_runs')
      .select('id, pipeline_type, status, started_at, completed_at, error_message')
      .eq('source_id', id)
      .order('started_at', { ascending: false })
      .limit(10),
    supabase
      .from('spatial_permission_changes')
      .select('id, actor, previous_classification, new_classification, reason, created_at')
      .eq('table_name', 'spatial_sources')
      .eq('record_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const s = source as SpatialSource;
  const classVariant = CLASSIFICATION_VARIANTS[s.permission_classification] ?? 'outline';
  const isHardRestricted = s.permission_classification === 'restricted' || s.permission_classification === 'prohibited';

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.name}
        description={s.institution}
        actions={
          <div className="flex items-center gap-2">
            <SourceActions id={s.id} active={s.active} />
            <Button variant="outline" asChild>
              <Link href="/spatial/sources">Back</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-6">

        {/* 1. Source identity + operational status */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Source Identity</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Field label="Institution" value={s.institution} />
              <Field label="Source type" value={s.source_type} />
              <Field label="Dataset identifier" value={s.dataset_identifier} />
              <Field label="Source URL" value={s.source_url} />
              {s.description && <p className="text-muted-foreground text-xs">{s.description}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Operational Status</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={s.active ? 'default' : 'outline'}>{s.active ? 'Active' : 'Inactive'}</Badge>
                <Badge variant={classVariant}>{s.permission_classification}</Badge>
              </div>
              <Field label="Coverage" value={s.geographic_coverage} />
              <Field label="CRS" value={s.coordinate_system} />
              <Field label="Dataset date" value={s.dataset_date} />
              <Field label="Last checked" value={s.last_checked_at ? new Date(s.last_checked_at).toLocaleString() : null} />
            </CardContent>
          </Card>
        </div>

        {/* Hard restriction warning */}
        {isHardRestricted && (
          <Card className="border-destructive">
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm font-medium text-destructive">
                {s.permission_classification === 'restricted' ? 'Restricted source' : 'Prohibited source'} — ingestion and publication are blocked
              </p>
              {s.restriction_authority && (
                <p className="text-xs text-muted-foreground">Authority: {s.restriction_authority}</p>
              )}
              {s.restriction_basis && (
                <p className="text-xs text-muted-foreground">{s.restriction_basis}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 2. Coverage and geography + 3. Technical connection */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Connection</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Field label="Base URL" value={s.base_url} />
              <Field label="Layer ID" value={s.layer_id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Four-Dimension Assessment</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Field label="Availability" value={s.availability_status} />
              <Field label="Technical usability" value={s.technical_usability} />
              <Field label="Authority" value={s.authority_status} />
              {s.assessment_notes && <p className="text-xs text-muted-foreground">{s.assessment_notes}</p>}
            </CardContent>
          </Card>
        </div>

        {/* 4. Permission and custodian */}
        <Card>
          <CardHeader><CardTitle>Permission and Custodian</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Permission classification</p>
                <Badge variant={classVariant}>{s.permission_classification}</Badge>
              </div>
              <Field label="Attribution" value={s.attribution} />
              <Field label="Licence or terms" value={s.licence_terms} />
              <Field label="Permission notes" value={s.permission_notes} />
            </div>
            <div className="space-y-3">
              <Field label="Custodian" value={s.custodian_name} />
              <Field label="Custodian email" value={s.custodian_email} />
              <Field label="Restriction authority" value={s.restriction_authority} />
              <Field label="Restriction basis" value={s.restriction_basis} />
            </div>
          </CardContent>
        </Card>

        {/* 5. Data integrity */}
        {s.notes && (
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* 7. Ingestion history */}
        {recentRuns && recentRuns.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Pipeline Runs</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentRuns.map((run) => (
                  <div key={run.id} className="px-6 py-3 flex items-center justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <p>{run.pipeline_type}</p>
                      {run.error_message && <p className="text-xs text-destructive">{run.error_message}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                      <span className={
                        run.status === 'success' ? 'text-green-600' :
                        run.status === 'failed'  ? 'text-destructive' : 'text-amber-600'
                      }>{run.status}</span>
                      <span>{new Date(run.started_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 8. Audit history — permission changes */}
        {permissionChanges && permissionChanges.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Permission Change History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {permissionChanges.map((change) => (
                  <div key={change.id} className="px-6 py-3 text-sm space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{change.previous_classification ?? '—'}</span>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant={CLASSIFICATION_VARIANTS[change.new_classification] ?? 'outline'}>
                        {change.new_classification}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(change.created_at).toLocaleString()}
                      </span>
                    </div>
                    {change.reason && <p className="text-xs text-muted-foreground">{change.reason}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit form */}
        <Card>
          <CardHeader><CardTitle>Edit Source</CardTitle></CardHeader>
          <CardContent>
            <SourceForm source={s} />
          </CardContent>
        </Card>

        {/* Endpoint discovery */}
        {s.source_type.startsWith('arcgis') && (
          <Card>
            <CardHeader><CardTitle>Endpoint Discovery</CardTitle></CardHeader>
            <CardContent>
              <SourceInspector
                sourceId={s.id}
                sourceType={s.source_type}
                hasBaseUrl={!!s.base_url}
              />
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
