import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  MapPin,
  Users,
  Building2,
  Layers,
} from 'lucide-react';
import {
  type LayerRequirement,
  type Availability,
  NOTICE_LAYER_CONFIG,
  DEFAULT_LAYERS,
  PROXIMITY_RADIUS,
} from './notice-layer-config';
import type { NoticeContextResponse } from '@/app/api/spatial/notice-context/route';

export interface SpatialGapSummary {
  available: number;
  pending: number;
  unavailable: number;
  total: number;
  criticalGaps: string[];
}

// ---------------------------------------------------------------------------
// DB lookup — fetches published dataset names
// ---------------------------------------------------------------------------
async function getPublishedDatasetNames(): Promise<Set<string>> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('spatial_datasets')
    .select('name')
    .eq('status', 'published')
    .eq('active', true);
  return new Set((data ?? []).map((d) => d.name));
}

function resolveAvailability(req: LayerRequirement, published: Set<string>): Availability {
  if (!req.datasetPattern) return req.availability;
  const prefix = req.datasetPattern.split('—')[0].trim();
  return [...published].some((n) => n.includes(prefix)) ? 'available' : req.availability;
}

// ---------------------------------------------------------------------------
// Exported server function — badge counts for the Risk & Compliance Summary
// ---------------------------------------------------------------------------
export async function getNoticeSpatialGapSummary(noticeType: string): Promise<SpatialGapSummary> {
  const requirements = NOTICE_LAYER_CONFIG[noticeType] ?? DEFAULT_LAYERS;
  const published = await getPublishedDatasetNames();

  let available = 0;
  let pending = 0;
  let unavailable = 0;
  const criticalGaps: string[] = [];

  for (const req of requirements) {
    const effective = resolveAvailability(req, published);
    if (effective === 'available') {
      available++;
    } else if (effective === 'pending-permission') {
      pending++;
      criticalGaps.push(req.role);
    } else {
      unavailable++;
      criticalGaps.push(req.role);
    }
  }

  return { available, pending, unavailable, total: requirements.length, criticalGaps };
}

// ---------------------------------------------------------------------------
// Fetch notice-context from the API (server-side direct call)
// ---------------------------------------------------------------------------
async function fetchNoticeContext(
  noticeType: string,
  wardNumber: number | null,
  catB: string | null,
  lat: number | null,
  lng: number | null,
  locationPrecision: string | null,
): Promise<NoticeContextResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
    const params = new URLSearchParams({ noticeType });
    if (wardNumber != null) params.set('wardNumber', String(wardNumber));
    if (catB) params.set('catB', catB);
    if (lat != null) params.set('lat', String(lat));
    if (lng != null) params.set('lng', String(lng));
    if (locationPrecision) params.set('locationPrecision', locationPrecision);
    const res = await fetch(`${baseUrl}/api/spatial/notice-context?${params.toString()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as NoticeContextResponse;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------
const STATUS_ICON = {
  found: CheckCircle,
  'not-found': AlertTriangle,
  unavailable: XCircle,
  'pending-permission': Clock,
  'not-applicable': XCircle,
} as const;

const STATUS_COLOUR = {
  found: 'text-green-600',
  'not-found': 'text-amber-600',
  unavailable: 'text-red-500',
  'pending-permission': 'text-amber-500',
  'not-applicable': 'text-muted-foreground',
} as const;

const STATUS_BADGE = {
  found: 'bg-green-100 text-green-800 border-green-200',
  'not-found': 'bg-amber-100 text-amber-800 border-amber-200',
  unavailable: 'bg-red-100 text-red-700 border-red-200',
  'pending-permission': 'bg-amber-50 text-amber-700 border-amber-200',
  'not-applicable': 'bg-gray-100 text-gray-500 border-gray-200',
} as const;

const STATUS_LABEL = {
  found: 'Available',
  'not-found': 'Not matched',
  unavailable: 'Unavailable',
  'pending-permission': 'Pending permission',
  'not-applicable': 'Not applicable',
} as const;

type DatasetStatus = keyof typeof STATUS_ICON;

function LayerRow({
  label,
  status,
  datasetName,
  attribution,
  datasetDate,
  note,
  statutoryBasis,
}: {
  label: string;
  status: DatasetStatus;
  datasetName: string | null;
  attribution: string | null;
  datasetDate: string | null;
  note: string | null;
  statutoryBasis?: string;
}) {
  const Icon = STATUS_ICON[status];
  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b last:border-0">
      <Icon className={`size-4 mt-0.5 shrink-0 ${STATUS_COLOUR[status]}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium">{label}</p>
          <span className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${STATUS_BADGE[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
        {datasetName && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {datasetName}
            {attribution ? ` · ${attribution}` : ''}
            {datasetDate ? ` · ${datasetDate}` : ''}
          </p>
        )}
        {statutoryBasis && (
          <p className="text-xs text-blue-700 mt-0.5">{statutoryBasis}</p>
        )}
        {note && status !== 'found' && (
          <p className="text-xs text-amber-700 mt-0.5 flex items-start gap-1">
            <AlertTriangle className="size-3 mt-0.5 shrink-0" />
            {note}
          </p>
        )}
      </div>
    </div>
  );
}

