import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

/**
 * Spatial dataset requirements per notice type.
 * Each entry maps a layer role to the dataset name pattern used in spatial_datasets.
 * availability reflects the current platform state — updated as datasets are ingested.
 */
const NOTICE_SPATIAL_REQUIREMENTS: Record<string, Array<{
  role: string;
  label: string;
  datasetPattern: string | null;
  statutoryBasis: string;
  availability: 'available' | 'pending-permission' | 'not-available';
  permissionNote: string | null;
}>> = {
  liquor: [
    {
      role: 'Ward boundaries',
      label: 'MDB Wards 2026 — Amajuba DC25',
      datasetPattern: 'MDB Wards 2026',
      statutoryBasis: 'KZN Liquor Licensing Act s.43 — ward committee jurisdiction',
      availability: 'available',
      permissionNote: null,
    },
    {
      role: 'Local municipality',
      label: 'KZN DARD Local Municipalities — Amajuba DC25',
      datasetPattern: 'KZN DARD Local Municipalities',
      statutoryBasis: 'KZNERA local committee jurisdiction determination',
      availability: 'available',
      permissionNote: null,
    },
    {
      role: 'District boundary',
      label: 'KZN DARD District Municipality — Amajuba DC25',
      datasetPattern: 'KZN DARD District Municipality',
      statutoryBasis: 'Amajuba DC25 district context',
      availability: 'available',
      permissionNote: null,
    },
    {
      role: 'Traditional authority areas',
      label: 'KZN COGTA ILIS Land Tenure Component v2',
      datasetPattern: null,
      statutoryBasis: 'KZN Liquor Licensing Act s.43 — traditional council consultation',
      availability: 'pending-permission',
      permissionNote: 'COGTA ILIS accessible but feature queries blocked from external IPs. IP allowlisting request submitted.',
    },
    {
      role: 'Schools / learning institutions',
      label: 'HOT OSM Education Facilities — Amajuba DC25',
      datasetPattern: 'HOT OSM Education Facilities',
      statutoryBasis: 'KZN Liquor Licensing Act s.43 — proximity to schools',
      availability: 'available',
      permissionNote: null,
    },
    {
      role: 'Religious institutions',
      label: 'HOT OSM Cultural Places — Amajuba DC25 (not yet ingested)',
      datasetPattern: 'HOT OSM Cultural Places',
      statutoryBasis: 'KZN Liquor Licensing Act s.43 — proximity to places of worship',
      availability: 'pending-permission',
      permissionNote: 'HOT OSM Cultural Places source registered (ODbL). Dataset not yet ingested for Amajuba DC25.',
    },
    {
      role: 'Licensed premises',
      label: 'KZNERA licensed premises register',
      datasetPattern: null,
      statutoryBasis: 'KZN Liquor Licensing Act s.43 — proximity to existing licensed premises',
      availability: 'not-available',
      permissionNote: 'KZNERA does not publish a machine-readable register. Manual verification required.',
    },
    {
      role: 'Zoning / land use',
      label: 'COGTA Land Use Scheme Pillar 2026',
      datasetPattern: null,
      statutoryBasis: 'Land use context for proposed premises',
      availability: 'pending-permission',
      permissionNote: 'COGTA FeatureServer accessible but redistribution permission pending.',
    },
    {
      role: 'Cadastral / property',
      label: 'NGI cadastral boundaries',
      datasetPattern: null,
      statutoryBasis: 'Property parcel identification',
      availability: 'pending-permission',
      permissionNote: 'NGI cadastral data requires formal licence. Not yet confirmed.',
    },
  ],
  eia: [
    {
      role: 'Ward boundaries',
      label: 'MDB Wards 2026 — Amajuba DC25',
      datasetPattern: 'MDB Wards 2026',
      statutoryBasis: 'NEMA EIA Regulations — affected area determination',
      availability: 'available',
      permissionNote: null,
    },
    {
      role: 'Local municipality',
      label: 'KZN DARD Local Municipalities — Amajuba DC25',
      datasetPattern: 'KZN DARD Local Municipalities',
      statutoryBasis: 'Competent authority jurisdiction',
      availability: 'available',
      permissionNote: null,
    },
    {
      role: 'Zoning / land use',
      label: 'COGTA Land Use Scheme Pillar 2026',
      datasetPattern: null,
      statutoryBasis: 'NEMA s.24 — land use compatibility assessment',
      availability: 'pending-permission',
      permissionNote: 'COGTA FeatureServer accessible but redistribution permission pending.',
    },
    {
      role: 'Floodlines',
      label: 'COGTA ILIS Flood Risk layers',
      datasetPattern: null,
      statutoryBasis: 'NEMA EIA — environmental sensitivity',
      availability: 'pending-permission',
      permissionNote: 'COGTA ILIS accessible but feature queries blocked from external IPs.',
    },
    {
      role: 'Traditional authority areas',
      label: 'KZN COGTA ILIS Land Tenure Component v2',
      datasetPattern: null,
      statutoryBasis: 'IPILRA — traditional community consultation',
      availability: 'pending-permission',
      permissionNote: 'COGTA ILIS accessible but feature queries blocked from external IPs.',
    },
  ],
  rezoning: [
    {
      role: 'Ward boundaries',
      label: 'MDB Wards 2026 — Amajuba DC25',
      datasetPattern: 'MDB Wards 2026',
      statutoryBasis: 'SPLUMA — affected ward determination',
      availability: 'available',
      permissionNote: null,
    },
    {
      role: 'Zoning / land use',
      label: 'COGTA Land Use Scheme Pillar 2026',
      datasetPattern: null,
      statutoryBasis: 'SPLUMA s.42 — existing zoning context',
      availability: 'pending-permission',
      permissionNote: 'COGTA FeatureServer accessible but redistribution permission pending.',
    },
    {
      role: 'Cadastral / property',
      label: 'NGI cadastral boundaries',
      datasetPattern: null,
      statutoryBasis: 'SPLUMA — property parcel identification',
      availability: 'pending-permission',
      permissionNote: 'NGI cadastral data requires formal licence.',
    },
  ],
};

