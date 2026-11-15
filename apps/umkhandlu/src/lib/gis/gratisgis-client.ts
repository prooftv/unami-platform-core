const DEFAULT_PAGE_SIZE = 1_000;
const MAX_PAGE_SIZE = 10_000;
const REQUEST_TIMEOUT_MS = 15_000;
const GEOMETRY_TYPES = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection',
]);

export type GratisGisCollection = {
  id: string;
  title: string;
  description: string | null;
  license: string | null;
  keywords: string[];
  crs: string[];
};

export type GratisGisFeature = {
  type: 'Feature';
  id: string;
  geometry: Record<string, unknown> | null;
  properties: Record<string, unknown>;
};

export type GratisGisCollectionFeatures = {
  collection: GratisGisCollection;
  features: GratisGisFeature[];
};

type JsonRecord = Record<string, unknown>;
type Fetcher = typeof fetch;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidCollectionId(value: string): boolean {
  const [itemId, layerKey, ...extra] = value.split('__');
  return (
    extra.length === 0 &&
    UUID_PATTERN.test(itemId) &&
    (layerKey === undefined ||
      (layerKey.length > 0 &&
        !layerKey.includes('__') &&
        /^[A-Za-z0-9_-]+$/.test(layerKey)))
  );
}

function getOgcApiUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('GratisGIS OGC API URL must be a valid absolute URL.');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error('GratisGIS OGC API URL must use HTTPS and contain no credentials, query, or fragment.');
  }
  return new URL(`${url.toString().replace(/\/+$/, '')}/`);
}

export function getConfiguredGratisGisOgcApiUrl(): string {
  const value = process.env.GRATISGIS_OGC_API_URL?.trim();
  if (!value) {
    throw new Error('GRATISGIS_OGC_API_URL is not configured.');
  }
  return getOgcApiUrl(value).toString().replace(/\/$/, '');
}

async function getJson(url: URL, fetcher: Fetcher): Promise<unknown> {
  const response = await fetcher(url, {
    method: 'GET',
    headers: { Accept: 'application/json, application/geo+json' },
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`GratisGIS request failed with HTTP ${response.status}.`);
  }
  return response.json();
}

function parseCollection(value: unknown, expectedId?: string): GratisGisCollection {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !isValidCollectionId(value.id) ||
    typeof value.title !== 'string' ||
    (expectedId !== undefined && value.id !== expectedId)
  ) {
    throw new Error('GratisGIS returned invalid collection metadata or an unexpected collection identity.');
  }
  return {
    id: value.id,
    title: value.title,
    description: typeof value.description === 'string' ? value.description : null,
    license: typeof value.license === 'string' ? value.license : null,
    keywords: Array.isArray(value.keywords)
      ? value.keywords.filter((keyword): keyword is string => typeof keyword === 'string')
      : [],
    crs: Array.isArray(value.crs)
      ? value.crs.filter((crs): crs is string => typeof crs === 'string')
      : [],
  };
}

function parseFeature(value: unknown): GratisGisFeature {
  if (
    !isRecord(value) ||
    value.type !== 'Feature' ||
    (typeof value.id !== 'string' && typeof value.id !== 'number') ||
    (typeof value.id === 'string' && value.id.length === 0) ||
    !Number.isFinite(typeof value.id === 'number' ? value.id : 0) ||
    (value.geometry !== null && !isRecord(value.geometry)) ||
    !isRecord(value.properties)
  ) {
    throw new Error('GratisGIS returned a feature without a valid id, geometry, or properties object.');
  }
  if (
    isRecord(value.geometry) &&
    (typeof value.geometry.type !== 'string' ||
      !GEOMETRY_TYPES.has(value.geometry.type))
  ) {
    throw new Error(`GratisGIS feature ${String(value.id)} has an unsupported geometry type.`);
  }
  return {
    type: 'Feature',
    id: String(value.id),
    geometry: value.geometry,
    properties: value.properties,
  };
}