function pct(num: number, denom: number) {
  if (!denom) return '0%';
  return `${Math.round((num / denom) * 100)}%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
  noticeType: string;
  noticeId: string;
  wardNumber?: number | null;
  catB?: string | null;
  lat?: number | null;
  lng?: number | null;
  locationPrecision?: string | null;
}

export async function NoticeSpatialContext({
  noticeType,
  wardNumber,
  catB,
  lat,
  lng,
  locationPrecision,
}: Props) {
  const [ctx, published] = await Promise.all([
    fetchNoticeContext(
      noticeType,
      wardNumber ?? null,
      catB ?? null,
      lat ?? null,
      lng ?? null,
      locationPrecision ?? null,
    ),
    getPublishedDatasetNames(),
  ]);

  const requirements = NOTICE_LAYER_CONFIG[noticeType] ?? DEFAULT_LAYERS;
  const radius = PROXIMITY_RADIUS[noticeType] ?? null;

  // Layer availability from local DB (for the layer catalogue section)
  const resolved = requirements.map((req) => {
    const effective = resolveAvailability(req, published);
    return { req, effective };
  });

  const availableCount = resolved.filter((r) => r.effective === 'available').length;
  const pendingCount = resolved.filter((r) => r.effective !== 'available').length;

  return (
    <div className="space-y-4">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Spatial Context</h3>
        </div>
        <div className="flex items-center gap-2">
          {radius && (
            <span className="text-xs font-medium text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <MapPin className="size-3" />
              {radius.metres}m proximity zone
            </span>
          )}
          <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">
            {availableCount} layers ready
          </span>
          {pendingCount > 0 && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              {pendingCount} pending
            </span>
          )}
        </div>
      </div>

      {/* ── Proximity radius ── */}
      {radius && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-3">
              <MapPin className="size-4 mt-0.5 shrink-0 text-violet-600" />
              <div>
                <p className="text-sm font-semibold text-violet-900">
                  {radius.metres}m statutory proximity zone
                </p>
                <p className="text-xs text-violet-700 mt-0.5">{radius.statutoryBasis}</p>
                {radius.caveat && (
                  <p className="text-xs text-violet-600 mt-0.5">{radius.caveat}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Administrative layers ── */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Building2 className="size-3.5" />
            Administrative context
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          {ctx ? (
            <>
              <LayerRow
                label="Ward boundary"
                status={ctx.administrative.ward.status as DatasetStatus}
                datasetName={ctx.administrative.ward.datasetName}
                attribution={ctx.administrative.ward.attribution}
                datasetDate={ctx.administrative.ward.datasetDate}
                note={ctx.administrative.ward.note}
                statutoryBasis="Ward committee jurisdiction and community notification"
              />
              <LayerRow
                label="Local municipality"
                status={ctx.administrative.municipality.status as DatasetStatus}
                datasetName={ctx.administrative.municipality.datasetName}
                attribution={ctx.administrative.municipality.attribution}
                datasetDate={ctx.administrative.municipality.datasetDate}
                note={ctx.administrative.municipality.note}
                statutoryBasis="Determining which authority has jurisdiction"
              />
              <LayerRow
                label="District municipality"
                status={ctx.administrative.district.status as DatasetStatus}
                datasetName={ctx.administrative.district.datasetName}
                attribution={ctx.administrative.district.attribution}
                datasetDate={ctx.administrative.district.datasetDate}
                note={ctx.administrative.district.note}
                statutoryBasis="Amajuba DC25 district context"
              />
            </>
          ) : (
            resolved
              .filter((r) => ['Ward boundaries', 'Local municipality', 'District boundary'].includes(r.req.role))
              .map(({ req, effective }) => (
                <LayerRow
                  key={req.role}
                  label={req.role}
                  status={effective === 'available' ? 'found' : effective === 'pending-permission' ? 'pending-permission' : 'unavailable'}
                  datasetName={req.label}
                  attribution={null}
                  datasetDate={null}
                  note={req.permissionNote}
                  statutoryBasis={req.statutoryBasis}
                />
              ))
          )}
        </CardContent>
      </Card>

      {/* ── Ward demographics ── */}
      {ctx?.wardDemographics && (
        <Card>
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Users className="size-3.5" />
              Ward demographics — {ctx.wardDemographics.Ward_Label} · Census 2021
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-3 pb-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                <p className="text-lg font-bold text-blue-900">
                  {ctx.wardDemographics.Total_Pop.toLocaleString()}
                </p>
                <p className="text-xs text-blue-700">Residents</p>
                <p className="text-xs text-blue-500">
                  {ctx.wardDemographics.Pop_Density.toFixed(0)}/km²
                </p>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                <p className="text-lg font-bold text-green-900">
                  {pct(ctx.wardDemographics.Employed, ctx.wardDemographics.Total_Pop)}
                </p>
                <p className="text-xs text-green-700">Employed</p>
                <p className="text-xs text-green-500">
                  {pct(ctx.wardDemographics.Unemployed, ctx.wardDemographics.Total_Pop)} unemployed
                </p>
              </div>
              <div className="rounded-lg bg-cyan-50 border border-cyan-100 px-3 py-2">
                <p className="text-lg font-bold text-cyan-900">
                  {pct(
                    ctx.wardDemographics.Flush_Toilet_SewerSystem + ctx.wardDemographics.Flush_Toilet_SepticTank,
                    ctx.wardDemographics.Total_Pop,
                  )}
                </p>
                <p className="text-xs text-cyan-700">Formal sanitation</p>
                <p className="text-xs text-cyan-500">
                  {pct(ctx.wardDemographics.None_Toilet, ctx.wardDemographics.Total_Pop)} none
                </p>
              </div>
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
                <p className="text-lg font-bold text-indigo-900">
                  {pct(
                    ctx.wardDemographics.Tap_In_Dwelling + ctx.wardDemographics.tap_in_Yard,
                    ctx.wardDemographics.Total_Pop,
                  )}
                </p>
                <p className="text-xs text-indigo-700">Piped water</p>
                <p className="text-xs text-indigo-500">
                  {pct(ctx.wardDemographics.No_access_to_piped_water, ctx.wardDemographics.Total_Pop)} no access
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Registered voters: {ctx.wardDemographics.Reg_Voters.toLocaleString()} · Area: {ctx.wardDemographics.Area_SqKm.toFixed(0)} km²
              · MDB WardProfile 2021
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Proximity layers (notice-type specific) ── */}
      {ctx && Object.values(ctx.proximity).some((p) => p.status !== 'not-applicable') && (
        <Card>
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <MapPin className="size-3.5" />
              Proximity layers
              {radius && (
                <span className="text-[10px] font-normal text-violet-600 ml-1">
                  within {radius.metres}m
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-2">
            {([
              { key: 'traditionalAreas', label: 'Traditional authority areas' },
              { key: 'licensedPremises', label: 'Licensed premises' },
              { key: 'schools', label: 'Schools / learning institutions' },
              { key: 'religiousInstitutions', label: 'Religious institutions' },
              { key: 'recreationFacilities', label: 'Recreation facilities' },
            ] as const).map(({ key, label }) => {
              const layer = ctx.proximity[key];
              if (layer.status === 'not-applicable') return null;
              return (
                <LayerRow
                  key={key}
                  label={label}
                  status={layer.status as DatasetStatus}
                  datasetName={layer.datasetName}
                  attribution={layer.attribution}
                  datasetDate={layer.datasetDate}
                  note={layer.note}
                />
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Site context ── */}
      {ctx && (
        <Card>
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Site context
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-2">
            <LayerRow
              label="Zoning / land-use scheme"
              status={ctx.siteContext.landUse.status as DatasetStatus}
              datasetName={ctx.siteContext.landUse.datasetName}
              attribution={ctx.siteContext.landUse.attribution}
              datasetDate={ctx.siteContext.landUse.datasetDate}
              note={ctx.siteContext.landUse.note}
            />
            <LayerRow
              label="Property / cadastral boundary"
              status={ctx.siteContext.cadastre.status as DatasetStatus}
              datasetName={ctx.siteContext.cadastre.datasetName}
              attribution={ctx.siteContext.cadastre.attribution}
              datasetDate={ctx.siteContext.cadastre.datasetDate}
              note={ctx.siteContext.cadastre.note}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Layer catalogue (non-context layers from config) ── */}
      {resolved.filter((r) => !['Ward boundaries', 'Local municipality', 'District boundary'].includes(r.req.role)).length > 0 && (
        <details className="group">
          <summary className="list-none cursor-pointer">
            <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1">
              <span className="font-medium">All required layers ({requirements.length})</span>
              <span className="group-open:hidden">▾</span>
              <span className="hidden group-open:inline">▴</span>
            </div>
          </summary>
          <Card className="mt-1">
            <CardContent className="p-0">
              <div className="divide-y">
                {resolved.map(({ req, effective }) => (
                  <LayerRow
                    key={req.role}
                    label={req.role}
                    status={effective === 'available' ? 'found' : effective === 'pending-permission' ? 'pending-permission' : 'unavailable'}
                    datasetName={req.label}
                    attribution={null}
                    datasetDate={null}
                    note={req.permissionNote}
                    statutoryBasis={req.statutoryBasis}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </details>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center gap-4 pt-1">
        <Link href="/spatial/sources" className="text-xs text-blue-600 hover:underline">
          Manage sources →
        </Link>
        <Link href="/spatial/map" className="text-xs text-blue-600 hover:underline">
          View on map →
        </Link>
      </div>

      {ctx && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {ctx.disclaimer}
        </p>
      )}
    </div>
  );
}
