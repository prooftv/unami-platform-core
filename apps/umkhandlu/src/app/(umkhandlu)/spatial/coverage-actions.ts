'use server';

import { getOperatorSession } from '@/lib/auth/operator';
import { isValidGeoJSONGeometry } from '@/lib/gis/spatial-proximity';
import {
  isAmajubaDistrictFeature,
  pointCoveredByGeometry,
  pointFromGeometry,
} from '@/lib/gis/coverage-review';
import { createServiceClient } from '@/lib/supabase/server';

const PAGE_SIZE = 1000;
const MAX_FEATURES = 20_000;
const MAX_REVIEW_ITEMS = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SourceMetadata = {
  name: string | null;
  institution: string | null;
  authority_status: string | null;
  permission_classification: string | null;
  licence_terms: string | null;
};

function getSource(value: SourceMetadata | SourceMetadata[] | null): SourceMetadata | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export type DatasetCoverageReport = {
  dataset: {
    id: string;
    name: string;
    status: string;
    sourceId: string | null;
    sourceName: string | null;
    sourceInstitution: string | null;
    datasetPermission: string | null;
    sourcePermission: string | null;
    attribution: string | null;
    datasetLicenseTerms: string | null;
    sourceLicenseTerms: string | null;
    vintage: string | null;
    provenance: string | null;
  };
  boundary: {
    datasetId: string;
    datasetName: string;
    featureId: string;
    sourceName: string | null;
    sourceInstitution: string | null;
    sourceAuthorityStatus: string | null;
    datasetPermission: string | null;
    sourcePermission: string | null;
    datasetLicenseTerms: string | null;
    sourceLicenseTerms: string | null;
    vintage: string | null;
    authoritativeStatusVerified: boolean;
  };
  inventory: {
    total: number;
    retrieved: number;
    evaluatedPoints: number;
    inside: number;
    outside: number;
    invalidGeometry: number;
    nonPointGeometry: number;
    statuses: Record<string, number>;
    complete: boolean;
  };
  outsideFeatures: Array<{
    stagingFeatureId: string;
    label: string;
    longitude: number;
    latitude: number;
    operatorStatus: string;
  }>;
  outsideFeaturesTruncated: boolean;
  note: string;
};

