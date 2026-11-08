'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, Marker } from 'leaflet';

export interface PublishedDataset {
  id: string;
  name: string;
  source_institution: string;
  feature_count: number | null;
  dataset_date: string | null;
  geojson: GeoJSONFeatureCollection | null;
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
}

const AMAJUBA_CENTRE: [number, number] = [-28.05, 29.0];
const AMAJUBA_ZOOM = 9;

const LAYER_COLOURS = [
  '#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed',
  '#0891b2', '#be185d', '#65a30d', '#ea580c', '#6366f1',
];

const noticeColour = (isStatutory: boolean) => isStatutory ? '#dc2626' : '#2563eb';

export function SpatialMap({ datasets, notices }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRefs = useRef<Map<string, LeafletGeoJSON>>(new Map());
  const noticeMarkerRefs = useRef<Marker[]>([]);

  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(datasets.map((d) => d.id)),
  );
  const [showNotices, setShowNotices] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<{
    datasetName: string;
    properties: Record<string, unknown>;
  } | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<NoticeMarker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialise map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    async function init() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, { center: AMAJUBA_CENTRE, zoom: AMAJUBA_ZOOM });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Sync dataset layers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    async function syncLayers() {
      const L = (await import('leaflet')).default;
      const map = mapRef.current!;

      datasets.forEach((dataset, idx) => {
        const colour = LAYER_COLOURS[idx % LAYER_COLOURS.length];
        const existing = layerRefs.current.get(dataset.id);

        if (!visibleLayers.has(dataset.id)) {
          if (existing) { map.removeLayer(existing); layerRefs.current.delete(dataset.id); }
          return;
        }

        if (existing) return;
        if (!dataset.geojson?.features?.length) return;

        const layer = L.geoJSON(dataset.geojson as Parameters<typeof L.geoJSON>[0], {
          style: () => ({ color: colour, weight: 2, opacity: 0.8, fillOpacity: 0.15, fillColor: colour }),
          pointToLayer: (_f, latlng) =>
            L.circleMarker(latlng, { radius: 6, fillColor: colour, color: colour, weight: 1, opacity: 1, fillOpacity: 0.8 }),
          onEachFeature: (feature, fl) => {
            fl.on('click', () => {
              setSelectedFeature({ datasetName: dataset.name, properties: feature.properties ?? {} });
              setSelectedNotice(null);
            });
          },
        });

        layer.addTo(map);
        layerRefs.current.set(dataset.id, layer);
      });
    }

    syncLayers();
  }, [mapReady, datasets, visibleLayers]);

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
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:12px;height:12px;border-radius:50%;background:${colour};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const marker = L.marker([notice.latitude, notice.longitude], { icon });
        marker.on('click', () => {
          setSelectedNotice(notice);
          setSelectedFeature(null);
        });
        marker.addTo(map);
        noticeMarkerRefs.current.push(marker);
      });
    }

    syncNotices();
  }, [mapReady, notices, showNotices]);

  function toggleLayer(id: string) {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function fitToLayer(id: string) {
    const layer = layerRefs.current.get(id);
    const map = mapRef.current;
    if (!layer || !map) return;
    try {
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    } catch { /* empty */ }
  }

  function fitAll() {
    const map = mapRef.current;
    if (!map) return;
    const all = Array.from(layerRefs.current.values());
    if (!all.length) { map.setView(AMAJUBA_CENTRE, AMAJUBA_ZOOM); return; }
    try {
      const bounds = all.reduce((acc, l) => acc.extend(l.getBounds()), all[0].getBounds());
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    } catch { map.setView(AMAJUBA_CENTRE, AMAJUBA_ZOOM); }
  }

  const withData = datasets.filter((d) => d.geojson?.features?.length);
  const noData   = datasets.filter((d) => !d.geojson?.features?.length);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)] min-h-[500px]">
      {/* Sidebar */}
      <div className="lg:w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
        <div className="rounded-lg border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Layers</p>
            <button onClick={fitAll} className="text-xs text-muted-foreground hover:text-foreground underline">
              Fit all
            </button>
          </div>

          {datasets.length === 0 && notices.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No published datasets. Upload and approve a dataset to display it here.
            </p>
          )}

          {withData.map((d, idx) => {
            const colour = LAYER_COLOURS[idx % LAYER_COLOURS.length];
            const visible = visibleLayers.has(d.id);
            return (
              <div key={d.id} className="flex items-start gap-2">
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
                      <span className="text-xs text-muted-foreground">{d.feature_count} features</span>
                    )}
                    <button onClick={() => fitToLayer(d.id)} className="text-xs text-blue-600 hover:underline">
                      Zoom
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {noData.length > 0 && (
            <div className="pt-1 border-t space-y-1">
              <p className="text-xs text-muted-foreground font-medium">No geometry loaded</p>
              {noData.map((d) => (
                <p key={d.id} className="text-xs text-muted-foreground truncate pl-2">— {d.name}</p>
              ))}
            </div>
          )}

          {/* Notices overlay toggle */}
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

        {/* Selected dataset feature inspector */}
        {selectedFeature && (
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{selectedFeature.datasetName}</p>
              <button onClick={() => setSelectedFeature(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(selectedFeature.properties)
                .filter(([, v]) => v != null && v !== '')
                .slice(0, 20)
                .map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="text-muted-foreground shrink-0 w-24 truncate">{k}</span>
                    <span className="truncate">{String(v)}</span>
                  </div>
                ))}
            </div>
          </div>
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
              <button onClick={() => setSelectedNotice(null)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">✕</button>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="capitalize">{selectedNotice.type.replace(/-/g, ' ')} · {selectedNotice.status}</p>
              {selectedNotice.ward_ref && <p>Ward: {selectedNotice.ward_ref}</p>}
              {selectedNotice.comment_deadline && (
                <p>Deadline: {new Date(selectedNotice.comment_deadline).toLocaleDateString()}</p>
              )}
            </div>
            <Link
              href={`/notices/${selectedNotice.id}`}
              className="text-xs text-blue-600 hover:underline"
            >
              View notice →
            </Link>
          </div>
        )}

        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1">Attribution</p>
          {datasets.length === 0
            ? <p className="text-xs text-muted-foreground">No datasets published.</p>
            : datasets.map((d) => (
                <p key={d.id} className="text-xs text-muted-foreground">
                  {d.name}: {d.source_institution}{d.dataset_date ? ` (${d.dataset_date})` : ''}
                </p>
              ))
          }
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-lg border overflow-hidden relative min-h-[400px]">
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <p className="text-sm text-muted-foreground">Loading map…</p>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
