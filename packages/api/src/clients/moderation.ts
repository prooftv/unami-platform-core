import { apiFetch, type ApiConfig } from '../http';
import type { Message, Advisory, PaginatedResponse } from '../types/index';
import type { ModerationStatus } from '@moments/shared';

export interface ModerationStats {
  pendingMessages: number;
  escalatedAdvisories: number;
  approvedToday: number;
  rejectedToday: number;
  oldestPendingAge: number | null; // minutes
  avgReviewTime7d: number | null;  // minutes
}

export function createModerationClient(config: ApiConfig) {
  return {
    listMessages(params?: { page?: number; limit?: number; status?: ModerationStatus }): Promise<PaginatedResponse<Message>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/moderation/messages${qs}`);
    },

    listAdvisories(params?: { page?: number; limit?: number; escalated?: boolean }): Promise<PaginatedResponse<Advisory>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/moderation/advisories${qs}`);
    },

    stats(): Promise<ModerationStats> {
      return apiFetch(config, '/moderation/stats');
    },

    approve(messageId: string): Promise<Message> {
      return apiFetch(config, `/moderation/messages/${messageId}/approve`, { method: 'POST' });
    },

    reject(messageId: string): Promise<Message> {
      return apiFetch(config, `/moderation/messages/${messageId}/reject`, { method: 'POST' });
    },
  };
}