export async function analyseDatasetCoverageAction(
  datasetId: string,
): Promise<{ report: DatasetCoverageReport } | { error: string }> {
  const operator = await getOperatorSession();
  if (!operator) return { error: 'An authenticated Unami operator session is required.' };
  if (!UUID_PATTERN.test(datasetId)) return { error: 'A valid dataset ID is required.' };

  const supabase = createServiceClient();
  const { data: dataset, error: datasetError } = await supabase
    .from('spatial_datasets')
    .select('id, name, status, active, source_id, permission_classification, attribution, licence_terms, provenance, dataset_date, spatial_sources(name, institution, permission_classification, licence_terms)')
    .eq('id', datasetId)
    .maybeSingle();
  if (datasetError) {
    console.error('Could not read dataset for coverage review:', datasetError.message);
    return { error: 'Dataset metadata is temporarily unavailable.' };
  }
  if (!dataset) return { error: 'Dataset not found.' };
  const datasetSource = getSource(dataset.spatial_sources as SourceMetadata | SourceMetadata[] | null);

  const { data: boundaryCandidates, error: boundaryError } = await supabase
    .from('spatial_datasets')
    .select('id, name, status, active, dataset_date, permission_classification, attribution, licence_terms, provenance, spatial_sources(name, institution, authority_status, permission_classification, licence_terms)')
    .eq('status', 'published')
    .eq('active', true)
    .ilike('name', '%district%');
  if (boundaryError) {
    console.error('Could not discover district boundary datasets:', boundaryError.message);
    return { error: 'Published district boundary catalogue is temporarily unavailable.' };
  }

  const officialCandidates = (boundaryCandidates ?? []).filter((candidate) => {
    const source = getSource(candidate.spatial_sources as SourceMetadata | SourceMetadata[] | null);
    const identity = `${source?.institution ?? ''} ${source?.name ?? ''}`;
    return /municipal demarcation board|\bMDB\b/i.test(identity);
  });
  const matchingBoundaries: Array<{
    datasetId: string;
    datasetName: string;
    featureId: string;
    sourceName: string | null;
    sourceInstitution: string | null;
    sourceAuthorityStatus: string | null;
    datasetPermission: string | null;
    sourcePermission: string | null;
    datasetLicenseTerms: string | null;
    sourceLicenseTerms: string | null;
    vintage: string | null;
    geometry: unknown;
  }> = [];

  for (const candidate of officialCandidates) {
    const { data: boundaryFeatures, error: featureError } = await supabase
      .from('spatial_staged_features')
      .select('id, feature_geojson, feature_properties')
      .eq('dataset_id', candidate.id)
      .eq('operator_status', 'approved')
      .limit(100);
    if (featureError) {
      console.error('Could not inspect district boundary features:', featureError.message);
      return { error: 'District boundary features are temporarily unavailable.' };
    }

    const source = getSource(candidate.spatial_sources as SourceMetadata | SourceMetadata[] | null);
    for (const feature of boundaryFeatures ?? []) {
      if (
        !isAmajubaDistrictFeature(feature.feature_properties) ||
        !isValidGeoJSONGeometry(feature.feature_geojson)
      ) {
        continue;
      }
      const geometry = feature.feature_geojson as { type?: unknown };
      if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') continue;
      matchingBoundaries.push({
        datasetId: candidate.id,
        datasetName: candidate.name,
        featureId: feature.id,
        geometry: feature.feature_geojson,
        sourceName: source?.name ?? null,
        sourceInstitution: source?.institution ?? null,
        sourceAuthorityStatus: source?.authority_status ?? null,
        datasetPermission: candidate.permission_classification ?? null,
        sourcePermission: source?.permission_classification ?? null,
        datasetLicenseTerms: candidate.licence_terms ?? null,
        sourceLicenseTerms: source?.licence_terms ?? null,
        vintage: candidate.dataset_date,
      });
    }
  }

  if (matchingBoundaries.length !== 1) {
    return {
      error: matchingBoundaries.length === 0
        ? 'No unique published MDB Amajuba DC25 polygon with matching district code and name was found; coverage was not classified.'
        : 'More than one published MDB Amajuba DC25 polygon matched; coverage was not classified until an operator resolves the boundary ambiguity.',
    };
  }
  const boundary = matchingBoundaries[0];

  const { count, error: countError } = await supabase
    .from('spatial_staged_features')
    .select('id', { count: 'exact', head: true })
    .eq('dataset_id', datasetId);
  if (countError || count === null) {
    console.error('Could not count dataset features for coverage review:', countError?.message);
    return { error: 'Dataset feature inventory is temporarily unavailable.' };
  }
  if (count > MAX_FEATURES) {
    return {
      error: `Coverage review is limited to ${MAX_FEATURES.toLocaleString()} features per request; this dataset has ${count.toLocaleString()} and was not partially classified.`,
    };
  }

  const statuses: Record<string, number> = {};
  const outsideFeatures: DatasetCoverageReport['outsideFeatures'] = [];
  let retrieved = 0;
  let evaluatedPoints = 0;
  let inside = 0;
  let outside = 0;
  let invalidGeometry = 0;
  let nonPointGeometry = 0;

  for (let offset = 0; offset < count; offset += PAGE_SIZE) {
    const end = Math.min(offset + PAGE_SIZE - 1, count - 1);
    const { data: features, error: featuresError } = await supabase
      .from('spatial_staged_features')
      .select('id, operator_status, feature_geojson, feature_properties')
      .eq('dataset_id', datasetId)
      .order('id', { ascending: true })
      .range(offset, end);
    if (featuresError) {
      console.error('Could not read dataset features for coverage review:', featuresError.message);
      return { error: 'Dataset features are temporarily unavailable; no partial report was returned.' };
    }

    for (const feature of features ?? []) {
      retrieved++;
      const status = feature.operator_status ?? 'unknown';
      statuses[status] = (statuses[status] ?? 0) + 1;
      if (!isValidGeoJSONGeometry(feature.feature_geojson)) {
        invalidGeometry++;
        continue;
      }
      const point = pointFromGeometry(feature.feature_geojson);
      if (!point) {
        nonPointGeometry++;
        continue;
      }
      evaluatedPoints++;
      if (pointCoveredByGeometry(point, boundary.geometry)) {
        inside++;
        continue;
      }
      outside++;
      if (outsideFeatures.length < MAX_REVIEW_ITEMS) {
        const properties = feature.feature_properties as Record<string, unknown> | null;
        const label = properties && typeof properties.name === 'string'
          ? properties.name
          : properties && typeof properties.NAME === 'string'
            ? properties.NAME
            : 'Unnamed feature';
        outsideFeatures.push({
          stagingFeatureId: feature.id,
          label,
          longitude: point[0],
          latitude: point[1],
          operatorStatus: status,
        });
      }
    }
  }

  if (retrieved !== count) {
    return {
      error: `Coverage review retrieved ${retrieved} of ${count} records; no incomplete report was returned.`,
    };
  }

  return {
    report: {
      dataset: {
        id: dataset.id,
        name: dataset.name,
        status: dataset.status,
        sourceId: dataset.source_id,
        sourceName: datasetSource?.name ?? null,
        sourceInstitution: datasetSource?.institution ?? null,
        datasetPermission: dataset.permission_classification ?? null,
        sourcePermission: datasetSource?.permission_classification ?? null,
        attribution: dataset.attribution ?? null,
        datasetLicenseTerms: dataset.licence_terms ?? null,
        sourceLicenseTerms: datasetSource?.licence_terms ?? null,
        vintage: dataset.dataset_date ?? null,
        provenance: dataset.provenance ?? null,
      },
      boundary: {
        datasetId: boundary.datasetId,
        datasetName: boundary.datasetName,
        featureId: boundary.featureId,
        sourceName: boundary.sourceName,
        sourceInstitution: boundary.sourceInstitution,
        sourceAuthorityStatus: boundary.sourceAuthorityStatus,
        datasetPermission: boundary.datasetPermission,
        sourcePermission: boundary.sourcePermission,
        datasetLicenseTerms: boundary.datasetLicenseTerms,
        sourceLicenseTerms: boundary.sourceLicenseTerms,
        vintage: boundary.vintage,
        authoritativeStatusVerified: boundary.sourceAuthorityStatus === 'authoritative',
      },
      inventory: {
        total: count,
        retrieved,
        evaluatedPoints,
        inside,
        outside,
        invalidGeometry,
        nonPointGeometry,
        statuses,
        complete: true,
      },
      outsideFeatures,
      outsideFeaturesTruncated: outside > outsideFeatures.length,
      note: boundary.sourceAuthorityStatus === 'authoritative'
        ? 'Outside-polygon points are review candidates only. This read-only analysis does not clip, delete, relabel, approve, or publish records. Non-point geometries are reported separately and are not classified by centroid. The listed feature IDs are Control Centre staging IDs; upstream source feature IDs are not returned by this coverage review.'
        : `The polygon identity matches MDB / Amajuba DC25, but Control Centre records its source authority as ${boundary.sourceAuthorityStatus ?? 'not recorded'}. Inside/outside counts are geometric comparisons against reference evidence, not verified district coverage. Out-of-polygon points require operator scope review. No records are changed. Non-point geometries are not classified by centroid; listed IDs are Control Centre staging IDs, not upstream source feature IDs.`,
    },
  };
}