// Default: administrative context only
const DEFAULT_REQUIREMENTS = NOTICE_SPATIAL_REQUIREMENTS.liquor.slice(0, 3);

const AVAILABILITY_ICON = {
  available: CheckCircle,
  'pending-permission': Clock,
  'not-available': XCircle,
};

const AVAILABILITY_COLOUR = {
  available: 'text-green-600',
  'pending-permission': 'text-amber-600',
  'not-available': 'text-muted-foreground',
};

interface Props {
  noticeType: string;
  noticeId: string;
}

export async function NoticeSpatialContext({ noticeType, noticeId }: Props) {
  const requirements = NOTICE_SPATIAL_REQUIREMENTS[noticeType] ?? DEFAULT_REQUIREMENTS;
  const supabase = createServiceClient();

  // Check which required datasets are actually published
  const patterns = requirements
    .filter((r) => r.datasetPattern)
    .map((r) => r.datasetPattern as string);

  const publishedNames = new Set<string>();
  if (patterns.length > 0) {
    const { data: datasets } = await supabase
      .from('spatial_datasets')
      .select('name')
      .eq('status', 'published')
      .eq('active', true);
    for (const d of datasets ?? []) {
      publishedNames.add(d.name);
    }
  }

  const available = requirements.filter(
    (r) => r.availability === 'available' && r.datasetPattern &&
      [...publishedNames].some((n) => n.includes(r.datasetPattern!.split('—')[0].trim()))
  ).length;
  const pending = requirements.filter((r) => r.availability === 'pending-permission').length;
  const missing = requirements.filter((r) => r.availability === 'not-available').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Spatial Dataset Requirements</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-600 font-medium">{available} available</span>
            <span className="text-amber-600 font-medium">{pending} pending</span>
            {missing > 0 && <span className="text-muted-foreground">{missing} unavailable</span>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {requirements.map((req) => {
            const isPublished = req.datasetPattern
              ? [...publishedNames].some((n) => n.includes(req.datasetPattern!.split('—')[0].trim()))
              : false;
            const effectiveAvailability = isPublished ? 'available' : req.availability;
            const Icon = AVAILABILITY_ICON[effectiveAvailability];
            const colour = AVAILABILITY_COLOUR[effectiveAvailability];

            return (
              <div key={req.role} className="px-6 py-3 flex items-start gap-3">
                <Icon className={`size-4 mt-0.5 shrink-0 ${colour}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{req.role}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.label}</p>
                    </div>
                    {isPublished && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium shrink-0">
                        Published
                      </span>
                    )}
                    {!isPublished && req.availability === 'pending-permission' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium shrink-0">
                        Pending
                      </span>
                    )}
                    {!isPublished && req.availability === 'not-available' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium shrink-0">
                        Not available
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{req.statutoryBasis}</p>
                  {req.permissionNote && !isPublished && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <AlertTriangle className="size-3 mt-0.5 shrink-0 text-amber-500" />
                      <p className="text-xs text-amber-700">{req.permissionNote}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-3 border-t">
          <Link href="/spatial/sources" className="text-xs text-blue-600 hover:underline">
            Manage spatial sources →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
