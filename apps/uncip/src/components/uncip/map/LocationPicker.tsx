'use client';

/**
 * LocationPicker — Leaflet map for explicit coordinate selection.
 *
 * The user clicks the map to place a pin. Coordinates are stored as hidden
 * form inputs (lat/lng). No device geolocation. No geocoding.
 *
 * The human-readable location description is a separate TEXT field — this
 * component only captures the optional spatial coordinate.
 *
 * Tile provider: OpenStreetMap (no API key required).
 * The tile URL is isolated here so it can be replaced without touching
 * any other component.
 */

import { useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Default centre: Johannesburg (Soweto area)
const DEFAULT_CENTER: [number, number] = [-26.2485, 27.8546];
const DEFAULT_ZOOM = 13;

// OSM tile URL — replaceable without touching map logic
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

interface Props {
  /** Hidden input name for lat */
  latName: string;
  /** Hidden input name for lng */
  lngName: string;
  /** Initial coordinates (e.g. when editing) */
  initialLat?: number | null;
  initialLng?: number | null;
}

export function LocationPicker({ latName, lngName, initialLat, initialLng }: Props) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{ map: L.Map; marker: L.Marker | null } | null>(null);

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null,
  );
  const [open, setOpen] = useState(false);

  // Dynamically import Leaflet (client-only, avoids SSR issues)
  useEffect(() => {
    if (!open || !mapRef.current || leafletRef.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;

      // Leaflet CSS — injected once
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css';
        link.rel  = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const center: [number, number] = pin ? [pin.lat, pin.lng] : DEFAULT_CENTER;
      const map = L.map(mapRef.current!).setView(center, DEFAULT_ZOOM);

      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);

      let marker: L.Marker | null = null;

      if (pin) {
        marker = L.marker([pin.lat, pin.lng]).addTo(map);
      }

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng]).addTo(map);
        }
        leafletRef.current!.marker = marker;
        setPin({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
      });

      leafletRef.current = { map, marker };
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Clean up map on close
  function handleClose() {
    if (leafletRef.current) {
      leafletRef.current.map.remove();
      leafletRef.current = null;
    }
    setOpen(false);
  }

  function handleClear() {
    setPin(null);
    if (leafletRef.current?.marker) {
      leafletRef.current.marker.remove();
      leafletRef.current.marker = null;
    }
  }

  return (
    <div className="space-y-2">
      {/* Hidden inputs — submitted with the form */}
      <input type="hidden" name={latName} value={pin?.lat ?? ''} />
      <input type="hidden" name={lngName} value={pin?.lng ?? ''} />

      {pin ? (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground font-mono">
            {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
          </span>
          <Button type="button" variant="ghost" size="sm" className="h-6 px-1" onClick={handleClear}>
            <X className="h-3 w-3" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            Move pin
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <MapPin className="h-4 w-4 mr-1" />
          Set location on map
        </Button>
      )}

      {open && (
        <div className="space-y-2">
          <div
            ref={mapRef}
            className="h-64 w-full rounded-md border overflow-hidden"
            style={{ zIndex: 0 }}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Click the map to place a pin</span>
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
