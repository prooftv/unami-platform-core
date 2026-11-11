import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import {
  type LayerRequirement,
  type Availability,
  NOTICE_LAYER_CONFIG,
  DEFAULT_LAYERS,
} from './notice-layer-config';

export interface SpatialGapSummary {
  available: number;
  pending: number;
  unavailable: number;
  total: number;
  criticalGaps: string[];
}

// ---------------------------------------------------------------------------
// Shared DB lookup — fetches published dataset names once
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
// Exported server function — called from notice detail page for badge counts
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
// UI constants
// ---------------------------------------------------------------------------
const ICON = {
  available: CheckCircle,
  'pending-permission': Clock,
  'not-available': XCircle,
} as const;

const COLOUR = {
  available: 'text-green-600',
  'pending-permission': 'text-amber-600',
  'not-available': 'text-muted-foreground',
} as const;

const BADGE: Record<Availability, string> = {
  available: 'bg-green-100 text-green-800',
  'pending-permission': 'bg-amber-100 text-amber-800',
  'not-available': 'bg-gray-100 text-gray-600',
};

const BADGE_LABEL: Record<Availability, string> = {
  available: 'Published',
  'pending-permission': 'Pending',
  'not-available': 'Not available',
};

// ---------------------------------------------------------------------------
// Component — compact collapsible summary, intended for bottom of notice page
// ---------------------------------------------------------------------------
interface Props {
  noticeType: string;
  noticeId: string;
}

export async function NoticeSpatialContext({ noticeType }: Props) {
  const requirements = NOTICE_LAYER_CONFIG[noticeType] ?? DEFAULT_LAYERS;
  const published = await getPublishedDatasetNames();

  let available = 0;
  let pending = 0;
  let unavailable = 0;

  const resolved = requirements.map((req) => {
    const effective = resolveAvailability(req, published);
    if (effective === 'available') available++;
    else if (effective === 'pending-permission') pending++;
    else unavailable++;
    return { req, effective };
  });

  const gaps = pending + unavailable;

  return (
    <details className="group">
      <summary className="list-none cursor-pointer">
        <Card className="hover:bg-muted/30 transition-colors">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ChevronDown className="size-4 text-muted-foreground shrink-0 group-open:rotate-180 transition-transform" />
                <span className="text-sm font-medium">Spatial layers</span>
                <span className="text-xs text-muted-foreground">{requirements.length} required for {noticeType}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-green-600 font-medium">{available} ready</span>
                {gaps > 0 && (
                  <span className="text-xs text-amber-600 font-medium">{gaps} pending</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </summary>

      <Card className="mt-1 border-t-0 rounded-t-none">
        <CardContent className="p-0">
          <div className="divide-y">
            {resolved.map(({ req, effective }) => {
              const Icon = ICON[effective];
              return (
                <div key={req.role} className="px-4 py-2.5 flex items-start gap-3">
                  <Icon className={`size-3.5 mt-0.5 shrink-0 ${COLOUR[effective]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium">{req.role}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${BADGE[effective]}`}>
                        {BADGE_LABEL[effective]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{req.statutoryBasis}</p>
                    {req.permissionNote && effective !== 'available' && (
                      <div className="flex items-start gap-1 mt-0.5">
                        <AlertTriangle className="size-3 mt-0.5 shrink-0 text-amber-500" />
                        <p className="text-xs text-amber-700">{req.permissionNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2.5 border-t flex items-center gap-4">
            <Link href="/spatial/sources" className="text-xs text-blue-600 hover:underline">Manage sources →</Link>
            <Link href="/spatial/map" className="text-xs text-blue-600 hover:underline">View on map →</Link>
          </div>
        </CardContent>
      </Card>
    </details>
  );
}
