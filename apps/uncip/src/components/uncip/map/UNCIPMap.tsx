'use client';

/**
 * UNCIPMap — role-scoped spatial projection of UNCIP records.
 *
 * Internal roles: alert pins with full detail + sighting pins from timeline.
 * Community role: de-identified pins only — no child identity, no case number.
 */

import type { UNCIPAlert, UNCIPRole } from '@unami/api';
import { Map, MapTileLayer, MapMarker, MapPopup, MapZoomControl, MapFitBounds } from '@/components/ui/map';
import { Badge } from '@/components/ui/badge';

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

function DotIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
      }}
    />
  );
}

export function UNCIPMap({ alerts, role }: Props) {
  const isCommunity = role === 'community';
  const plotted: [number, number][] = [];

  // Collect all positions for fitBounds
  for (const alert of alerts) {
    if (alert.lastSeenLat != null && alert.lastSeenLng != null) {
      plotted.push([alert.lastSeenLat, alert.lastSeenLng]);
    }
    if (!isCommunity && alert.uncipAlertTimeline) {
      for (const entry of alert.uncipAlertTimeline) {
        if (entry.action === 'community_sighting_reported' && entry.sightingLat != null && entry.sightingLng != null) {
          plotted.push([entry.sightingLat, entry.sightingLng]);
        }
      }
    }
  }

  return (
    <Map center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full">
      <MapTileLayer />
      <MapZoomControl position="bottomright" />
      {plotted.length > 0 && <MapFitBounds positions={plotted} />}

      {alerts.map((alert) => (
        <AlertMarkers key={alert.id} alert={alert} isCommunity={isCommunity} />
      ))}
    </Map>
  );
}

function AlertMarkers({ alert, isCommunity }: { alert: UNCIPAlert; isCommunity: boolean }) {
  const color = STATUS_COLORS[alert.status] ?? '#6b7280';
  const ts = new Date(alert.lastSeenAt).toLocaleString();
  const label = alert.alertType.replace('_', ' ').toUpperCase();

  return (
    <>
      {alert.lastSeenLat != null && alert.lastSeenLng != null && (
        <MapMarker
          position={[alert.lastSeenLat, alert.lastSeenLng]}
          icon={<DotIcon color={color} size={14} />}
          iconSize={[14, 14]}
        >
          <MapPopup>
            <div className="min-w-[180px] space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{label}</span>
                <Badge style={{ background: color }} className="text-white text-[11px]">
                  {alert.status}
                </Badge>
              </div>
              <p className="text-muted-foreground italic text-xs">{alert.lastSeenLocation}</p>
              <p className="text-muted-foreground text-xs">
                {isCommunity ? 'Reported' : 'Last seen'}: {ts}
              </p>
              {!isCommunity && (
                <a href={`/alerts/${alert.id}`} className="text-xs text-blue-600 hover:underline">
                  View alert →
                </a>
              )}
            </div>
          </MapPopup>
        </MapMarker>
      )}

      {!isCommunity && alert.uncipAlertTimeline?.map((entry, i) => {
        if (
          entry.action !== 'community_sighting_reported' ||
          entry.sightingLat == null ||
          entry.sightingLng == null
        ) return null;

        const sightingTs = new Date(entry.timestamp).toLocaleString();
        return (
          <MapMarker
            key={i}
            position={[entry.sightingLat, entry.sightingLng]}
            icon={<DotIcon color="#8b5cf6" size={10} />}
            iconSize={[10, 10]}
          >
            <MapPopup>
              <div className="min-w-[160px] space-y-1 text-sm">
                <p className="font-semibold">Sighting reported</p>
                {entry.sightingLocation && (
                  <p className="text-muted-foreground italic text-xs">{entry.sightingLocation}</p>
                )}
                <p className="text-muted-foreground text-xs">{sightingTs}</p>
                {entry.note && <p className="text-xs">{entry.note}</p>}
              </div>
            </MapPopup>
          </MapMarker>
        );
      })}
    </>
  );
}
