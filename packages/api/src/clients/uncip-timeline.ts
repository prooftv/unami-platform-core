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

export function createUNCIPTimelineClient(config: ApiConfig) {
  return {
    list(alertId: string): Promise<{ data: UNCIPAlertTimelineEntry[] }> {
      return apiFetch(config, `/uncip-timeline?alert_id=${alertId}`);
    },

    add(input: AddTimelineEntryInput): Promise<{ data: UNCIPAlertTimelineEntry }> {
      return apiFetch(config, '/uncip-timeline', {
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
      });
    },
  };
}

export type { AlertTimelineAction, UNCIPAlertTimelineEntry, UNCIPRole };
