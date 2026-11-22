import { isValidWgs84Point, type Wgs84Point } from './spatial-proximity';
import { createServiceClient } from '@/lib/supabase/server';

const EARTH_RADIUS_METRES = 6_371_008.8;

export type CoordinateRole = 'site' | 'area-reference' | 'facility';
export type SourceType = 'operator-entered' | 'dataset-import' | 'cc-approved' | 'external-api';
export type VerificationStatus = 'operator-verified' | 'dataset-sourced' | 'unverified';
export type PrecisionTier = 'verified' | 'operator-provided' | 'approximate' | 'locality-only';

export type DiscrepancySource = {
  recordId: string;
  sourceName: string;
  sourceType: SourceType;
  coordinateRole: CoordinateRole;
  lat: number;
  lng: number;
  locationPrecision?: string | null;
  verificationStatus: VerificationStatus;
  acquisitionDate?: string | null;
};

export type SubjectInfo = {
  subjectId: string;
  subjectType: 'listing' | 'developmentNotice' | 'campaign';
  subjectLabel?: string | null;
};

// Haversine geodesic distance in metres
export function geodesicDistanceMetres(a: Wgs84Point, b: Wgs84Point): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.sqrt(h));
}

// Roles that are comparable — area-reference must never be compared with site/facility
function rolesAreCompatible(a: CoordinateRole, b: CoordinateRole): boolean {
  if (a === 'area-reference' || b === 'area-reference') return false;
  return a === b;
}

function precisionTierOf(precision: string | null | undefined): PrecisionTier | null {
  if (!precision) return null;
  if (precision === 'verified') return 'verified';
  if (precision === 'operator-provided') return 'operator-provided';
  if (precision === 'approximate') return 'approximate';
  if (precision === 'locality-only') return 'locality-only';
  return null;
}

type DiscrepancyRule = {
  id: string;
  version: string;
  threshold_metres: number;
  source_type_a: string;
  source_type_b: string;
  coordinate_role: string;
  precision_tier: string;
};

function ruleMatches(
  rule: DiscrepancyRule,
  gnSource: DiscrepancySource,
  ccSource: DiscrepancySource,
): boolean {
  const matchesRole =
    rule.coordinate_role === '*' || rule.coordinate_role === gnSource.coordinateRole;
  const matchesPrecision =
    rule.precision_tier === '*' ||
    rule.precision_tier === precisionTierOf(gnSource.locationPrecision) ||
    rule.precision_tier === precisionTierOf(ccSource.locationPrecision);
  const matchesSourceTypes =
    (rule.source_type_a === '*' || rule.source_type_a === gnSource.sourceType) &&
    (rule.source_type_b === '*' || rule.source_type_b === ccSource.sourceType);
  const matchesSourceTypesReversed =
    (rule.source_type_a === '*' || rule.source_type_a === ccSource.sourceType) &&
    (rule.source_type_b === '*' || rule.source_type_b === gnSource.sourceType);
  return matchesRole && matchesPrecision && (matchesSourceTypes || matchesSourceTypesReversed);
}

/**
 * Detect and record a coordinate discrepancy between a GN record and a CC staged feature.
 *
 * Eligibility requirements (all must pass):
 * - Both coordinates are valid WGS84 points
 * - Coordinate roles are compatible (no area-reference vs site/facility)
 * - Both source identities are established (recordId present)
 *
 * Idempotency: the unique index on (gn_record_id, cc_feature_id) for active statuses
 * prevents duplicate records when the same import is reprocessed.
 *
 * Returns null if the comparison is ineligible (not an error — just not comparable).
 */
