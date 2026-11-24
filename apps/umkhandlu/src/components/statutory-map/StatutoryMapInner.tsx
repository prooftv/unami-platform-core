'use client';

import type * as GeoJSON from 'geojson';
import { useState, useCallback } from 'react';
import {
  Map,
  MapMarker,
  MapGeoJSON,
} from '@/components/ui/map';
import type { StatutoryMapSubject, StatutoryMapLayer } from './StatutoryMap';

interface Props {
  subject: StatutoryMapSubject;
  layers: StatutoryMapLayer[];
  height: string;
}

interface FeaturePopup {
  lng: number;
  lat: number;
  properties: Record<string, unknown>;
  layerName: string;
}

const ROLE_COLOUR: Record<string, string> = {
  administrative: '#f97316',
  community: '#8b5cf6',
  proximity: '#ef4444',
  environmental: '#22c55e',
  infrastructure: '#3b82f6',
  context: '#6b7280',
  site: '#06b6d4',
};

function featureLabel(properties: Record<string, unknown>): string {
  const candidates = ['NAMECODE', 'MUNICNAME', 'Ward_Label', 'name', 'NAME', 'WardNo'];
  for (const key of candidates) {
    const val = properties[key];
    if (val != null && String(val).trim()) return String(val);
  }
  return 'Feature';
}

function FeatureInspector({ popup, onClose }: { popup: FeaturePopup; onClose: () => void }) {
  const entries = Object.entries(popup.properties).filter(
    ([, v]) => v != null && String(v).trim() !== '',
  ).slice(0, 8);
  return (
    <div className="absolute bottom-3 left-3 z-10 max-w-[260px] rounded-lg border bg-white/97 shadow-lg text-xs">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
        <span className="font-semibold text-gray-800 truncate">{popup.layerName}</span>
        <button type="button" onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-700 text-sm leading-none">✕</button>
      </div>
      <div className="px-3 py-2 space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span className="text-gray-400 shrink-0 w-20 truncate">{k}</span>
            <span className="text-gray-700 truncate">{String(v)}</span>
          </div>
        ))}
        {entries.length === 0 && <p className="text-gray-400">No properties</p>}
      </div>
    </div>
  );
}

function LayerLegend({ layers, visibility, onToggle }: {
  layers: StatutoryMapLayer[];
  visibility: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const renderable = layers.filter((l) => l.availability === 'available' && l.geojson?.features.length);
  const unavailable = layers.filter((l) => l.availability !== 'available');

  if (!renderable.length && !unavailable.length) return null;

  return (
    <div className="absolute top-3 right-3 z-10 max-w-[200px] rounded-lg border bg-white/97 shadow text-xs">
      {renderable.length > 0 && (
        <div className="px-3 py-2 space-y-1.5">
          {renderable.map((layer) => {
            const colour = ROLE_COLOUR[layer.role] ?? layer.colour;
            const on = visibility[layer.id] ?? true;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onToggle(layer.id)}
                className={`flex w-full items-center gap-2 text-left transition-opacity ${on ? 'opacity-100' : 'opacity-40'}`}
              >
                <span
                  className="shrink-0 size-2.5 rounded-sm border"
                  style={{ background: on ? colour : 'transparent', borderColor: colour }}
                />
                <span className="truncate text-gray-700">{layer.name}</span>
              </button>
            );
          })}
        </div>
      )}
      {unavailable.length > 0 && (
        <div className="border-t px-3 py-2 space-y-1">
          {unavailable.map((layer) => (
            <div key={layer.id} className="flex items-center gap-2 opacity-50">
              <span className="shrink-0 size-2.5 rounded-sm border border-gray-300" />
              <span className="truncate text-gray-500">{layer.name}</span>
              <span className="ml-auto shrink-0 text-[10px] text-amber-600">
                {layer.availability === 'pending-permission' ? 'pending' : 'unavailable'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatutoryMapInner({ subject, layers, height }: Props) {
  const centre: [number, number] = [subject.lng, subject.lat];
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [popup, setPopup] = useState<FeaturePopup | null>(null);

  const toggleLayer = useCallback((id: string) => {
    setVisibility((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }, []);

  const renderableLayers = layers.filter(
    (l) => l.availability === 'available' && l.geojson && l.geojson.features.length > 0,
  );

  return (
    <div style={{ height }} className="relative overflow-hidden rounded-lg border">
      <Map
        center={centre}
        zoom={13}
        className="w-full h-full"
      >
        {renderableLayers.map((layer) => {
          if (!(visibility[layer.id] ?? true)) return null;
          const colour = ROLE_COLOUR[layer.role] ?? layer.colour;
          return (
            <MapGeoJSON
              key={layer.id}
              id={layer.id}
              data={layer.geojson as GeoJSON.FeatureCollection}
              fillPaint={{ 'fill-color': colour, 'fill-opacity': 0.15 }}
              linePaint={{ 'line-color': colour, 'line-width': 1.5 }}
              interactive
              onClick={(e) => {
                setPopup({
                  lng: e.longitude,
                  lat: e.latitude,
                  properties: (e.feature.properties ?? {}) as Record<string, unknown>,
                  layerName: layer.name,
                });
              }}
            />
          );
        })}

        {subject.proximityRadiusMetres != null && (
          <MapGeoJSON
            id="proximity-circle"
            data={buildCircleGeoJSON(subject.lng, subject.lat, subject.proximityRadiusMetres)}
            fillPaint={{ 'fill-color': '#7c3aed', 'fill-opacity': 0.06 }}
            linePaint={{ 'line-color': '#7c3aed', 'line-width': 2, 'line-dasharray': [4, 3] }}
          />
        )}

        <MapMarker longitude={centre[0]} latitude={centre[1]}>
          <div
            title={subject.label}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: subject.coordinateRole === 'area-reference' ? '#f59e0b' : '#dc2626',
              border: '2.5px solid white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }}
          />
        </MapMarker>
      </Map>

      <LayerLegend layers={layers} visibility={visibility} onToggle={toggleLayer} />

      {popup && (
        <FeatureInspector popup={popup} onClose={() => setPopup(null)} />
      )}

      {subject.proximityRadiusMetres != null && subject.proximityRadiusNote && (
        <div className="absolute bottom-3 right-3 z-10 max-w-[200px] rounded border border-violet-200 bg-violet-50/95 px-2 py-1 text-[10px] text-violet-700 shadow">
          {subject.proximityRadiusNote}
        </div>
      )}
    </div>
  );
}

function buildCircleGeoJSON(
  lng: number,
  lat: number,
  radiusMetres: number,
  steps = 64,
): GeoJSON.FeatureCollection {
  const coords: [number, number][] = [];
  const earthRadius = 6371000;
  const latRad = (lat * Math.PI) / 180;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusMetres * Math.cos(angle)) / earthRadius;
    const dLng = (radiusMetres * Math.sin(angle)) / (earthRadius * Math.cos(latRad));
    coords.push([lng + (dLng * 180) / Math.PI, lat + (dLat * 180) / Math.PI]);
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      },
    ],
  };
}
