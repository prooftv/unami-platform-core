import { apiFetch, type ApiConfig } from '../http.js';
import type { Broadcast, BroadcastWithMoment, PaginatedResponse, BroadcastResult } from '../types/index.js';

export function createBroadcastsClient(config: ApiConfig) {
  return {
    trigger(momentId: string): Promise<BroadcastResult> {
      return apiFetch(config, `/broadcast/${momentId}`, { method: 'POST' });
    },

    list(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<BroadcastWithMoment>> {
      const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return apiFetch(config, `/broadcasts${qs}`);
    },

    get(id: string): Promise<Broadcast> {
      return apiFetch(config, `/broadcasts/${id}`);
    },
  };
}
