'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, Marker } from 'leaflet';
import { AreaInfoPanel } from './AreaInfoPanel';
import { createMap, fitToLayer, loadLeafletCss } from '@/lib/map/leaflet-utils';

export interface PublishedDataset {
  id: string;
  name: string;
  source_institution: string;
  feature_count: number | null;
  dataset_date: string | null;
  geojson: GeoJSONFeatureCollection | null;
  attribution: string | null;
  loadOnDemand?: boolean;
}

export interface NoticeMarker {
  id: string;
  type: string;
  title: string;
  status: string;
  is_statutory: boolean;
  comment_deadline: string | null;
  ward_ref: string | null;
  latitude: number;
  longitude: number;
  proximity_radius_metres: number | null;
}

export interface NodeGeoRef {
  nodeId: string;
  recordId: string;
  recordType: 'record' | 'notice' | 'project';
  label: string;
  latitude: number;
  longitude: number;
  district?: string;
  municipality?: string;
  ward?: string;
  timestamp?: string;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

interface GeoJSONFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown> | null;
}

interface Props {
  datasets: PublishedDataset[];
  notices: NoticeMarker[];
  nodeGeoRefs: NodeGeoRef[];
}

const AMAJUBA_ZOOM = 9;

type SpatialMapBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

type SpatialMapLayer = {
  id: string;
  datasetId: string;
  colour: string;
  features: GeoJSONFeature[];
};

type SpatialMapLayersResponse = {
  layers: SpatialMapLayer[];
  permissionFiltered: boolean;
};

const LAYER_COLOURS = [
  '#facc15', // yellow
  '#22c55e', // green
  '#ef4444', // red
  '#f97316', // orange
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#14b8a6', // teal
];

const LAYER_STYLE = (colour: string) => ({
  color: colour,
  weight: 3,
  opacity: 1,
  fillOpacity: 0.2,
  fillColor: colour,
});

const PROXIMITY_CIRCLE_STYLE = {
  color: '#7c3aed',
  weight: 3.5,
  opacity: 1,
  fillOpacity: 0.06,
  fillColor: '#7c3aed',
  dashArray: '10 6',
};

const noticeColour = (isStatutory: boolean) => isStatutory ? '#dc2626' : '#2563eb';

const NODE_TYPE_COLOUR: Record<string, string> = {
  record:  '#7c3aed',
  notice:  '#0891b2',
  project: '#16a34a',
};

// Datasets with many features default to off to avoid loading everything at once
const LARGE_THRESHOLD = 2000;

