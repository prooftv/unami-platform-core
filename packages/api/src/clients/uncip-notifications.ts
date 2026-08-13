import { apiFetch, type ApiConfig } from '../http';

export interface UNCIPNotification {
  id: string;
  timelineEntryId: string;
  recipientId: string;
  recipientRole: string;
  readAt: string | null;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromWire(r: Record<string, any>): UNCIPNotification {
  return {
    id:               r.id,
    timelineEntryId:  r.timeline_entry_id,
    recipientId:      r.recipient_id,
    recipientRole:    r.recipient_role,
    readAt:           r.read_at ?? null,
    createdAt:        r.created_at,
  };
}

export function createUNCIPNotificationsClient(config: ApiConfig) {
  return {
    listUnread(): Promise<{ data: UNCIPNotification[] }> {
      return apiFetch<{ data: Record<string, unknown>[] }>(config, '/uncip-notifications')
        .then(r => ({ data: r.data.map(fromWire) }));
    },

    markRead(id: string): Promise<void> {
      return apiFetch<void>(config, `/uncip-notifications/${id}/read`, { method: 'PATCH' });
    },
  };
}
