import { NextResponse } from 'next/server';
import { getOperatorSession } from '@/lib/auth/operator';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Operator-authenticated spatial integrity check.
 * Returns a structured report of data quality issues across sources, datasets and features.
 * Does not modify any data.
 */
export async function GET() {
  const session = await getOperatorSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();

  const [
    { data: datasets },
    { data: sources },
    { count: totalFeatures },
    { count: approvedFeatures },
    { count: pendingFeatures },
    { count: rejectedFeatures },
    { data: pipelineRuns },
    { count: auditCount },
  ] = await Promise.all([
    supabase.from('spatial_datasets').select('id, name, status, active, feature_count, permission_classification, source_id, published_at'),
    supabase.from('spatial_sources').select('id, name, source_type, permission_classification, active, base_url, last_checked_at'),
    supabase.from('spatial_staged_features').select('*', { count: 'exact', head: true }),
    supabase.from('spatial_staged_features').select('*', { count: 'exact', head: true }).eq('operator_status', 'approved'),
    supabase.from('spatial_staged_features').select('*', { count: 'exact', head: true }).eq('operator_status', 'pending'),
    supabase.from('spatial_staged_features').select('*', { count: 'exact', head: true }).eq('operator_status', 'rejected'),
    supabase.from('spatial_pipeline_runs').select('id, pipeline_type, status, error_message, started_at').order('started_at', { ascending: false }).limit(50),
    supabase.from('spatial_permission_changes').select('*', { count: 'exact', head: true }),
  ]);

  const issues: Array<{
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    datasetId?: string;
    sourceId?: string;
  }> = [];

  // Sources without datasets
  const dsSourceIds = new Set((datasets ?? []).map((d) => d.source_id));
  const orphanSources = (sources ?? []).filter((s) => !dsSourceIds.has(s.id));
  if (orphanSources.length > 0) {
    issues.push({
      severity: 'info',
      category: 'source-coverage',
      message: `${orphanSources.length} sources have no registered datasets. These are catalogued but not yet ingested.`,
    });
  }

  // Published datasets with permission conflicts
  const published = (datasets ?? []).filter((d) => d.status === 'published');
  for (const d of published) {
    if (!['redistribute', 'download', 'internal'].includes(d.permission_classification ?? '')) {
      issues.push({
        severity: 'error',
        category: 'permission-conflict',
        message: `"${d.name}" is published but permission_classification is "${d.permission_classification}". Publication requires redistribute, download or internal.`,
        datasetId: d.id,
      });
    }
  }

  // Published datasets with null feature_count
  for (const d of published) {
    if (d.feature_count == null) {
      issues.push({
        severity: 'warning',
        category: 'feature-count',
        message: `"${d.name}" is published but feature_count is null. Run publishDatasetAction to sync the count.`,
        datasetId: d.id,
      });
    }
  }

  // Staged datasets with no features
  const staged = (datasets ?? []).filter((d) => d.status === 'staged');
  for (const d of staged) {
    const { count: pending } = await supabase
      .from('spatial_staged_features')
      .select('*', { count: 'exact', head: true })
      .eq('dataset_id', d.id)
      .eq('operator_status', 'pending');
    const { count: approved } = await supabase
      .from('spatial_staged_features')
      .select('*', { count: 'exact', head: true })
      .eq('dataset_id', d.id)
      .eq('operator_status', 'approved');
    if ((pending ?? 0) === 0 && (approved ?? 0) === 0) {
      issues.push({
        severity: 'warning',
        category: 'empty-staged',
        message: `"${d.name}" is staged but has no features (pending or approved). Ingest data or reset status.`,
        datasetId: d.id,
      });
    }
  }

  // Restricted sources that are still active
  const restrictedActive = (sources ?? []).filter(
    (s) => s.active && (s.permission_classification === 'restricted' || s.permission_classification === 'prohibited'),
  );
  for (const s of restrictedActive) {
    issues.push({
      severity: 'info',
      category: 'restricted-source',
      message: `Source "${s.name}" is active but classified as ${s.permission_classification}. Ingestion and publication are blocked by permission enforcement.`,
      sourceId: s.id,
    });
  }

  // Failed pipeline runs
  const failedRuns = (pipelineRuns ?? []).filter((r) => r.status === 'failed');
  if (failedRuns.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'pipeline-failures',
      message: `${failedRuns.length} pipeline run(s) have failed. Most recent: ${failedRuns[0]?.error_message ?? 'no error message'} (${failedRuns[0]?.started_at})`,
    });
  }

  // Sources never health-checked
  const neverChecked = (sources ?? []).filter((s) => s.active && !s.last_checked_at);
  if (neverChecked.length > 0) {
    issues.push({
      severity: 'info',
      category: 'unchecked-sources',
      message: `${neverChecked.length} active source(s) have never been health-checked.`,
    });
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: {
      sources: sources?.length ?? 0,
      datasets: datasets?.length ?? 0,
      publishedDatasets: published.length,
      stagedDatasets: staged.length,
      archivedDatasets: (datasets ?? []).filter((d) => d.status === 'archived').length,
      totalFeatures: totalFeatures ?? 0,
      approvedFeatures: approvedFeatures ?? 0,
      pendingFeatures: pendingFeatures ?? 0,
      rejectedFeatures: rejectedFeatures ?? 0,
      pipelineRuns: pipelineRuns?.length ?? 0,
      auditRecords: auditCount ?? 0,
      orphanSources: orphanSources.length,
    },
    integrity: {
      errors,
      warnings,
      status: errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'ok',
    },
    issues,
    geographicVerification: {
      districtCode: 'DC25',
      municipalities: [
        { code: 'KZN252', name: 'Newcastle' },
        { code: 'KZN253', name: 'eMadlangeni' },
        { code: 'KZN254', name: 'Dannhauser' },
      ],
      wards2026: 55,
      wardProfiles2021: 53,
      unmatchedWards: ['KZN252_35', 'KZN252_36'],
      unmatchedNote:
        'KZN252 wards 35 and 36 are new 2026 delimitations with no 2021 demographic profile. No inference is made for these wards.',
      wardMatchKey: 'CAT_B + WardNo (compound key)',
    },
  });
}
