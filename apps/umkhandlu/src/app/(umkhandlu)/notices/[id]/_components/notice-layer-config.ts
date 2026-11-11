export type Availability = 'available' | 'pending-permission' | 'not-available';

// ─── Proximity radius per notice type ────────────────────────────────────────
// These are the legally relevant proximity distances for each statutory notice
// type under South African law. Where no statutory radius exists the value is
// null — absence of a radius does not mean proximity is irrelevant.

export interface ProximityRadiusConfig {
  metres: number;
  statutoryBasis: string;
  caveat: string | null;
}

export const PROXIMITY_RADIUS: Record<string, ProximityRadiusConfig | null> = {
  // KZN Liquor Licensing Act 6 of 2010, s.43(2)(b) — the Board must consider
  // proximity to schools, places of worship, health facilities and recreation
  // facilities. 500m is the accepted reference distance used by KZNERA in
  // practice. It is not a hard statutory cutoff — the Board retains discretion.
  liquor: {
    metres: 500,
    statutoryBasis: 'KZN Liquor Licensing Act s.43(2)(b)',
    caveat: '500m is the accepted KZNERA reference distance. The Board retains discretion — this is not a hard statutory exclusion zone.',
  },
  // MPRDA s.5(4)(c) — the applicant must consult affected communities within
  // the area of the proposed mining right. 500m is the standard practice radius
  // used by DMRE and environmental practitioners for community notification.
  // Not codified in the Act itself.
  mining: {
    metres: 500,
    statutoryBasis: 'MPRDA s.5(4)(c) — community consultation area',
    caveat: '500m is a DMRE practice standard for community notification. The actual consultation area is determined by the environmental assessment practitioner.',
  },
  // NEMA EIA Regulations GN R982 — no fixed proximity radius. The 32m
  // watercourse setback is a specific rule, not a general proximity radius.
  // Receptor sensitivity is assessed case-by-case.
  eia: null,
  // SPLUMA s.42 — no statutory proximity radius for rezoning applications.
  rezoning: null,
  // No statutory proximity radius for infrastructure notices.
  infrastructure: null,
  // No statutory proximity radius for these notice types.
  'land-use': null,
  township: null,
  building: null,
  telecom: null,
  estate: null,
  liquidation: null,
  pto: null,
};

export interface LayerRequirement {
  role: string;
  label: string;
  datasetPattern: string | null;
  statutoryBasis: string;
  availability: Availability;
  permissionNote: string | null;
}

