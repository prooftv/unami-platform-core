'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import {
  Map as MapGL,
  MapGeoJSON,
  MapMarker,
  MarkerContent,
  MapControls,
  type MapViewport,
  type MapGeoJSONEvent,
} from '@/components/ui/map';
import { AreaInfoPanel } from './AreaInfoPanel';

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
  coordinateSource?: string;
  coordinateRole?: 'site' | 'area-reference';
  locationPrecision?: string | null;
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

// Amajuba District centre
const AMAJUBA_CENTRE: [number, number] = [29.93, -27.76];
const AMAJUBA_ZOOM = 9;
const MAX_VIEWPORT_SPAN = 1.9;

const LAYER_COLOURS = [
  '#facc15', '#22c55e', '#ef4444', '#f97316', '#06b6d4',
  '#a855f7', '#f59e0b', '#ec4899', '#3b82f6', '#10b981',
  '#8b5cf6', '#14b8a6',
];

const BOUNDARY_FRAGMENTS = ['ward', 'district', 'municipalit', 'boundary'];
function isBoundary(name: string) {
  const l = name.toLowerCase();
  return BOUNDARY_FRAGMENTS.some((f) => l.includes(f));
}

const LARGE_THRESHOLD = 2000;

const NODE_TYPE_COLOUR: Record<string, string> = {
  record: '#7c3aed',
  notice: '#0891b2',
  project: '#16a34a',
};

function noticeColour(isStatutory: boolean) {
  return isStatutory ? '#dc2626' : '#2563eb';
}

function clampViewport(vp: MapViewport): MapViewport {
  const [lng, lat] = vp.center;
  return vp; // MapLibre handles viewport clamping internally; keep for API compat
}

type SelectedFeature = {
  datasetName: string;
  datasetSource: string;
  datasetDate: string | null;
  properties: Record<string, unknown>;
};

