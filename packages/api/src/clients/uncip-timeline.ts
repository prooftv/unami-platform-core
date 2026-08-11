import { apiFetch, type ApiConfig } from '../http';
import type { AlertTimelineAction, UNCIPAlertTimelineEntry, UNCIPRole } from './uncip-alerts';

export interface AddTimelineEntryInput {
  alertId: string;
  // alert_raised and status_changed are owned by the alerts function — not accepted here
  action: Exclude<AlertTimelineAction, 'alert_raised' | 'status_changed'>;
  note?: string | null;
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
          alert_id: input.alertId,
          action:   input.action,
          note:     input.note ?? null,
        }),
      });
    },
  };
}

export type { AlertTimelineAction, UNCIPAlertTimelineEntry, UNCIPRole };