function nextPageUrl(value: unknown, itemsUrl: URL): URL | null {
  if (!isRecord(value) || !Array.isArray(value.links)) {
    throw new Error('GratisGIS returned an invalid OGC feature collection.');
  }
  const links = value.links.flatMap((link) =>
    isRecord(link) && link.rel === 'next' && typeof link.href === 'string'
      ? [link.href]
      : [],
  );
  if (links.length > 1) {
    throw new Error('GratisGIS returned more than one next-page link.');
  }
  if (links.length === 0) return null;

  const next = new URL(links[0], itemsUrl);
  if (
    next.origin !== itemsUrl.origin ||
    next.pathname !== itemsUrl.pathname ||
    next.username ||
    next.password
  ) {
    throw new Error('GratisGIS next-page link escaped the configured OGC items endpoint.');
  }
  return next;
}

export async function discoverGratisGisCollections(
  ogcApiUrl: string,
  fetcher: Fetcher = fetch,
): Promise<GratisGisCollection[]> {
  const baseUrl = getOgcApiUrl(ogcApiUrl);
  const body: unknown = await getJson(new URL('collections', baseUrl), fetcher);
  if (!isRecord(body) || !Array.isArray(body.collections)) {
    throw new Error('GratisGIS returned an invalid collections catalogue.');
  }
  return body.collections
    .filter((collection) => !isRecord(collection) || collection.itemType !== 'record')
    .map((collection) => parseCollection(collection))
    .filter((collection) => collection.id !== 'catalog');
}

export async function fetchGratisGisCollectionFeatures({
  ogcApiUrl,
  collectionId,
  pageSize = DEFAULT_PAGE_SIZE,
  maxFeatures = 10_000,
  fetcher = fetch,
}: {
  ogcApiUrl: string;
  collectionId: string;
  pageSize?: number;
  maxFeatures?: number;
  fetcher?: Fetcher;
}): Promise<GratisGisCollectionFeatures> {
  if (!isValidCollectionId(collectionId)) {
    throw new Error('A valid GratisGIS collection ID is required.');
  }
  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_PAGE_SIZE ||
    !Number.isInteger(maxFeatures) ||
    maxFeatures < 1 ||
    maxFeatures > MAX_PAGE_SIZE
  ) {
    throw new Error(`GratisGIS page size and feature limit must be between 1 and ${MAX_PAGE_SIZE}.`);
  }

  const baseUrl = getOgcApiUrl(ogcApiUrl);
  const collectionUrl = new URL(`collections/${encodeURIComponent(collectionId)}`, baseUrl);
  const collection = parseCollection(await getJson(collectionUrl, fetcher), collectionId);
  const itemsUrl = new URL(
    `collections/${encodeURIComponent(collectionId)}/items`,
    baseUrl,
  );
  const firstPageUrl = new URL(itemsUrl);
  firstPageUrl.searchParams.set('limit', String(pageSize));

  const features: GratisGisFeature[] = [];
  const featureIds = new Set<string>();
  const visitedPages = new Set<string>();
  let pageUrl: URL | null = firstPageUrl;
  while (pageUrl) {
    if (visitedPages.has(pageUrl.toString())) {
      throw new Error('GratisGIS pagination returned a repeated page link.');
    }
    visitedPages.add(pageUrl.toString());

    const body: unknown = await getJson(pageUrl, fetcher);
    if (
      !isRecord(body) ||
      body.type !== 'FeatureCollection' ||
      !Array.isArray(body.features) ||
      (typeof body.numberReturned === 'number' &&
        body.numberReturned !== body.features.length)
    ) {
      throw new Error('GratisGIS returned an invalid or incomplete feature page.');
    }
    const pageFeatures = body.features.map(parseFeature);
    for (const feature of pageFeatures) {
      if (featureIds.has(feature.id)) {
        throw new Error(`GratisGIS returned duplicate feature ID ${feature.id}.`);
      }
      featureIds.add(feature.id);
      features.push(feature);
      if (features.length > maxFeatures) {
        throw new Error(`GratisGIS collection exceeds the configured ${maxFeatures}-feature ingestion limit.`);
      }
    }

    const next = nextPageUrl(body, itemsUrl);
    if (next && features.length >= maxFeatures) {
      throw new Error(`GratisGIS collection has more than the configured ${maxFeatures}-feature ingestion limit.`);
    }
    pageUrl = next;
  }

  return { collection, features };
}