export async function detectAndRecordDiscrepancy(
  subject: SubjectInfo,
  gnSource: DiscrepancySource,
  ccFeatureId: string,
  ccSource: DiscrepancySource,
): Promise<{ recorded: boolean; status: string; distanceMetres?: number } | null> {
  // Eligibility: valid coordinates
  if (!isValidWgs84Point({ lat: gnSource.lat, lng: gnSource.lng })) return null;
  if (!isValidWgs84Point({ lat: ccSource.lat, lng: ccSource.lng })) return null;

  // Eligibility: compatible roles
  if (!rolesAreCompatible(gnSource.coordinateRole, ccSource.coordinateRole)) return null;

  // Eligibility: source identities established
  if (!gnSource.recordId || !ccFeatureId) return null;

  const distanceMetres = geodesicDistanceMetres(
    { lat: gnSource.lat, lng: gnSource.lng },
    { lat: ccSource.lat, lng: ccSource.lng },
  );

  const supabase = createServiceClient();

  // Load active threshold rules
  const { data: rules } = await supabase
    .from('spatial_discrepancy_rules')
    .select('id, version, threshold_metres, source_type_a, source_type_b, coordinate_role, precision_tier')
    .eq('active', true);

  const matchedRule = (rules ?? []).find((r) => ruleMatches(r as DiscrepancyRule, gnSource, ccSource)) as DiscrepancyRule | undefined;

  // If no rule matches, record as requires-configuration regardless of distance
  const reviewStatus = matchedRule
    ? distanceMetres > matchedRule.threshold_metres
      ? 'pending-review'
      : null // distance within threshold — no discrepancy
    : 'requires-configuration';

  // Within threshold and rule exists — not a discrepancy
  if (reviewStatus === null) return { recorded: false, status: 'within-threshold', distanceMetres };

  // Upsert — the unique index handles idempotency for active records.
  // ON CONFLICT DO NOTHING: if an active record already exists for this pair, skip.
  const { error } = await supabase.from('spatial_coordinate_discrepancies').insert({
    subject_id: subject.subjectId,
    subject_type: subject.subjectType,
    subject_label: subject.subjectLabel ?? null,
    gn_record_id: gnSource.recordId,
    gn_source_name: gnSource.sourceName,
    gn_source_type: gnSource.sourceType,
    gn_coordinate_role: gnSource.coordinateRole,
    gn_lat: gnSource.lat,
    gn_lng: gnSource.lng,
    gn_location_precision: gnSource.locationPrecision ?? null,
    gn_verification_status: gnSource.verificationStatus,
    gn_acquisition_date: gnSource.acquisitionDate ?? null,
    cc_feature_id: ccFeatureId,
    cc_source_name: ccSource.sourceName,
    cc_source_type: ccSource.sourceType,
    cc_coordinate_role: ccSource.coordinateRole,
    cc_lat: ccSource.lat,
    cc_lng: ccSource.lng,
    cc_location_precision: ccSource.locationPrecision ?? null,
    cc_verification_status: ccSource.verificationStatus,
    cc_acquisition_date: ccSource.acquisitionDate ?? null,
    distance_metres: distanceMetres,
    calculation_method: 'haversine-wgs84',
    rule_id: matchedRule?.id ?? null,
    rule_version: matchedRule?.version ?? null,
    rule_threshold_metres: matchedRule?.threshold_metres ?? null,
    review_status: reviewStatus,
  });

  // Unique constraint violation = already recorded for this active pair — idempotent
  if (error) {
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      return { recorded: false, status: 'already-recorded', distanceMetres };
    }
    // Non-idempotency error — log but do not fail the import
    console.error('[discrepancy] Failed to record discrepancy:', error.message);
    return { recorded: false, status: 'error', distanceMetres };
  }

  return { recorded: true, status: reviewStatus, distanceMetres };
}

/**
 * Extract a WGS84 point from a GeoJSON Point geometry stored in feature_geojson.
 * Returns null if the geometry is not a valid WGS84 Point.
 */
export function extractPointFromFeatureGeojson(
  geojson: unknown,
): Wgs84Point | null {
  if (!geojson || typeof geojson !== 'object') return null;
  const g = geojson as { type?: string; coordinates?: unknown };
  if (g.type !== 'Point' || !Array.isArray(g.coordinates)) return null;
  const [lng, lat] = g.coordinates as number[];
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const point = { lat, lng };
  return isValidWgs84Point(point) ? point : null;
}
