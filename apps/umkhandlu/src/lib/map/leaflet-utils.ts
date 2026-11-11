/**
 * Shared Leaflet primitives for the Control Centre spatial map.
 * No domain knowledge. No Supabase. No React.
 * Mirrors umkhandlu-node/src/lib/map/leaflet-utils.ts — both apps own their copy.
 */

import type L from 'leaflet';

export const OSM_TILE_URL =
	'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
	'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Inject Leaflet CSS once per page. */
export function loadLeafletCss() {
	if (document.querySelector('link[href*="leaflet"]')) return;
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
	document.head.appendChild(link);
}

/** Create a map with OSM tiles. scrollWheelZoom defaults to false. */
export function createMap(
	Leaf: typeof L,
	container: HTMLDivElement,
	centre: [number, number],
	zoom: number,
	options: {
		scrollWheelZoom?: boolean;
		dragging?: boolean;
		zoomControl?: boolean;
	} = {},
): L.Map {
	const map = Leaf.map(container, {
		scrollWheelZoom: options.scrollWheelZoom ?? false,
		dragging: options.dragging ?? true,
		zoomControl: options.zoomControl ?? true,
	}).setView(centre, zoom);
	Leaf.tileLayer(OSM_TILE_URL, {
		attribution: OSM_ATTRIBUTION,
		maxZoom: 19,
	}).addTo(map);
	return map;
}

/** Fit map to a GeoJSON layer's bounds with padding. */
export function fitToLayer(
	map: L.Map,
	layer: L.GeoJSON,
	padding: [number, number] = [40, 40],
	maxZoom = 14,
) {
	try {
		const bounds = layer.getBounds();
		if (bounds.isValid()) map.fitBounds(bounds, { padding, maxZoom });
	} catch {}
}