export function SpatialMap({ datasets, notices, nodeGeoRefs }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRefs = useRef<Map<string, LeafletGeoJSON>>(new Map());
  const initialBoundsRef = useRef<import('leaflet').LatLngBounds | null>(null);
  const noticeMarkerRefs = useRef<Marker[]>([]);
  const nodeMarkerRefs = useRef<Marker[]>([]);

  // Large datasets default off; small datasets default on
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(datasets.filter((d) => (d.feature_count ?? 0) <= LARGE_THRESHOLD).map((d) => d.id)),
  );
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set());
  const [loadedGeojson, setLoadedGeojson] = useState<Map<string, GeoJSONFeatureCollection>>(new Map());
  const [spatialLayerColours, setSpatialLayerColours] = useState<Map<string, string>>(new Map());
  const [mapViewport, setMapViewport] = useState<SpatialMapBounds | null>(null);
  const [mapLayerError, setMapLayerError] = useState<string | null>(null);
  const [mapLayerRetry, setMapLayerRetry] = useState(0);
  const [permissionFiltered, setPermissionFiltered] = useState(false);
  const [mapInitialError, setMapInitialError] = useState<string | null>(null);
  const [showNotices, setShowNotices] = useState(true);
  const [showNodeActivity, setShowNodeActivity] = useState(true);
  const proximityCircleRef = useRef<import('leaflet').Circle | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<{
    datasetName: string;
    datasetSource: string;
    datasetDate: string | null;
    properties: Record<string, unknown>;
  } | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<NoticeMarker | null>(null);
  const [selectedNodeRef, setSelectedNodeRef] = useState<NodeGeoRef | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const visibleDatasetIds = useMemo(
    () => datasets.filter((dataset) => visibleLayers.has(dataset.id)).map((dataset) => dataset.id),
    [datasets, visibleLayers],
  );
  const visibleDatasetIdsKey = visibleDatasetIds.join(',');

  // Initialise map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default as typeof import('leaflet');
      if (cancelled || !containerRef.current) return;
      loadLeafletCss();

      const coverage = L.latLngBounds([]);
      for (const notice of notices) {
        coverage.extend([notice.latitude, notice.longitude]);
      }
      for (const ref of nodeGeoRefs) {
        coverage.extend([ref.latitude, ref.longitude]);
      }

      let wardLoadError: string | null = null;
      try {
        const response = await fetch('/api/spatial/wards', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Ward boundaries request failed (${response.status})`);
        }
        const collection = (await response.json()) as GeoJSONFeatureCollection;
        const wardLayer = L.geoJSON(collection as Parameters<typeof L.geoJSON>[0]);
        const wardBounds = wardLayer.getBounds();
        if (wardBounds.isValid()) coverage.extend(wardBounds);
      } catch (error) {
        wardLoadError =
          error instanceof Error ? error.message : 'Ward boundaries unavailable';
      }

      if (cancelled) return;
      if (!coverage.isValid()) {
        setMapInitialError(
          wardLoadError ??
            'No published spatial boundaries or georeferenced activity are available to set the map extent.',
        );
        return;
      }

      initialBoundsRef.current = coverage;
      const centre = coverage.getCenter();
      const map = createMap(
        L,
        containerRef.current,
        [centre.lat, centre.lng],
        AMAJUBA_ZOOM,
        { scrollWheelZoom: true },
      );
      map.fitBounds(coverage, { padding: [40, 40], maxZoom: AMAJUBA_ZOOM });
      map.on('moveend', () => {
        const bounds = map.getBounds();
        setMapViewport({
          west: bounds.getWest(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          north: bounds.getNorth(),
        });
      });
      const bounds = map.getBounds();
      setMapViewport({
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      });
      mapRef.current = map;
      setMapInitialError(wardLoadError);
      setMapReady(true);
    }

    init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
      setMapViewport(null);
      layerRefs.current.clear();
    };
  }, [notices, nodeGeoRefs]);

  // Load only visible datasets for the current viewport. Permission checks live on the API.
  useEffect(() => {
    if (!mapReady || !mapViewport) return;
    if (visibleDatasetIds.length === 0) {
      setLoadingLayers(new Set());
      setLoadedGeojson(new Map());
      setSpatialLayerColours(new Map());
      setMapLayerError(null);
      setPermissionFiltered(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    const boundsValue = [
      mapViewport.west,
      mapViewport.south,
      mapViewport.east,
      mapViewport.north,
    ].join(',');
    const query = new URLSearchParams({
      bbox: boundsValue,
      datasetIds: visibleDatasetIdsKey,
    });

    setMapLayerError(null);
    setPermissionFiltered(false);
    setLoadingLayers(new Set(visibleDatasetIds));
    setLoadedGeojson(new Map());
    setSpatialLayerColours(new Map());
    const timeout = window.setTimeout(() => {
      void fetch(`/api/spatial/map-layers?${query}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
        .then(async (response) => {
          const body = (await response.json()) as
            | SpatialMapLayersResponse
            | { error?: string };
          if (!response.ok) {
            throw new Error(
              'error' in body && body.error
                ? body.error
                : `Spatial layers request failed (${response.status})`,
            );
          }
          return body as SpatialMapLayersResponse;
        })
        .then((body) => {
          if (!active) return;
          const features = new Map<string, GeoJSONFeatureCollection>();
          const colours = new Map<string, string>();
          for (const layer of body.layers) {
            features.set(layer.datasetId, {
              type: 'FeatureCollection',
              features: layer.features,
            });
            colours.set(layer.datasetId, layer.colour);
          }
          setLoadedGeojson(features);
          setSpatialLayerColours(colours);
          setPermissionFiltered(body.permissionFiltered);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          if (active) {
            setMapLayerError(
              error instanceof Error ? error.message : 'Spatial layers unavailable',
            );
            setLoadedGeojson(new Map());
            setSpatialLayerColours(new Map());
          }
        })
        .finally(() => {
          if (active) setLoadingLayers(new Set());
        });
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    mapReady,
    mapViewport,
    visibleDatasetIds,
    visibleDatasetIdsKey,
    mapLayerRetry,
  ]);

  // Sync spatial dataset layers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    async function syncLayers() {
      const L = (await import('leaflet')).default;
      const map = mapRef.current!;

      datasets.forEach((dataset, idx) => {
        const existing = layerRefs.current.get(dataset.id);
        if (existing) {
          map.removeLayer(existing);
          layerRefs.current.delete(dataset.id);
        }

        if (!visibleLayers.has(dataset.id)) return;

        const geojson = loadedGeojson.get(dataset.id) ?? null;

        if (!geojson?.features?.length) return;
        const colour =
          spatialLayerColours.get(dataset.id) ??
          LAYER_COLOURS[idx % LAYER_COLOURS.length];

        const layer = L.geoJSON(geojson as Parameters<typeof L.geoJSON>[0], {
          style: () => LAYER_STYLE(colour),
          pointToLayer: (_f, latlng) =>
            L.circleMarker(latlng, { radius: 6, fillColor: colour, color: '#fff', weight: 1.5, opacity: 1, fillOpacity: 0.9 }),
          onEachFeature: (feature, fl) => {
            fl.on('click', () => {
              setSelectedFeature({
                datasetName: dataset.name,
                datasetSource: dataset.source_institution,
                datasetDate: dataset.dataset_date,
                properties: feature.properties ?? {},
              });
              setSelectedNotice(null);
              setSelectedNodeRef(null);
            });
          },
        });

        layer.addTo(map);
        layerRefs.current.set(dataset.id, layer);
      });
    }

    syncLayers();
  }, [mapReady, datasets, visibleLayers, loadedGeojson, spatialLayerColours]);

  // Sync notice markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    async function syncNotices() {
      const L = (await import('leaflet')).default;
      const map = mapRef.current!;

      noticeMarkerRefs.current.forEach((m) => map.removeLayer(m));
      noticeMarkerRefs.current = [];

      if (!showNotices) return;

      notices.forEach((notice) => {
        const colour = noticeColour(notice.is_statutory);
        const size = notice.is_statutory ? 16 : 12;
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${colour};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const marker = L.marker([notice.latitude, notice.longitude], { icon });
        marker.on('click', () => {
          setSelectedNotice(notice);
          setSelectedFeature(null);
          setSelectedNodeRef(null);
        });
        marker.addTo(map);
        noticeMarkerRefs.current.push(marker);
      });
    }

    syncNotices();
  }, [mapReady, notices, showNotices]);

  // Sync node activity markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    async function syncNodeMarkers() {
      const L = (await import('leaflet')).default;
      const map = mapRef.current!;

      nodeMarkerRefs.current.forEach((m) => map.removeLayer(m));
      nodeMarkerRefs.current = [];

      if (!showNodeActivity) return;

      nodeGeoRefs.forEach((ref) => {
        const colour = NODE_TYPE_COLOUR[ref.recordType] ?? '#6366f1';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:10px;height:10px;border-radius:2px;background:${colour};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);transform:rotate(45deg)"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        const marker = L.marker([ref.latitude, ref.longitude], { icon });
        marker.on('click', () => {
          setSelectedNodeRef(ref);
          setSelectedFeature(null);
          setSelectedNotice(null);
        });
        marker.addTo(map);
        nodeMarkerRefs.current.push(marker);
      });
    }

    syncNodeMarkers();
  }, [mapReady, nodeGeoRefs, showNodeActivity]);

  // Draw proximity circle when a statutory notice with a radius is selected
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    // Remove previous circle
    if (proximityCircleRef.current) {
      map.removeLayer(proximityCircleRef.current);
      proximityCircleRef.current = null;
    }

    if (
      selectedNotice &&
      selectedNotice.proximity_radius_metres &&
      selectedNotice.latitude &&
      selectedNotice.longitude
    ) {
      import('leaflet').then(({ default: L }) => {
        const circle = L.circle(
          [selectedNotice.latitude, selectedNotice.longitude],
          {
            radius: selectedNotice.proximity_radius_metres!,
            ...PROXIMITY_CIRCLE_STYLE,
          },
        );
        circle.addTo(map);
        proximityCircleRef.current = circle;
        map.fitBounds(circle.getBounds(), { padding: [40, 40], maxZoom: 15 });
      });
    }
  }, [mapReady, selectedNotice]);

  function toggleLayer(id: string) {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function fitAll() {
    const map = mapRef.current;
    if (!map) return;
    const all = Array.from(layerRefs.current.values());
    if (!all.length) {
      if (initialBoundsRef.current?.isValid()) {
        map.fitBounds(initialBoundsRef.current, { padding: [20, 20] });
      }
      return;
    }
    try {
      const bounds = all.reduce((acc, l) => acc.extend(l.getBounds()), all[0].getBounds());
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    } catch {
      if (initialBoundsRef.current?.isValid()) {
        map.fitBounds(initialBoundsRef.current, { padding: [20, 20] });
      }
    }
  }

  // Group datasets for sidebar display
  const smallDatasets = datasets.filter((d) => (d.feature_count ?? 0) <= LARGE_THRESHOLD);
  const largeDatasets = datasets.filter((d) => (d.feature_count ?? 0) > LARGE_THRESHOLD);

  function LayerRow({ d, idx }: { d: PublishedDataset; idx: number }) {
    const colour =
      spatialLayerColours.get(d.id) ?? LAYER_COLOURS[idx % LAYER_COLOURS.length];
    const visible = visibleLayers.has(d.id);
    const loading = loadingLayers.has(d.id);
    const hasData = d.geojson?.features?.length || loadedGeojson.has(d.id);

    return (
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id={`layer-${d.id}`}
          checked={visible}
          onChange={() => toggleLayer(d.id)}
          className="mt-0.5 rounded shrink-0"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={`layer-${d.id}`} className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm shrink-0" style={{ backgroundColor: colour }} />
            <span className="truncate">{d.name}</span>
          </label>
          <p className="text-xs text-muted-foreground truncate pl-4">{d.source_institution}</p>
          <div className="flex items-center gap-2 pl-4 mt-0.5">
            {d.feature_count != null && (
              <span className="text-xs text-muted-foreground">{d.feature_count.toLocaleString()} features</span>
            )}
            {loading && <span className="text-xs text-blue-600 animate-pulse">Loading…</span>}
            {d.loadOnDemand && !hasData && !loading && visible && (
              <span className="text-xs text-amber-600">Fetching…</span>
            )}
            {hasData && (
              <button
                type="button"
                onClick={() => {
                  const layer = layerRefs.current.get(d.id);
                  if (layer && mapRef.current) fitToLayer(mapRef.current, layer, [20, 20]);
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Zoom
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)] min-h-[500px]">
      {/* Sidebar */}
      <div className="lg:w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
        <div className="rounded-lg border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Layers ({datasets.length})</p>
            <button type="button" onClick={fitAll} className="text-xs text-muted-foreground hover:text-foreground underline">
              Fit all
            </button>
          </div>

          {datasets.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No published datasets. Upload and approve a dataset to display it here.
            </p>
          )}

          {smallDatasets.length > 0 && (
            <div className="space-y-2">
              {smallDatasets.map((d, idx) => <LayerRow key={d.id} d={d} idx={idx} />)}
            </div>
          )}

          {largeDatasets.length > 0 && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Large datasets (load on demand)</p>
              {largeDatasets.map((d, idx) => (
                <LayerRow key={d.id} d={d} idx={smallDatasets.length + idx} />
              ))}
            </div>
          )}

          {/* Node activity overlay */}
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="layer-node-activity"
                checked={showNodeActivity}
                onChange={() => setShowNodeActivity((v) => !v)}
                className="mt-0.5 rounded shrink-0"
              />
              <div className="min-w-0 flex-1">
                <label htmlFor="layer-node-activity" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                  <span className="inline-flex gap-0.5">
                    <span className="inline-block size-2.5 rounded-sm shrink-0 bg-violet-600" style={{ transform: 'rotate(45deg)' }} />
                    <span className="inline-block size-2.5 rounded-sm shrink-0 bg-cyan-600" style={{ transform: 'rotate(45deg)' }} />
                  </span>
                  <span>Node activity {nodeGeoRefs.length > 0 ? `(${nodeGeoRefs.length})` : '(none)'}</span>
                </label>
                <p className="text-xs text-muted-foreground pl-6">Purple=record · Cyan=notice · Green=project</p>
              </div>
            </div>
          </div>

          {/* Notices overlay */}
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="layer-notices"
                checked={showNotices}
                onChange={() => setShowNotices((v) => !v)}
                className="mt-0.5 rounded shrink-0"
              />
              <div className="min-w-0 flex-1">
                <label htmlFor="layer-notices" className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                  <span className="inline-flex gap-0.5">
                    <span className="inline-block size-2.5 rounded-full shrink-0 bg-red-600" />
                    <span className="inline-block size-2.5 rounded-full shrink-0 bg-blue-600" />
                  </span>
                  <span>Notices {notices.length > 0 ? `(${notices.length})` : '(none)'}</span>
                </label>
                <p className="text-xs text-muted-foreground pl-6">Red = statutory · Blue = governance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Area information panel */}
        {selectedFeature && (
          <AreaInfoPanel
            feature={selectedFeature}
            onClose={() => setSelectedFeature(null)}
          />
        )}

        {/* Selected notice inspector */}
        {selectedNotice && (
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="inline-block size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: noticeColour(selectedNotice.is_statutory) }}
                />
                <p className="text-sm font-medium truncate">{selectedNotice.title}</p>
              </div>
              <button type="button" onClick={() => setSelectedNotice(null)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">✕</button>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="capitalize">{selectedNotice.type.replace(/-/g, ' ')} · {selectedNotice.status}</p>
              {selectedNotice.ward_ref && <p>Ward: {selectedNotice.ward_ref}</p>}
              {selectedNotice.comment_deadline && (
                <p>Deadline: {new Date(selectedNotice.comment_deadline).toLocaleDateString()}</p>
              )}
              {selectedNotice.proximity_radius_metres && (
                <p className="text-violet-700 font-medium">{selectedNotice.proximity_radius_metres}m proximity zone</p>
              )}
            </div>
            <Link href={`/notices/${selectedNotice.id}`} className="text-xs text-blue-600 hover:underline">
              View notice →
            </Link>
          </div>
        )}

        {/* Selected node activity inspector */}
        {selectedNodeRef && (
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="inline-block size-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: NODE_TYPE_COLOUR[selectedNodeRef.recordType] ?? '#6366f1', transform: 'rotate(45deg)' }}
                />
                <p className="text-sm font-medium truncate">{selectedNodeRef.label}</p>
              </div>
              <button type="button" onClick={() => setSelectedNodeRef(null)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">✕</button>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="capitalize">{selectedNodeRef.recordType} · Node activity</p>
              {selectedNodeRef.municipality && <p>Municipality: {selectedNodeRef.municipality}</p>}
              {selectedNodeRef.ward && <p>Ward: {selectedNodeRef.ward}</p>}
              {selectedNodeRef.timestamp && (
                <p>{new Date(selectedNodeRef.timestamp).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">Attribution</p>
          {datasets.length === 0
            ? <p className="text-xs text-muted-foreground">No datasets published.</p>
            : datasets.map((d) => (
                <p key={d.id} className="text-xs text-muted-foreground">
                  {d.name}: {d.attribution ?? d.source_institution}{d.dataset_date ? ` (${d.dataset_date})` : ''}
                </p>
              ))
          }
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-lg border overflow-hidden relative min-h-[400px]">
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <p className="text-sm text-muted-foreground">
              {mapInitialError ?? 'Loading published map context…'}
            </p>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
        {(mapInitialError || mapLayerError || permissionFiltered) && mapReady && (
          <div className="absolute bottom-3 left-3 z-[1000] max-w-[min(32rem,70%)] rounded bg-background/95 px-2.5 py-1.5 text-xs text-amber-700 shadow">
            {mapLayerError
              ? `Spatial layers unavailable: ${mapLayerError}`
              : mapInitialError
                ? `Administrative boundaries unavailable: ${mapInitialError}`
                : 'Some spatial datasets are withheld pending redistribution permission verification.'}
            {mapLayerError && (
              <button
                type="button"
                onClick={() => setMapLayerRetry((current) => current + 1)}
                className="ml-2 underline"
              >
                Retry
              </button>
            )}
          </div>
        )}
        {loadingLayers.size > 0 && mapReady && !mapLayerError && (
          <div className="absolute top-3 left-3 z-[1000] rounded bg-background/95 px-2.5 py-1.5 text-xs text-muted-foreground shadow">
            Loading spatial layers for this map view…
          </div>
        )}
      </div>
    </div>
  );
}
