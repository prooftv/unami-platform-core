import { apiFetch, type ApiConfig } from '../http';
import type { AlertTimelineAction, UNCIPAlertTimelineEntry, UNCIPRole } from './uncip-alerts';

export interface AddTimelineEntryInput {
  alertId: string;
  // alert_raised and status_changed are owned by the alerts function — not accepted here
  action: Exclude<AlertTimelineAction, 'alert_raised' | 'status_changed'>;
  note?: string | null;
  /** Populated for authority_assigned_case only */
  caseNumber?: string | null;
  /** Populated for community_sighting_reported only */
  sightingLocation?: string | null;
  sightingLat?: number | null;
  sightingLng?: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WireRecord = Record<string, any>;

function fromWire(t: WireRecord): UNCIPAlertTimelineEntry {
  return {
    id:               t.id,
    alertId:          t.alert_id,
    actorId:          t.actor_id,
    actorRole:        t.actor_role,
    actorName:        t.actor_name ?? null,
    action:           t.action,
    note:             t.note ?? null,
    caseNumber:       t.case_number ?? null,
    sightingLocation: t.sighting_location ?? null,
    sightingLat:      t.sighting_lat ?? null,
    sightingLng:      t.sighting_lng ?? null,
    timestamp:        t.timestamp,
  };
}

export function createUNCIPTimelineClient(config: ApiConfig) {
  return {
    list(alertId: string): Promise<{ data: UNCIPAlertTimelineEntry[] }> {
      return apiFetch<{ data: WireRecord[] }>(config, `/uncip-timeline?alert_id=${alertId}`)
        .then(r => ({ data: r.data.map(fromWire) }));
    },

    add(input: AddTimelineEntryInput): Promise<{ data: UNCIPAlertTimelineEntry }> {
      return apiFetch<{ data: WireRecord }>(config, '/uncip-timeline', {
        method: 'POST',
        body: JSON.stringify({
          alert_id:          input.alertId,
          action:            input.action,
          note:              input.note ?? null,
          case_number:       input.caseNumber ?? null,
          sighting_location: input.sightingLocation ?? null,
          sighting_lat:      input.sightingLat ?? null,
          sighting_lng:      input.sightingLng ?? null,
        }),
      }).then(r => ({ data: fromWire(r.data) }));
    },
  };
}

export type { AlertTimelineAction, UNCIPAlertTimelineEntry, UNCIPRole };
