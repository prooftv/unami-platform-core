import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchGratisGisCollectionFeatures } from '../gratisgis-client.ts';

const collectionId = '00000000-0000-4000-8000-000000000001';

const collection = {
  id: collectionId,
  title: 'Institutional locations',
  description: 'Authoritative features',
  license: 'Attribution required',
  keywords: ['institutions'],
  crs: ['http://www.opengis.net/def/crs/OGC/1.3/CRS84'],
};

function feature(id, coordinates) {
  return {
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates },
    properties: { name: `Feature ${id}` },
  };
}

test('follows same-origin OGC next links and preserves feature IDs and coordinates', async () => {
  const requestedUrls = [];
  const fetcher = async (input) => {
    const url = new URL(input);
    requestedUrls.push(url);
    if (url.pathname.endsWith(`/collections/${collectionId}`)) {
      return Response.json(collection);
    }
    if (url.searchParams.get('cursor') === 'page-2') {
      return Response.json({
        type: 'FeatureCollection',
        numberReturned: 1,
        features: [feature('feature-b', [29.9, -27.7])],
        links: [],
      });
    }
    return Response.json({
      type: 'FeatureCollection',
      numberReturned: 1,
      features: [feature('feature-a', [29.8, -27.6])],
      links: [{
        rel: 'next',
        href: `https://gratis.example/api/public/ogc/collections/${collectionId}/items?limit=1&cursor=page-2`,
      }],
    });
  };

  const result = await fetchGratisGisCollectionFeatures({
    ogcApiUrl: 'https://gratis.example/api/public/ogc',
    collectionId,
    pageSize: 1,
    fetcher,
  });

  assert.deepEqual(result.features.map((item) => item.id), ['feature-a', 'feature-b']);
  assert.deepEqual(result.features.map((item) => item.geometry.coordinates), [
    [29.8, -27.6],
    [29.9, -27.7],
  ]);
  assert.equal(result.collection.license, collection.license);
  assert.equal(requestedUrls.length, 3);
});

test('rejects insecure endpoints and pagination links that escape the OGC items endpoint', async () => {
  await assert.rejects(
    fetchGratisGisCollectionFeatures({
      ogcApiUrl: 'http://gratis.example/api/public/ogc',
      collectionId,
    }),
    /must use HTTPS/,
  );

  const fetcher = async (input) => {
    const url = new URL(input);
    if (url.pathname.endsWith(`/collections/${collectionId}`)) {
      return Response.json(collection);
    }
    return Response.json({
      type: 'FeatureCollection',
      numberReturned: 1,
      features: [feature('feature-a', [29.8, -27.6])],
      links: [{
        rel: 'next',
        href: `https://other.example/collections/${collectionId}/items?cursor=next`,
      }],
    });
  };

  await assert.rejects(
    fetchGratisGisCollectionFeatures({
      ogcApiUrl: 'https://gratis.example/api/public/ogc',
      collectionId,
      pageSize: 1,
      fetcher,
    }),
    /escaped the configured OGC items endpoint/,
  );

  await assert.rejects(
    fetchGratisGisCollectionFeatures({
      ogcApiUrl: 'https://gratis.example/api/public/ogc',
      collectionId: '..',
    }),
    /valid GratisGIS collection ID/,
  );
});
