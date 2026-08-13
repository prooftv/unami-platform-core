'use client';

/**
 * UNCIPMap — role-scoped spatial projection of UNCIP records.
 *
 * Internal roles (admin/authority/school/parent):
 *   Alert pins with role-appropriate detail — alert type, status, last-seen
 *   location description, and a link to the full alert record.
 *
 * Community role:
 *   De-identified pins only. No child identity, no case number, no school
 *   relationship, no parent contact. Alert type + status + public narrative only.
 *
 * Sighting pins (from timeline) are plotted separately where coordinates exist.
 *
 * The map consumes UNCIP records — it is not a separate data source.
 */

import { useEffect, useRef } from 'react';
import type { UNCIPAlert, UNCIPRole } from '@unami/api';

// OSM tile URL — isolated for replaceability
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Default centre: Johannesburg
const DEFAULT_CENTER: [number, number] = [-26.2041, 28.0473];
const DEFAULT_ZOOM = 10;

const STATUS_COLORS: Record<string, string> = {
  active:      '#ef4444',
  resolved:    '#22c55e',
  cancelled:   '#6b7280',
  false_alarm: '#f59e0b',
};

interface Props {
  alerts: UNCIPAlert[];
  role: UNCIPRole;
}

export function UNCIPMap({ alerts, role }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<{ map: L.Map } | null>(null);

  const isCommunity = role === 'community';

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id   = 'leaflet-css';
        link.rel  = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION }).addTo(map);

      const plotted: [number, number][] = [];

      for (const alert of alerts) {
        // Alert-level pin (last seen location)
        if (alert.lastSeenLat != null && alert.lastSeenLng != null) {
          const color = STATUS_COLORS[alert.status] ?? '#6b7280';

          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width:14px;height:14px;border-radius:50%;
              background:${color};border:2px solid white;
              box-shadow:0 1px 3px rgba(0,0,0,.4)
            "></div>`,
            iconSize:   [14, 14],
            iconAnchor: [7, 7],
          });

          const popup = isCommunity
            ? buildCommunityPopup(alert)
            : buildInternalPopup(alert);

          L.marker([alert.lastSeenLat, alert.lastSeenLng], { icon })
            .bindPopup(popup)
            .addTo(map);

          plotted.push([alert.lastSeenLat, alert.lastSeenLng]);
        }

        // Sighting pins from timeline (community role excluded from sighting detail)
        if (!isCommunity && alert.uncipAlertTimeline) {
          for (const entry of alert.uncipAlertTimeline) {
            if (
              entry.action === 'community_sighting_reported' &&
              entry.sightingLat != null &&
              entry.sightingLng != null
            ) {
              const icon = L.divIcon({
                className: '',
                html: `<div style="
                  width:10px;height:10px;border-radius:50%;
                  background:#8b5cf6;border:2px solid white;
                  box-shadow:0 1px 3px rgba(0,0,0,.4)
                "></div>`,
                iconSize:   [10, 10],
                iconAnchor: [5, 5],
              });

              const ts = new Date(entry.timestamp).toLocaleString();
              L.marker([entry.sightingLat, entry.sightingLng], { icon })
                .bindPopup(`
                  <strong>Sighting reported</strong><br/>
                  ${entry.sightingLocation ? `<em>${entry.sightingLocation}</em><br/>` : ''}
                  ${ts}
                  ${entry.note ? `<br/>${entry.note}` : ''}
                `)
                .addTo(map);

              plotted.push([entry.sightingLat, entry.sightingLng]);
            }
          }
        }
      }

      // Fit bounds to plotted pins if any
      if (plotted.length > 0) {
        map.fitBounds(L.latLngBounds(plotted), { padding: [40, 40], maxZoom: 14 });
      }

      instanceRef.current = { map };
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapRef}
      className="h-[calc(100svh-var(--dashboard-header-height,3rem)-10rem)] min-h-96 w-full rounded-md border"
      style={{ zIndex: 0 }}
    />
  );
}

// ─── Popup builders ──────────────────────────────────────────────────────────

function buildInternalPopup(alert: UNCIPAlert): string {
  const ts = new Date(alert.lastSeenAt).toLocaleString();
  return `
    <div style="min-width:180px">
      <strong>${alert.alertType.replace('_', ' ').toUpperCase()}</strong>
      <span style="margin-left:6px;padding:1px 6px;border-radius:9999px;font-size:11px;
        background:${STATUS_COLORS[alert.status] ?? '#6b7280'};color:white">
        ${alert.status}
      </span><br/>
      <em style="font-size:12px">${alert.lastSeenLocation}</em><br/>
      <span style="font-size:11px;color:#6b7280">Last seen: ${ts}</span><br/>
      <a href="/alerts/${alert.id}" style="font-size:12px;color:#2563eb">View alert →</a>
    </div>
  `;
}

function buildCommunityPopup(alert: UNCIPAlert): string {
  // Community projection: no child identity, no case number, no school, no parent contact
  const ts = new Date(alert.lastSeenAt).toLocaleString();
  return `
    <div style="min-width:160px">
      <strong>${alert.alertType.replace('_', ' ').toUpperCase()}</strong>
      <span style="margin-left:6px;padding:1px 6px;border-radius:9999px;font-size:11px;
        background:${STATUS_COLORS[alert.status] ?? '#6b7280'};color:white">
        ${alert.status}
      </span><br/>
      <em style="font-size:12px">${alert.lastSeenLocation}</em><br/>
      <span style="font-size:11px;color:#6b7280">Reported: ${ts}</span>
    </div>
  `;
}