const ADMIN_BASE: LayerRequirement[] = [
  {
    role: 'Ward boundaries',
    label: 'MDB Wards 2026 — Amajuba DC25',
    datasetPattern: 'MDB Wards 2026',
    statutoryBasis: 'Ward committee jurisdiction and community notification',
    availability: 'available',
    permissionNote: null,
  },
  {
    role: 'Local municipality',
    label: 'KZN DARD Local Municipalities — Amajuba DC25',
    datasetPattern: 'KZN DARD Local Municipalities',
    statutoryBasis: 'Determining which authority has jurisdiction',
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
];

const COGTA_ILIS: LayerRequirement = {
  role: 'Traditional authority areas',
  label: 'KZN COGTA ILIS Land Tenure Component v2',
  datasetPattern: null,
  statutoryBasis: 'Traditional community consultation',
  availability: 'pending-permission',
  permissionNote: 'COGTA ILIS accessible but feature queries blocked from external IPs. IP allowlisting request submitted.',
};

const COGTA_ZONING: LayerRequirement = {
  role: 'Zoning / land use',
  label: 'COGTA Land Use Scheme Pillar 2026',
  datasetPattern: null,
  statutoryBasis: 'Land use compatibility assessment',
  availability: 'pending-permission',
  permissionNote: 'COGTA FeatureServer accessible but redistribution permission pending.',
};

const NGI_CADASTRE: LayerRequirement = {
  role: 'Cadastral / property',
  label: 'NGI cadastral boundaries',
  datasetPattern: null,
  statutoryBasis: 'Property parcel identification',
  availability: 'pending-permission',
  permissionNote: 'NGI cadastral data requires a formal licence.',
};

const HOT_EDUCATION: LayerRequirement = {
  role: 'Schools / learning institutions',
  label: 'HOT OSM Education Facilities — Amajuba DC25',
  datasetPattern: 'HOT OSM Education Facilities',
  statutoryBasis: 'Proximity to schools',
  availability: 'available',
  permissionNote: null,
};

const HOT_HEALTH: LayerRequirement = {
  role: 'Health facilities',
  label: 'HOT OSM Health Facilities — Amajuba DC25',
  datasetPattern: 'HOT OSM Health Facilities',
  statutoryBasis: 'Proximity to health facilities',
  availability: 'available',
  permissionNote: null,
};

const HOT_CULTURAL: LayerRequirement = {
  role: 'Religious institutions',
  label: 'HOT OSM Cultural Places — Amajuba DC25',
  datasetPattern: 'HOT OSM Cultural Places',
  statutoryBasis: 'Proximity to places of worship',
  availability: 'available',
  permissionNote: null,
};

const HOT_POPULATED: LayerRequirement = {
  role: 'Affected communities',
  label: 'HOT OSM Populated Places — Amajuba DC25',
  datasetPattern: 'HOT OSM Populated Places',
  statutoryBasis: 'Affected community identification for public participation',
  availability: 'available',
  permissionNote: null,
};

const HOT_WATERWAYS: LayerRequirement = {
  role: 'Waterways / watercourses',
  label: 'HOT OSM Waterways — Amajuba DC25',
  datasetPattern: 'HOT OSM Waterways',
  statutoryBasis: 'Watercourse setback and wetland proximity',
  availability: 'available',
  permissionNote: null,
};

const HOT_ROADS: LayerRequirement = {
  role: 'Road network',
  label: 'HOT OSM Roads — Amajuba DC25',
  datasetPattern: 'HOT OSM Roads',
  statutoryBasis: 'Road access and servitude analysis',
  availability: 'available',
  permissionNote: null,
};

const HOT_RAILWAYS: LayerRequirement = {
  role: 'Railways',
  label: 'HOT OSM Railways — Amajuba DC25',
  datasetPattern: 'HOT OSM Railways',
  statutoryBasis: 'Rail corridor proximity — Newcastle coal line and freight infrastructure',
  availability: 'available',
  permissionNote: null,
};

const KZNERA_LICENSED: LayerRequirement = {
  role: 'Licensed premises',
  label: 'KZNERA licensed premises register',
  datasetPattern: null,
  statutoryBasis: 'Proximity to existing licensed premises',
  availability: 'not-available',
  permissionNote: 'KZNERA does not publish a machine-readable register. Manual verification required.',
};

export const NOTICE_LAYER_CONFIG: Record<string, LayerRequirement[]> = {
  liquor: [
    ...ADMIN_BASE,
    { ...COGTA_ILIS, statutoryBasis: 'KZN Liquor Licensing Act s.43 — traditional council consultation' },
    { ...HOT_EDUCATION, statutoryBasis: 'KZN Liquor Licensing Act s.43 — proximity to schools' },
    { ...HOT_CULTURAL, statutoryBasis: 'KZN Liquor Licensing Act s.43 — proximity to places of worship' },
    { ...HOT_HEALTH, statutoryBasis: 'KZN Liquor Licensing Act s.43 — proximity to health facilities' },
    { ...HOT_POPULATED, statutoryBasis: 'KZN Liquor Licensing Act s.43 — proximity to recreation facilities' },
    KZNERA_LICENSED,
    { ...COGTA_ZONING, statutoryBasis: 'Land use context for proposed premises' },
    NGI_CADASTRE,
  ],
  eia: [
    ...ADMIN_BASE,
    { ...HOT_WATERWAYS, statutoryBasis: 'NEMA EIA Regulations — watercourse setback (32m) and wetland proximity' },
    { ...HOT_POPULATED, statutoryBasis: 'NEMA EIA — public participation affected community identification' },
    { ...HOT_HEALTH, statutoryBasis: 'NEMA EIA — receptor sensitivity assessment' },
    { ...HOT_EDUCATION, statutoryBasis: 'NEMA EIA — receptor sensitivity assessment' },
    { ...COGTA_ILIS, statutoryBasis: 'IPILRA — traditional community consultation' },
    { ...COGTA_ZONING, statutoryBasis: 'NEMA s.24 — land use compatibility assessment' },
    NGI_CADASTRE,
  ],
  rezoning: [
    ...ADMIN_BASE,
    { ...HOT_POPULATED, statutoryBasis: 'SPLUMA — affected community identification for public participation' },
    { ...HOT_ROADS, statutoryBasis: 'SPLUMA — road access and servitude analysis' },
    { ...COGTA_ZONING, statutoryBasis: 'SPLUMA s.42 — existing zoning context' },
    NGI_CADASTRE,
  ],
  infrastructure: [
    ...ADMIN_BASE,
    HOT_ROADS,
    HOT_RAILWAYS,
    HOT_WATERWAYS,
    HOT_POPULATED,
  ],
  mining: [
    ...ADMIN_BASE,
    { ...HOT_WATERWAYS, statutoryBasis: 'MPRDA / NEMA — watercourse setback and acid mine drainage risk' },
    { ...HOT_POPULATED, statutoryBasis: 'MPRDA s.5 — affected community consultation and surface rights' },
    { ...HOT_HEALTH, statutoryBasis: 'Receptor sensitivity — health facilities near mining operations' },
    { ...HOT_EDUCATION, statutoryBasis: 'Receptor sensitivity — schools near mining operations' },
    { ...COGTA_ILIS, statutoryBasis: 'MPRDA s.5 — traditional community surface rights consultation' },
  ],
};

export const DEFAULT_LAYERS = ADMIN_BASE;