export function SpatialMap({ datasets, notices, nodeGeoRefs }: Props) {
  const [viewport, setViewport] = useState<Partial<MapViewport>>({
    center: AMAJUBA_CENTRE,
    zoom: AMAJUBA_ZOOM,
  });

  // Layer visibility
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(datasets.filter((d) => (d.feature_count ?? 0) <= LARGE_THRESHOLD).map((d) => d.id)),
  );
  const [showNotices, setShowNotices] = useState(true);
  const [showNodeActivity, setShowNodeActivity] = useState(true);

  // Viewport-based layer loading
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set<string>());
  const [loadedGeojson, setLoadedGeojson] = useState<globalThis.Map<string, GeoJSONFeatureCollection>>(new globalThis.Map());
  const [spatialLayerColours, setSpatialLayerColours] = useState<globalThis.Map<string, string>>(new globalThis.Map());
  const [mapLayerError, setMapLayerError] = useState<string | null>(null);
  const [permissionFiltered, setPermissionFiltered] = useState(false);

  // Selection state
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<NoticeMarker | null>(null);
  const [selectedNodeRef, setSelectedNodeRef] = useState<NodeGeoRef | null>(null);

  const visibleDatasetIds = datasets
    .filter((d) => visibleLayers.has(d.id))
    .map((d) => d.id);

  const handleViewportChange = useCallback((vp: MapViewport) => {
    setViewport(vp);

    if (visibleDatasetIds.length === 0) return;

    // Derive bbox from center+zoom approximation — MapLibre doesn't expose bounds
    // directly here; we fetch on moveend with a fixed span based on zoom
    const [lng, lat] = vp.center;
    const span = Math.min(MAX_VIEWPORT_SPAN, 360 / Math.pow(2, vp.zoom - 1));
    const half = span / 2;
    const bbox = [lng - half, lat - half, lng + half, lat + half].join(',');

    const controller = new AbortController();
    setMapLayerError(null);
    setLoadingLayers(new Set(visibleDatasetIds));

    const query = new URLSearchParams({ bbox, datasetIds: visibleDatasetIds.join(',') });
    fetch(`/api/spatial/map-layers?${query}`, { cache: 'no-store', signal: controller.signal })
      .then((r) => r.json())
      .then((body: { layers: Array<{ datasetId: string; colour: string; features: GeoJSONFeature[] }>; permissionFiltered: boolean }) => {
        const features = new globalThis.Map<string, GeoJSONFeatureCollection>();
        const colours = new globalThis.Map<string, string>();
        for (const layer of body.layers ?? []) {
          features.set(layer.datasetId, { type: 'FeatureCollection', features: layer.features });
          colours.set(layer.datasetId, layer.colour);
        }
        setLoadedGeojson(features);
        setSpatialLayerColours(colours);
        setPermissionFiltered(body.permissionFiltered ?? false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setMapLayerError(err instanceof Error ? err.message : 'Spatial layers unavailable');
      })
      .finally(() => setLoadingLayers(new Set()));
  }, [visibleDatasetIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleLayer(id: string) {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const smallDatasets = datasets.filter((d) => (d.feature_count ?? 0) <= LARGE_THRESHOLD);
  const largeDatasets = datasets.filter((d) => (d.feature_count ?? 0) > LARGE_THRESHOLD);

  function LayerRow({ d, idx }: { d: PublishedDataset; idx: number }) {
    const colour = spatialLayerColours.get(d.id) ?? LAYER_COLOURS[idx % LAYER_COLOURS.length];
    const visible = visibleLayers.has(d.id);
    const loading = loadingLayers.has(d.id);
    return (
      <div className="flex items-start gap-2">
        <input type="checkbox" id={`layer-${d.id}`} checked={visible} onChange={() => toggleLayer(d.id)} className="mt-0.5 rounded shrink-0" />
        <div className="min-w-0 flex-1">
          <label htmlFor={`layer-${d.id}`} className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm shrink-0" style={{ backgroundColor: colour }} />
            <span className="truncate">{d.name}</span>
          </label>
          <p className="text-xs text-muted-foreground truncate pl-4">{d.source_institution}</p>
          <div className="flex items-center gap-2 pl-4 mt-0.5">
            {d.feature_count != null && <span className="text-xs text-muted-foreground">{d.feature_count.toLocaleString()} features</span>}
            {loading && <span className="text-xs text-blue-600 animate-pulse">Loading…</span>}
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
          <p className="text-sm font-medium">Layers ({datasets.length})</p>

          {datasets.length === 0 && (
            <p className="text-xs text-muted-foreground">No published datasets. Upload and approve a dataset to display it here.</p>
          )}

          {smallDatasets.length > 0 && (
            <div className="space-y-2">
              {smallDatasets.map((d, idx) => <LayerRow key={d.id} d={d} idx={idx} />)}
            </div>
          )}

          {largeDatasets.length > 0 && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Large datasets (load on demand)</p>
              {largeDatasets.map((d, idx) => <LayerRow key={d.id} d={d} idx={smallDatasets.length + idx} />)}
            </div>
          )}

          <div className="pt-2 border-t space-y-2">
            <div className="flex items-start gap-2">
              <input type="checkbox" id="layer-node-activity" checked={showNodeActivity} onChange={() => setShowNodeActivity((v) => !v)} className="mt-0.5 rounded shrink-0" />
              <label htmlFor="layer-node-activity" className="text-xs font-medium cursor-pointer">
                Node activity {nodeGeoRefs.length > 0 ? `(${nodeGeoRefs.length})` : '(none)'}
                <p className="text-xs text-muted-foreground font-normal">Purple=record · Cyan=notice · Green=project</p>
              </label>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" id="layer-notices" checked={showNotices} onChange={() => setShowNotices((v) => !v)} className="mt-0.5 rounded shrink-0" />
              <label htmlFor="layer-notices" className="text-xs font-medium cursor-pointer">
                Notices {notices.length > 0 ? `(${notices.length})` : '(none)'}
                <p className="text-xs text-muted-foreground font-normal">Red = statutory · Blue = governance</p>
              </label>
            </div>
          </div>
        </div>

        {selectedFeature && (
          <AreaInfoPanel feature={selectedFeature} onClose={() => setSelectedFeature(null)} />
        )}

        {selectedNotice && (
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{selectedNotice.title}</p>
              <button type="button" onClick={() => setSelectedNotice(null)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">✕</button>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="capitalize">{selectedNotice.type.replace(/-/g, ' ')} · {selectedNotice.status}</p>
              {selectedNotice.ward_ref && <p>Ward: {selectedNotice.ward_ref}</p>}
              {selectedNotice.comment_deadline && <p>Deadline: {new Date(selectedNotice.comment_deadline).toLocaleDateString()}</p>}
              {selectedNotice.proximity_radius_metres && (
                <p className="text-violet-700 font-medium">{selectedNotice.proximity_radius_metres}m proximity zone</p>
              )}
            </div>
            <Link href={`/notices/${selectedNotice.id}`} className="text-xs text-blue-600 hover:underline">View notice →</Link>
          </div>
        )}

        {selectedNodeRef && (
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{selectedNodeRef.label}</p>
              <button type="button" onClick={() => setSelectedNodeRef(null)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">✕</button>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="capitalize">{selectedNodeRef.recordType} · Node activity</p>
              <p>Role: {selectedNodeRef.coordinateRole === 'site' ? 'site location' : selectedNodeRef.coordinateRole === 'area-reference' ? 'area reference — not a site location' : 'not specified'}</p>
              <p>Source: {selectedNodeRef.coordinateSource ?? 'not provided'}</p>
              <p>Precision: {selectedNodeRef.locationPrecision ?? 'not declared'}</p>
              {selectedNodeRef.municipality && <p>Municipality: {selectedNodeRef.municipality}</p>}
              {selectedNodeRef.ward && <p>Ward: {selectedNodeRef.ward}</p>}
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
        <MapGL
          className="w-full h-full"
          viewport={viewport}
          onViewportChange={handleViewportChange}
        >
          <MapControls showZoom showCompass />

          {/* Spatial dataset layers */}
          {datasets.map((dataset, idx) => {
            if (!visibleLayers.has(dataset.id)) return null;
            const geojson = loadedGeojson.get(dataset.id) ?? dataset.geojson;
            if (!geojson?.features?.length) return null;
            const colour = spatialLayerColours.get(dataset.id) ?? LAYER_COLOURS[idx % LAYER_COLOURS.length];
            const boundary = isBoundary(dataset.name);
            return (
              <MapGeoJSON
                key={dataset.id}
                id={`dataset-${dataset.id}`}
                data={geojson as Parameters<typeof MapGeoJSON>[0]['data']}
                interactive
                fillPaint={{ 'fill-color': colour, 'fill-opacity': boundary ? 0.04 : 0.2 }}
                linePaint={{ 'line-color': colour, 'line-width': boundary ? 1.5 : 2.5, 'line-opacity': 1 }}
                fillHoverPaint={{ 'fill-opacity': boundary ? 0.1 : 0.35 }}
                promoteId="id"
                onClick={(e: MapGeoJSONEvent) => {
                  setSelectedFeature({
                    datasetName: dataset.name,
                    datasetSource: dataset.source_institution,
                    datasetDate: dataset.dataset_date,
                    properties: (e.feature.properties ?? {}) as Record<string, unknown>,
                  });
                  setSelectedNotice(null);
                  setSelectedNodeRef(null);
                }}
              />
            );
          })}

          {/* Notice markers */}
          {showNotices && notices.map((notice) => (
            <MapMarker
              key={notice.id}
              longitude={notice.longitude}
              latitude={notice.latitude}
              onClick={() => {
                setSelectedNotice(notice);
                setSelectedFeature(null);
                setSelectedNodeRef(null);
              }}
            >
              <MarkerContent>
                <span
                  className="block rounded-full border-2 border-white shadow-md cursor-pointer"
                  style={{
                    width: notice.is_statutory ? 16 : 12,
                    height: notice.is_statutory ? 16 : 12,
                    backgroundColor: noticeColour(notice.is_statutory),
                  }}
                />
              </MarkerContent>
            </MapMarker>
          ))}

          {/* Node activity markers */}
          {showNodeActivity && nodeGeoRefs.map((ref) => (
            <MapMarker
              key={`${ref.nodeId}-${ref.recordId}`}
              longitude={ref.longitude}
              latitude={ref.latitude}
              onClick={() => {
                setSelectedNodeRef(ref);
                setSelectedFeature(null);
                setSelectedNotice(null);
              }}
            >
              <MarkerContent>
                <span
                  className="block border-2 border-white shadow cursor-pointer"
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: NODE_TYPE_COLOUR[ref.recordType] ?? '#6366f1',
                    transform: 'rotate(45deg)',
                    borderRadius: 2,
                  }}
                />
              </MarkerContent>
            </MapMarker>
          ))}
        </MapGL>

        {(mapLayerError || permissionFiltered || loadingLayers.size > 0) && (
          <div className="absolute bottom-3 left-3 z-10 max-w-[min(32rem,70%)] rounded bg-background/95 px-2.5 py-1.5 text-xs shadow">
            {loadingLayers.size > 0 && !mapLayerError && (
              <span className="text-muted-foreground">Loading spatial layers…</span>
            )}
            {mapLayerError && (
              <span className="text-amber-700">Spatial layers unavailable: {mapLayerError}</span>
            )}
            {permissionFiltered && !mapLayerError && (
              <span className="text-amber-700">Some datasets withheld pending redistribution permission.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
