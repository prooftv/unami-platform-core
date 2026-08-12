import { apiFetch, type ApiConfig } from '../http';
import type { PaginatedResponse } from '../types/index';

export type AlertType   = 'missing' | 'medical' | 'danger' | 'other';
export type AlertStatus = 'active' | 'resolved' | 'cancelled' | 'false_alarm';

export type AlertTimelineAction =
  | 'alert_raised'
  | 'school_confirmed_last_seen'
  | 'authority_assigned_case'
  | 'community_sighting_reported'
  | 'status_changed'
  | 'note_added';

export type UNCIPRole = 'admin' | 'parent' | 'school' | 'authority' | 'community';

export interface UNCIPAlertTimelineEntry {
  id: string;
  alertId: string;
  actorId: string;
  actorRole: UNCIPRole;
  action: AlertTimelineAction;
  note: string | null;
  caseNumber: string | null;
  sightingLocation: string | null;
  sightingLat: number | null;
  sightingLng: number | null;
  timestamp: string;
}

export interface UNCIPAlert {
  id: string;
  childId: string;
  alertType: AlertType;
  status: AlertStatus;
  description: string;
  lastSeenAt: string;
  lastSeenLocation: string;
  lastSeenLat: number | null;
  lastSeenLng: number | null;
  lastSeenWearing: string | null;
  contactPhone: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  // Joined — present on detail
  uncipAlertTimeline?: UNCIPAlertTimelineEntry[];
}

export interface CreateAlertInput {
  childId: string;
  alertType: AlertType;
  description: string;
  lastSeenAt: string;
  lastSeenLocation: string;
  lastSeenLat?: number | null;
  lastSeenLng?: number | null;
  lastSeenWearing?: string | null;
  contactPhone: string;
}

// Decision 3b: parent may only use cancelled/false_alarm — authority uses resolved
// The type reflects the full set; the Edge Function enforces role restrictions
export interface ChangeAlertStatusInput {
  status: Exclude<AlertStatus, 'active'>;
  note?: string | null;
}

export interface ListAlertsParams {
  page?: number;
  limit?: number;
  status?: AlertStatus;
  alertType?: AlertType;
  childId?: string;
}

export function createUNCIPAlertsClient(config: ApiConfig) {
  return {
    list(params?: ListAlertsParams): Promise<PaginatedResponse<UNCIPAlert>> {
      const raw: Record<string, string> = {};
      if (params?.page)      raw.page       = String(params.page);
      if (params?.limit)     raw.limit      = String(params.limit);
      if (params?.status)    raw.status     = params.status;
      if (params?.alertType) raw.alert_type = params.alertType;
      if (params?.childId)   raw.child_id   = params.childId;
      const qs = Object.keys(raw).length ? '?' + new URLSearchParams(raw).toString() : '';
      return apiFetch(config, `/uncip-alerts${qs}`);
    },

    get(id: string): Promise<{ data: UNCIPAlert }> {
      return apiFetch(config, `/uncip-alerts/${id}`);
    },

    create(input: CreateAlertInput): Promise<{ data: UNCIPAlert }> {
      return apiFetch(config, '/uncip-alerts', {
        method: 'POST',
        body: JSON.stringify({
          child_id:           input.childId,
          alert_type:         input.alertType,
          description:        input.description,
          last_seen_at:       input.lastSeenAt,
          last_seen_location: input.lastSeenLocation,
          last_seen_lat:      input.lastSeenLat ?? null,
          last_seen_lng:      input.lastSeenLng ?? null,
          last_seen_wearing:  input.lastSeenWearing ?? null,
          contact_phone:      input.contactPhone,
        }),
      });
    },

    changeStatus(id: string, input: ChangeAlertStatusInput): Promise<{ data: UNCIPAlert }> {
      return apiFetch(config, `/uncip-alerts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: input.status,
          note:   input.note ?? null,
        }),
      });
    },
  };
}
