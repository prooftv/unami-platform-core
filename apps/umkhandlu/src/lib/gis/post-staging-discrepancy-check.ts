/**
 * Post-staging discrepancy check.
 *
 * Runs after a successful import action. Queries the GN spatial intelligence API
 * for all records that reference a CC spatialFeatureId, then cross-references
 * against the newly staged features. Calls detectAndRecordDiscrepancy for each
 * eligible pair.
 *
 * This is a best-effort background check. Failures are logged but do not block
 * or roll back the import.
 */

import {
  detectAndRecordDiscrepancy,
  extractPointFromFeatureGeojson,
  type DiscrepancySource,
  type SubjectInfo,
} from './coordinate-discrepancy';
import { createServiceClient } from '@/lib/supabase/server';

const GN_SPATIAL_URL =
  process.env.GOVERNANCE_NODE_SPATIAL_URL ??
  'https://umkhandlu.unamifoundation.org/api/intelligence/spatial';

type GnGeoRef = {
  id: string;
  type: string;
  title?: string;
  lat?: number;
  lng?: number;
  coordinateRole?: string;
  coordinateSource?: string;
  locationPrecision?: string;
  spatialFeatureId?: string;
  updatedAt?: string;
};

type GnSpatialResponse = {
  geoRefs?: GnGeoRef[];
};

async function fetchGnGeoRefs(): Promise<GnGeoRef[]> {
  try {
    const res = await fetch(`${GN_SPATIAL_URL}?recordsLimit=100&devNoticesLimit=100&campaignsLimit=100`, {
      cache: 'no-store',
      headers: { 'x-api-key': process.env.INTELLIGENCE_API_KEY ?? '' },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as GnSpatialResponse;
    return body.geoRefs ?? [];
  } catch {
    return [];
  }
}

function gnRecordTypeToSubjectType(
  type: string,
): SubjectInfo['subjectType'] | null {
  if (type === 'record') return 'listing';
  if (type === 'developmentNotice') return 'developmentNotice';
  if (type === 'campaign') return 'campaign';
  return null;
}

export async function runPostStagingDiscrepancyCheck(
  datasetId: string,
  runId: string,
): Promise<void> {
  const supabase = createServiceClient();

  // Fetch staged features from this run that have valid geometry
  const { data: stagedFeatures } = await supabase
    .from('spatial_staged_features')
    .select('id, feature_geojson, feature_properties, source_feature_id')
    .eq('dataset_id', datasetId)
    .eq('pipeline_run_id', runId)
    .eq('geometry_valid', true);

  if (!stagedFeatures?.length) return;

  // Build a map: cc_feature_id → point
  const featureMap = new Map<
    string,
    { lat: number; lng: number; properties: Record<string, unknown>; sourceFeatureId: string | null }
  >();
  for (const f of stagedFeatures) {
    const point = extractPointFromFeatureGeojson(f.feature_geojson);
    if (!point) continue;
    featureMap.set(f.id, {
      lat: point.lat,
      lng: point.lng,
      properties: (f.feature_properties as Record<string, unknown>) ?? {},
      sourceFeatureId: f.source_feature_id ?? null,
    });
  }
  if (!featureMap.size) return;

  // Fetch GN geoRefs
  const gnRefs = await fetchGnGeoRefs();
  if (!gnRefs.length) return;

  // Cross-reference: GN record has spatialFeatureId → match to CC staged feature id
  for (const gnRef of gnRefs) {
    if (!gnRef.spatialFeatureId) continue;
    if (!Number.isFinite(gnRef.lat) || !Number.isFinite(gnRef.lng)) continue;

    const ccFeature = featureMap.get(gnRef.spatialFeatureId);
    if (!ccFeature) continue;

    const subjectType = gnRecordTypeToSubjectType(gnRef.type);
    if (!subjectType) continue;

    const subject: SubjectInfo = {
      subjectId: gnRef.id,
      subjectType,
      subjectLabel: gnRef.title ?? null,
    };

    const gnSource: DiscrepancySource = {
      recordId: gnRef.id,
      sourceName: `Sanity ${gnRef.coordinateSource ?? 'geopoint'}`,
      sourceType: 'operator-entered',
      coordinateRole: (gnRef.coordinateRole as DiscrepancySource['coordinateRole']) ?? 'site',
      lat: gnRef.lat!,
      lng: gnRef.lng!,
      locationPrecision: gnRef.locationPrecision ?? null,
      verificationStatus: 'unverified',
      acquisitionDate: gnRef.updatedAt ? gnRef.updatedAt.slice(0, 10) : null,
    };

    const ccSource: DiscrepancySource = {
      recordId: gnRef.spatialFeatureId,
      sourceName: `CC staged feature (dataset ${datasetId})`,
      sourceType: 'dataset-import',
      coordinateRole: gnSource.coordinateRole, // same role — same real-world subject
      lat: ccFeature.lat,
      lng: ccFeature.lng,
      locationPrecision: null,
      verificationStatus: 'dataset-sourced',
      acquisitionDate: null,
    };

    await detectAndRecordDiscrepancy(subject, gnSource, gnRef.spatialFeatureId, ccSource);
  }
}
