'use client';

/**
 * shadcn-map style components for UNCIP.
 * Wraps react-leaflet with shadcn/ui-compatible defaults.
 * Requires leaflet CSS to be loaded (handled by MapTileLayer).
 */

import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { MapContainerProps, TileLayerProps, MarkerProps, PopupProps } from 'react-leaflet';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import L from 'leaflet';

// ─── Leaflet CSS (injected once) ─────────────────────────────────────────────

function LeafletCSS() {
  React.useEffect(() => {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);
  return null;
}

// ─── Map ─────────────────────────────────────────────────────────────────────

type MapProps = Omit<MapContainerProps, 'zoomControl'> & {
  className?: string;
};

function Map({ className, children, ...props }: MapProps) {
  return (
    <>
      <LeafletCSS />
      <MapContainer
        zoomControl={false}
        className={cn('h-full w-full rounded-md border', className)}
        style={{ zIndex: 0 }}
        {...props}
      >
        {children}
      </MapContainer>
    </>
  );
}

// ─── MapTileLayer ─────────────────────────────────────────────────────────────

const LIGHT_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_URL  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

type MapTileLayerProps = Omit<TileLayerProps, 'url'> & {
  url?: string;
  darkUrl?: string;
  attribution?: string;
  darkAttribution?: string;
};

function MapTileLayer({ url, darkUrl, attribution, darkAttribution, ...props }: MapTileLayerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <TileLayer
      url={isDark ? (darkUrl ?? DARK_URL) : (url ?? LIGHT_URL)}
      attribution={isDark ? (darkAttribution ?? ATTRIBUTION) : (attribution ?? ATTRIBUTION)}
      {...props}
    />
  );
}

// ─── MapMarker ────────────────────────────────────────────────────────────────

type MapMarkerProps = Omit<MarkerProps, 'icon'> & {
  icon?: React.ReactNode;
  iconSize?: [number, number];
  iconAnchor?: [number, number];
  popupAnchor?: [number, number];
  children?: React.ReactNode;
};

function MapMarker({
  icon,
  iconSize = [14, 14],
  iconAnchor,
  popupAnchor = [0, -8],
  children,
  ...props
}: MapMarkerProps) {
  const anchor = iconAnchor ?? ([iconSize[0] / 2, iconSize[1] / 2] as [number, number]);

  const divIcon = React.useMemo(() => {
    if (!icon) return undefined;
    const container = document.createElement('div');
    // We render the icon as an HTML string if it's a string, otherwise use a placeholder
    // For React nodes we use renderToStaticMarkup via a portal approach
    return L.divIcon({
      className: '',
      html: typeof icon === 'string' ? icon : (icon as { props?: { dangerouslySetInnerHTML?: { __html: string } } })?.props?.dangerouslySetInnerHTML?.__html ?? container.outerHTML,
      iconSize,
      iconAnchor: anchor,
      popupAnchor,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icon, iconSize[0], iconSize[1], anchor[0], anchor[1]]);

  return (
    <Marker icon={divIcon} {...props}>
      {children}
    </Marker>
  );
}

// ─── MapPopup ─────────────────────────────────────────────────────────────────

type MapPopupProps = Omit<PopupProps, 'content'> & {
  children?: React.ReactNode;
};

function MapPopup({ children, ...props }: MapPopupProps) {
  return <Popup {...props}>{children}</Popup>;
}

// ─── MapZoomControl ───────────────────────────────────────────────────────────

function MapZoomControl({ position = 'bottomright' }: { position?: L.ControlPosition }) {
  const map = useMap();
  React.useEffect(() => {
    const ctrl = L.control.zoom({ position });
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map, position]);
  return null;
}

// ─── MapFitBounds ─────────────────────────────────────────────────────────────

function MapFitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (positions.length === 0) return;
    map.fitBounds(L.latLngBounds(positions), { padding: [40, 40], maxZoom: 14 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export { Map, MapTileLayer, MapMarker, MapPopup, MapZoomControl, MapFitBounds };
