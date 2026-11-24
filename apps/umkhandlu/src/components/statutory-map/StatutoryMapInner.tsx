'use client';

import type * as GeoJSON from 'geojson';
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

export function StatutoryMapInner({ subject, layers, height }: Props) {
  const centre: [number, number] = [subject.lng, subject.lat];

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border">
    <Map
      center={centre}
      zoom={13}
      className="w-full h-full"
    >
      {layers.map((layer) => (
        <MapGeoJSON
          key={layer.id}
          id={layer.id}
          data={layer.geojson as GeoJSON.FeatureCollection}
          fillPaint={{ 'fill-color': layer.colour, 'fill-opacity': 0.15 }}
          linePaint={{ 'line-color': layer.colour, 'line-width': 1.5 }}
        />
      ))}

      {subject.proximityRadiusMetres && (
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
